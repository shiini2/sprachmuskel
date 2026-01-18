import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ExamCountdown } from '@/components/dashboard/ExamCountdown'
import { DailyProgress } from '@/components/dashboard/DailyProgress'
import { WeakTopics } from '@/components/dashboard/WeakTopics'
import { StreakDisplay } from '@/components/dashboard/StreakDisplay'
import { PlacementPrompt } from '@/components/dashboard/PlacementPrompt'
import { calculateReadinessScore } from '@/lib/algorithms/readiness'
import { GrammarTopic, UserTopicProgress, Profile, DailySession } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile (including placement status)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, has_completed_placement, detected_level')
    .eq('id', user.id)
    .single() as { data: (Profile & { has_completed_placement?: boolean; detected_level?: string }) | null }

  // Fetch grammar topics
  const { data: topics } = await supabase
    .from('grammar_topics')
    .select('*')
    .order('order_index') as { data: GrammarTopic[] | null }

  // Fetch user topic progress
  const { data: topicProgress } = await supabase
    .from('user_topic_progress')
    .select('*')
    .eq('user_id', user.id) as { data: UserTopicProgress[] | null }

  // Fetch today's session
  const today = new Date().toISOString().split('T')[0]
  const { data: todaySession } = await supabase
    .from('daily_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('session_date', today)
    .single() as { data: DailySession | null }

  // Calculate readiness score
  const topicsWithProgress = (topics || []).map((topic) => ({
    topic,
    progress: topicProgress?.find((p) => p.topic_id === topic.id) || null,
  }))

  const examDate = profile?.exam_date ? new Date(profile.exam_date) : null
  const readiness = calculateReadinessScore(
    topicsWithProgress,
    examDate,
    profile?.current_level || 'A1.2'
  )

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">
          Hallo{profile?.display_name ? `, ${profile.display_name}` : ''}!
        </h1>
        <p className="text-muted-foreground">
          {readiness.recommendationDe}
        </p>
      </div>

      {/* Placement Prompt (for new users) */}
      {!profile?.has_completed_placement && (
        <PlacementPrompt
          hasCompletedPlacement={profile?.has_completed_placement || false}
          detectedLevel={profile?.detected_level}
        />
      )}

      {/* Streak */}
      <StreakDisplay
        currentStreak={profile?.streak_current || 0}
        longestStreak={profile?.streak_longest || 0}
      />

      {/* Main grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Daily Progress */}
        <DailyProgress
          minutesPracticed={todaySession?.minutes_practiced || 0}
          goalMinutes={profile?.daily_goal_minutes || 20}
          exercisesCompleted={todaySession?.exercises_completed || 0}
          exercisesCorrect={todaySession?.exercises_correct || 0}
        />

        {/* Exam Countdown */}
        <ExamCountdown
          examDate={examDate}
          readinessScore={readiness.overall}
          projectedReadyDate={readiness.projectedReadyDate}
        />

        {/* Weak Topics */}
        <WeakTopics topics={readiness.weakestTopics} />
      </div>

      {/* Level Progress */}
      <div className="grid grid-cols-3 gap-4">
        {(['A1', 'A2', 'B1'] as const).map((level) => (
          <div
            key={level}
            className="bg-white dark:bg-slate-800 rounded-lg p-4 border"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">{level}</span>
              <span className="text-sm text-muted-foreground">
                {readiness.byLevel[level]}%
              </span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  level === 'A1'
                    ? 'bg-green-500'
                    : level === 'A2'
                    ? 'bg-blue-500'
                    : 'bg-purple-500'
                }`}
                style={{ width: `${readiness.byLevel[level]}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
