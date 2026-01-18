import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIProvider, parseAIResponse } from '@/lib/ai/provider'
import { generateLessonPrompt } from '@/lib/ai/prompts'
import { GrammarTopic, Level } from '@/types/database'

export interface LessonContent {
  title_de: string
  title_en: string
  key_rule_de: string
  key_rule_en: string
  explanation_de: string
  explanation_en: string
  examples: { de: string; en: string; highlight?: string }[]
  common_mistakes: { wrong: string; correct: string; tip_de: string; tip_en: string }[]
  remember_de: string
  remember_en: string
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
    const { topicId } = body as { topicId: number }

    // Get the topic
    const { data: topic, error: topicError } = await supabase
      .from('grammar_topics')
      .select('*')
      .eq('id', topicId)
      .single()

    if (topicError || !topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    // Get user's level
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_level')
      .eq('id', user.id)
      .single()

    const level: Level = profile?.current_level || 'A1.2'

    // Generate lesson using AI
    const aiProvider = getAIProvider()
    const prompt = generateLessonPrompt({
      topic: topic as GrammarTopic,
      level,
    })

    const response = await aiProvider.generate(prompt)
    const lesson = parseAIResponse<LessonContent>(response)

    return NextResponse.json({ lesson, topic })
  } catch (error) {
    console.error('Error generating lesson:', error)
    return NextResponse.json(
      { error: 'Failed to generate lesson' },
      { status: 500 }
    )
  }
}
