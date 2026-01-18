import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TopicAssessment, LearningPathItem } from '@/types/placement'
import { Level } from '@/types/database'

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
      overallLevel,
      totalQuestions,
      correctAnswers,
      timeTakenSeconds,
      assessments,
      learningPath,
    } = body as {
      overallLevel: Level
      totalQuestions: number
      correctAnswers: number
      timeTakenSeconds: number
      assessments: TopicAssessment[]
      learningPath: LearningPathItem[]
    }

    // 1. Save placement result
    const { data: placementResult, error: placementError } = await supabase
      .from('placement_results')
      .insert({
        user_id: user.id,
        overall_level: overallLevel,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        time_taken_seconds: timeTakenSeconds,
      })
      .select()
      .single()

    if (placementError) {
      console.error('Error saving placement result:', placementError)
      return NextResponse.json({ error: 'Failed to save placement result' }, { status: 500 })
    }

    // 2. Save topic assessments
    const assessmentInserts = assessments.map(a => ({
      user_id: user.id,
      topic_id: a.topic_id,
      placement_result_id: placementResult.id,
      questions_asked: a.questions_asked,
      questions_correct: a.questions_correct,
      mastery_level: a.mastery_level,
      confidence_score: a.confidence_score,
    }))

    const { error: assessmentError } = await supabase
      .from('topic_assessments')
      .upsert(assessmentInserts, {
        onConflict: 'user_id,topic_id',
        ignoreDuplicates: false
      })

    if (assessmentError) {
      console.error('Error saving topic assessments:', assessmentError)
      // Continue anyway, placement is saved
    }

    // 3. Save learning path
    const pathInserts = learningPath.map(item => ({
      user_id: user.id,
      topic_id: item.topic_id,
      priority: item.priority,
      status: item.status,
      estimated_sessions: item.estimated_sessions,
      completed_sessions: item.completed_sessions,
      target_mastery: item.target_mastery,
    }))

    const { error: pathError } = await supabase
      .from('learning_path')
      .upsert(pathInserts, {
        onConflict: 'user_id,topic_id',
        ignoreDuplicates: false
      })

    if (pathError) {
      console.error('Error saving learning path:', pathError)
      // Continue anyway
    }

    // 4. Update user profile with placement info
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        current_level: overallLevel,
        has_completed_placement: true,
        detected_level: overallLevel,
        placement_completed_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('Error updating profile:', profileError)
    }

    return NextResponse.json({
      success: true,
      placementId: placementResult.id,
    })
  } catch (error) {
    console.error('Error in placement save:', error)
    return NextResponse.json(
      { error: 'Failed to save placement results' },
      { status: 500 }
    )
  }
}

// Get user's existing placement data
export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createClient() as any
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get most recent placement result
    const { data: placementResult } = await supabase
      .from('placement_results')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single()

    // Get topic assessments
    const { data: assessments } = await supabase
      .from('topic_assessments')
      .select(`
        *,
        grammar_topics (*)
      `)
      .eq('user_id', user.id)

    // Get learning path
    const { data: learningPath } = await supabase
      .from('learning_path')
      .select(`
        *,
        grammar_topics (*)
      `)
      .eq('user_id', user.id)
      .order('priority')

    return NextResponse.json({
      placementResult,
      assessments: assessments || [],
      learningPath: learningPath || [],
    })
  } catch (error) {
    console.error('Error fetching placement data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch placement data' },
      { status: 500 }
    )
  }
}
