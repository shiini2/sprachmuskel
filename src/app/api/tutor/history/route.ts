import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Save tutor messages
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 })
    }

    // Insert messages
    const messagesToInsert = messages.map((msg: {
      role: string
      content_de: string
      content_en: string
      examples?: { de: string; en: string }[]
      context?: {
        topicId?: number
        question?: string
        userAnswer?: string
        wasCorrect?: boolean
      }
    }) => ({
      user_id: user.id,
      role: msg.role,
      content_de: msg.content_de,
      content_en: msg.content_en,
      examples: msg.examples || null,
      topic_id: msg.context?.topicId || null,
      question_context: msg.context?.question || null,
      user_answer_context: msg.context?.userAnswer || null,
      was_correct_context: msg.context?.wasCorrect ?? null,
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('tutor_messages')
      .insert(messagesToInsert)

    if (error) {
      console.error('Error saving tutor messages:', error)
      // Don't fail the request - this is non-critical
      return NextResponse.json({ success: false, error: error.message })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in tutor history POST:', error)
    return NextResponse.json({ success: false })
  }
}

// Load recent tutor messages
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: messages, error } = await (supabase as any)
      .from('tutor_messages')
      .select(`
        id,
        role,
        content_de,
        content_en,
        examples,
        topic_id,
        question_context,
        user_answer_context,
        was_correct_context,
        created_at,
        grammar_topics (
          name_de,
          name_en
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error loading tutor messages:', error)
      return NextResponse.json({ messages: [] })
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error('Error in tutor history GET:', error)
    return NextResponse.json({ messages: [] })
  }
}

// Clear tutor history
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('tutor_messages')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Error clearing tutor messages:', error)
      return NextResponse.json({ success: false, error: error.message })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in tutor history DELETE:', error)
    return NextResponse.json({ success: false })
  }
}
