import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIProvider, parseAIResponse } from '@/lib/ai/provider'
import { generateEvaluationPrompt } from '@/lib/ai/prompts'
import { ExerciseType, GrammarTopic } from '@/types/database'
import { ExerciseResult, ExerciseError, VocabularyItem } from '@/types/exercises'
import { calculateDifficultyAdjustment, calculateProficiency } from '@/lib/algorithms/difficulty'

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createClient() as any
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      exerciseType,
      topic,
      expectedAnswer,
      userAnswer,
      originalPrompt,
      timeTakenSeconds,
      usedHint,
      usedEnglish,
      sessionId,
      difficulty,
    } = body as {
      exerciseType: ExerciseType
      topic: GrammarTopic
      expectedAnswer: string
      userAnswer: string
      originalPrompt: string
      timeTakenSeconds: number
      usedHint: boolean
      usedEnglish: boolean
      sessionId: string
      difficulty: number
    }

    // Use AI to evaluate the answer
    const aiProvider = getAIProvider()
    const prompt = generateEvaluationPrompt({
      exerciseType,
      topic,
      expectedAnswer,
      userAnswer,
      originalPrompt,
    })

    const response = await aiProvider.generate(prompt)
    const evaluation = parseAIResponse<{
      is_correct: boolean
      is_acceptable_alternative: boolean
      errors: Array<{
        type: string
        description_de: string
        description_en: string
        correction: string
      }>
      corrected_version: string
      explanation_de: string
      explanation_en: string
      encouragement_de: string
      vocabulary_to_learn?: Array<{
        de: string
        en: string
        gender?: string
      }>
    }>(response)

    const isCorrect = evaluation.is_correct || evaluation.is_acceptable_alternative

    // Record the exercise in history
    await supabase.from('exercise_history').insert({
      user_id: user.id,
      exercise_type: exerciseType,
      topic_id: topic.id,
      prompt_en: originalPrompt,
      prompt_de: expectedAnswer,
      correct_answer: expectedAnswer,
      user_answer: userAnswer,
      was_correct: isCorrect,
      used_english_help: usedEnglish,
      time_taken_seconds: timeTakenSeconds,
      difficulty_level: difficulty,
      session_id: sessionId,
    })

    // Update user topic progress
    const { data: existingProgress } = await supabase
      .from('user_topic_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('topic_id', topic.id)
      .single()

    if (existingProgress) {
      const newAttempts = existingProgress.attempts + 1
      const newCorrect = existingProgress.correct + (isCorrect ? 1 : 0)

      // Calculate new difficulty
      const adjustment = calculateDifficultyAdjustment({
        topicId: topic.id,
        recentAttempts: newAttempts,
        recentCorrect: newCorrect,
        averageTimeSeconds: timeTakenSeconds,
        currentDifficulty: existingProgress.difficulty_level,
      })

      // Calculate proficiency
      const proficiency = calculateProficiency(
        newAttempts,
        newCorrect,
        adjustment.newDifficulty,
        0 // days since last practice (today = 0)
      )

      await supabase
        .from('user_topic_progress')
        .update({
          attempts: newAttempts,
          correct: newCorrect,
          difficulty_level: adjustment.newDifficulty,
          proficiency,
          last_practiced: new Date().toISOString(),
        })
        .eq('id', existingProgress.id)
    } else {
      // Create new progress record
      await supabase.from('user_topic_progress').insert({
        user_id: user.id,
        topic_id: topic.id,
        attempts: 1,
        correct: isCorrect ? 1 : 0,
        difficulty_level: difficulty,
        proficiency: isCorrect ? 20 : 5,
        last_practiced: new Date().toISOString(),
      })
    }

    // Update daily session
    const today = new Date().toISOString().split('T')[0]
    const { data: existingSession } = await supabase
      .from('daily_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('session_date', today)
      .single()

    if (existingSession) {
      await supabase
        .from('daily_sessions')
        .update({
          exercises_completed: existingSession.exercises_completed + 1,
          exercises_correct: existingSession.exercises_correct + (isCorrect ? 1 : 0),
          minutes_practiced: existingSession.minutes_practiced + Math.ceil(timeTakenSeconds / 60),
        })
        .eq('id', existingSession.id)
    } else {
      await supabase.from('daily_sessions').insert({
        user_id: user.id,
        session_date: today,
        exercises_completed: 1,
        exercises_correct: isCorrect ? 1 : 0,
        minutes_practiced: Math.ceil(timeTakenSeconds / 60),
      })
    }

    // Update streak
    await supabase.rpc('update_streak', { p_user_id: user.id })

    // Track English help usage
    if (usedEnglish) {
      await supabase.rpc('increment', {
        table_name: 'profiles',
        column_name: 'english_help_count',
        row_id: user.id,
      }).catch(() => {
        // Function might not exist, that's ok
      })
    }

    // Update total exercises count
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('total_exercises')
      .eq('id', user.id)
      .single()

    await supabase
      .from('profiles')
      .update({
        total_exercises: (currentProfile?.total_exercises || 0) + 1,
      })
      .eq('id', user.id)

    // Add vocabulary to user's list if provided
    if (evaluation.vocabulary_to_learn && evaluation.vocabulary_to_learn.length > 0) {
      for (const vocab of evaluation.vocabulary_to_learn) {
        // Check if already exists
        const { data: existing } = await supabase
          .from('vocabulary')
          .select('id')
          .eq('user_id', user.id)
          .eq('word_de', vocab.de)
          .single()

        if (!existing) {
          await supabase.from('vocabulary').insert({
            user_id: user.id,
            word_de: vocab.de,
            word_en: vocab.en,
            gender: vocab.gender as 'der' | 'die' | 'das' | null,
          })
        }
      }
    }

    const result: ExerciseResult = {
      is_correct: evaluation.is_correct,
      is_acceptable_alternative: evaluation.is_acceptable_alternative,
      user_answer: userAnswer,
      correct_answer: expectedAnswer,
      errors: evaluation.errors.map((e) => ({
        type: e.type as ExerciseError['type'],
        description_de: e.description_de,
        description_en: e.description_en,
        correction: e.correction,
      })),
      explanation_de: evaluation.explanation_de,
      explanation_en: evaluation.explanation_en,
      encouragement_de: evaluation.encouragement_de,
      vocabulary_to_add: evaluation.vocabulary_to_learn?.map((v) => ({
        word_de: v.de,
        word_en: v.en,
        gender: v.gender as VocabularyItem['gender'],
      })),
    }

    return NextResponse.json({ result })
  } catch (error) {
    console.error('Error evaluating answer:', error)
    return NextResponse.json(
      { error: 'Failed to evaluate answer' },
      { status: 500 }
    )
  }
}
