import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIProvider, parseAIResponse } from '@/lib/ai/provider'
import { generateExercisePrompt } from '@/lib/ai/prompts'
import { ExerciseType, GrammarTopic, Level } from '@/types/database'
import { Context, CONTEXTS, GeneratedExercise } from '@/types/exercises'
import crypto from 'crypto'

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
      topicId,
      difficulty = 2,
    } = body as {
      exerciseType: ExerciseType
      topicId?: number
      difficulty?: number
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_level')
      .eq('id', user.id)
      .single()

    const userLevel: Level = profile?.current_level || 'A1.2'

    // Get topic (either specified or random based on user progress)
    let topic: GrammarTopic | null = null

    if (topicId) {
      const { data } = await supabase
        .from('grammar_topics')
        .select('*')
        .eq('id', topicId)
        .single()
      topic = data
    } else {
      // Get a topic appropriate for user's level with some randomness
      const levelBase = userLevel.substring(0, 2)
      const { data: topics } = await supabase
        .from('grammar_topics')
        .select('*')
        .in('level', levelBase === 'B1' ? ['A1', 'A2', 'B1'] : levelBase === 'A2' ? ['A1', 'A2'] : ['A1'])
        .order('order_index')

      if (topics && topics.length > 0) {
        // Weighted random selection (favor earlier/foundational topics less)
        const randomIndex = Math.floor(Math.random() * topics.length)
        topic = topics[randomIndex]
      }
    }

    if (!topic) {
      return NextResponse.json({ error: 'No topic found' }, { status: 400 })
    }

    // Get recent sentences to avoid
    const { data: recentSentences } = await supabase
      .from('exercise_history')
      .select('prompt_de')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    const avoidSentences = recentSentences
      ?.map((s: { prompt_de: string }) => s.prompt_de)
      .filter(Boolean) as string[]

    // Get weak vocabulary
    const { data: weakVocab } = await supabase
      .from('vocabulary')
      .select('word_de')
      .eq('user_id', user.id)
      .lt('ease_factor', 2.0)
      .limit(5)

    const weakVocabulary = weakVocab?.map((v: { word_de: string }) => v.word_de) || []

    // Random context
    const context: Context = CONTEXTS[Math.floor(Math.random() * CONTEXTS.length)]

    // Generate exercise using AI
    const aiProvider = getAIProvider()
    const prompt = generateExercisePrompt({
      exerciseType,
      topic,
      level: userLevel,
      context,
      difficulty,
      weakVocabulary,
      avoidSentences,
    })

    const response = await aiProvider.generate(prompt)
    const generated = parseAIResponse<{
      sentence_de: string
      sentence_en: string
      correct_answer: string
      hint_de?: string
      hint_en?: string
      explanation_de?: string
      explanation_en?: string
      words?: string[]
      context_hint?: string
      question_type?: string
      time_limit_seconds?: number
      sentence_with_error?: string
      gap_word_type?: string
      key_vocabulary?: Array<{ de: string; en: string; gender?: string }>
    }>(response)

    // Check if this sentence was already seen (hash check)
    const sentenceHash = crypto
      .createHash('md5')
      .update(generated.sentence_de.toLowerCase())
      .digest('hex')

    const { data: existingSentence } = await supabase
      .from('seen_sentences')
      .select('id')
      .eq('user_id', user.id)
      .eq('sentence_hash', sentenceHash)
      .single()

    // If sentence was seen, we still return it but mark it
    // In production, you might want to regenerate
    const wasSeen = !!existingSentence

    // Record this sentence as seen
    if (!wasSeen) {
      await supabase.from('seen_sentences').insert({
        user_id: user.id,
        sentence_hash: sentenceHash,
      })
    }

    const exercise: GeneratedExercise = {
      type: exerciseType,
      topic,
      difficulty,
      prompt_en: generated.sentence_en,
      prompt_de: generated.sentence_de,
      correct_answer: generated.correct_answer,
      hint_de: generated.hint_de,
      hint_en: generated.hint_en,
      sentence_with_gap: exerciseType === 'fill_gap' ? generated.sentence_de : undefined,
      words: generated.words,
      context: generated.context_hint,
      question_type: generated.question_type as 'article' | 'conjugation' | 'case' | 'preposition' | undefined,
      time_limit_seconds: generated.time_limit_seconds,
    }

    return NextResponse.json({
      exercise,
      wasSeen,
    })
  } catch (error) {
    console.error('Error generating exercise:', error)
    return NextResponse.json(
      { error: 'Failed to generate exercise' },
      { status: 500 }
    )
  }
}
