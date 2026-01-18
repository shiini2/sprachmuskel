import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIProvider, parseAIResponse } from '@/lib/ai/provider'
import { generatePlacementQuestionPrompt, PlacementQuestionType } from '@/lib/ai/placement-prompts'
import { GrammarTopic } from '@/types/database'
import { PlacementQuestion } from '@/types/placement'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createClient() as any
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { topicId, difficulty = 2 } = body as {
      topicId: number
      difficulty?: number
    }

    // Get the topic
    const { data: topic, error: topicError } = await supabase
      .from('grammar_topics')
      .select('*')
      .eq('id', topicId)
      .single()

    if (topicError || !topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    // Rotate question types for variety
    const questionTypes: PlacementQuestionType[] = ['translate', 'fill_gap', 'grammar_choice', 'error_detection']
    const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)]

    // Generate question using AI
    const aiProvider = getAIProvider()
    const prompt = generatePlacementQuestionPrompt({
      topic: topic as GrammarTopic,
      questionType,
      difficulty,
    })

    const response = await aiProvider.generate(prompt)
    const generated = parseAIResponse<{
      prompt_en: string
      prompt_de?: string
      correct_answer: string
      options?: string[]
      hint?: string
      explanation_de?: string
      explanation_en?: string
    }>(response)

    const question: PlacementQuestion = {
      id: uuidv4(),
      topic: topic as GrammarTopic,
      level: topic.level,
      type: questionType,
      prompt_en: generated.prompt_en,
      prompt_de: generated.prompt_de,
      correct_answer: generated.correct_answer,
      options: generated.options,
      hint: generated.hint,
      difficulty,
    }

    return NextResponse.json({ question })
  } catch (error) {
    console.error('Error generating placement question:', error)
    return NextResponse.json(
      { error: 'Failed to generate question' },
      { status: 500 }
    )
  }
}

// Get multiple questions for a batch (used for initial quiz setup)
export async function GET(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createClient() as any
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all grammar topics sorted by level and order
    const { data: topics, error } = await supabase
      .from('grammar_topics')
      .select('*')
      .order('level')
      .order('order_index')

    if (error || !topics) {
      return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 })
    }

    return NextResponse.json({ topics })
  } catch (error) {
    console.error('Error fetching topics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    )
  }
}
