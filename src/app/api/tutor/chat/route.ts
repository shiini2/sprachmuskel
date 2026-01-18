import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIProvider, parseAIResponse } from '@/lib/ai/provider'
import { generateTutorResponsePrompt } from '@/lib/ai/prompts'
import { GrammarTopic } from '@/types/database'

export interface TutorResponse {
  correction_de?: string | null
  correction_en?: string | null
  response_de: string
  response_en: string
  examples?: { de: string; en: string }[]
}

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
      message,
      topicId,
      currentQuestion,
      userAnswer,
      wasCorrect,
      conversationHistory,
    } = body as {
      message: string
      topicId?: number
      currentQuestion?: string
      userAnswer?: string
      wasCorrect?: boolean
      conversationHistory?: { role: 'user' | 'tutor'; message: string }[]
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get the topic if provided
    let topic: GrammarTopic | undefined
    if (topicId) {
      const { data: topicData } = await supabase
        .from('grammar_topics')
        .select('*')
        .eq('id', topicId)
        .single()
      topic = topicData as GrammarTopic
    }

    // Generate tutor response using AI
    const aiProvider = getAIProvider()
    const prompt = generateTutorResponsePrompt({
      userQuestion: message,
      topic,
      currentQuestion,
      userAnswer,
      wasCorrect,
      conversationHistory,
    })

    const response = await aiProvider.generate(prompt)
    const tutorResponse = parseAIResponse<TutorResponse>(response)

    return NextResponse.json({ response: tutorResponse })
  } catch (error) {
    console.error('Error generating tutor response:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}
