import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIProvider, parseAIResponse } from '@/lib/ai/provider'
import { evaluatePlacementAnswerPrompt, PlacementQuestionType } from '@/lib/ai/placement-prompts'
import { GrammarTopic } from '@/types/database'

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
      questionType,
      topic,
      prompt,
      correctAnswer,
      userAnswer,
    } = body as {
      questionType: PlacementQuestionType
      topic: GrammarTopic
      prompt: string
      correctAnswer: string
      userAnswer: string
    }

    // For multiple choice, just do exact comparison
    if (questionType === 'grammar_choice') {
      const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
      return NextResponse.json({
        is_correct: isCorrect,
        is_acceptable: isCorrect,
        feedback_de: isCorrect ? 'Richtig!' : `Die richtige Antwort ist: ${correctAnswer}`,
        feedback_en: isCorrect ? 'Correct!' : `The correct answer is: ${correctAnswer}`,
      })
    }

    // For other types, use AI evaluation
    const aiProvider = getAIProvider()
    const evalPrompt = evaluatePlacementAnswerPrompt({
      questionType,
      topic,
      prompt,
      correctAnswer,
      userAnswer,
    })

    const response = await aiProvider.generate(evalPrompt)
    const result = parseAIResponse<{
      is_correct: boolean
      is_acceptable: boolean
      feedback_de: string
      feedback_en: string
    }>(response)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error evaluating placement answer:', error)
    // Fallback to simple comparison on error
    return NextResponse.json({
      is_correct: false,
      is_acceptable: false,
      feedback_de: 'Fehler bei der Auswertung',
      feedback_en: 'Error evaluating answer',
    })
  }
}
