import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { calculateReadinessScore } from '@/lib/algorithms/readiness'
import { GrammarTopic, UserTopicProgress, Profile, DailySession } from '@/types/database'
import {
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react'

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: Profile | null }

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

  // Fetch recent sessions (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: recentSessions } = await supabase
    .from('daily_sessions')
    .select('*')
    .eq('user_id', user.id)
    .gte('session_date', sevenDaysAgo.toISOString().split('T')[0])
    .order('session_date', { ascending: false }) as { data: DailySession[] | null }

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

  // Calculate weekly stats
  const weeklyStats = {
    totalMinutes: recentSessions?.reduce((sum, s) => sum + s.minutes_practiced, 0) || 0,
    totalExercises: recentSessions?.reduce((sum, s) => sum + s.exercises_completed, 0) || 0,
    totalCorrect: recentSessions?.reduce((sum, s) => sum + s.exercises_correct, 0) || 0,
    daysActive: recentSessions?.length || 0,
  }

  const weeklyAccuracy = weeklyStats.totalExercises > 0
    ? Math.round((weeklyStats.totalCorrect / weeklyStats.totalExercises) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fortschritt</h1>
        <p className="text-muted-foreground">
          Verfolge deinen Weg zum B1-Niveau
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{readiness.overall}%</p>
                <p className="text-sm text-muted-foreground">B1 Bereitschaft</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{profile?.total_exercises || 0}</p>
                <p className="text-sm text-muted-foreground">Ubungen gesamt</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{weeklyStats.totalMinutes}</p>
                <p className="text-sm text-muted-foreground">Min. diese Woche</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{weeklyStats.daysActive}/7</p>
                <p className="text-sm text-muted-foreground">Aktive Tage</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Fortschritt nach Niveau</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {(['A1', 'A2', 'B1'] as const).map((level) => {
            const levelTopics = topicsWithProgress.filter((t) => t.topic.level === level)
            const avgProficiency = readiness.byLevel[level]

            return (
              <div key={level} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        level === 'A1'
                          ? 'bg-green-100 text-green-800'
                          : level === 'A2'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }
                    >
                      {level}
                    </Badge>
                    <span className="font-medium">
                      {level === 'A1'
                        ? 'Grundlagen'
                        : level === 'A2'
                        ? 'Aufbau'
                        : 'Ziel'}
                    </span>
                  </div>
                  <span className="font-bold">{avgProficiency}%</span>
                </div>
                <Progress value={avgProficiency} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {levelTopics.length} Themen
                </p>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Topic Details */}
      <Card>
        <CardHeader>
          <CardTitle>Grammatik-Themen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topicsWithProgress.map(({ topic, progress }) => {
              const proficiency = progress?.proficiency ?? 0

              return (
                <div key={topic.id} className="flex items-center gap-4">
                  <Badge
                    variant="outline"
                    className={
                      topic.level === 'A1'
                        ? 'bg-green-100 text-green-800'
                        : topic.level === 'A2'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }
                  >
                    {topic.level}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{topic.name_de}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {topic.name_en}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {progress && (
                      <span className="text-xs text-muted-foreground">
                        {progress.correct}/{progress.attempts}
                      </span>
                    )}
                    <div className="w-20">
                      <Progress value={proficiency} className="h-2" />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {Math.round(proficiency)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Activity */}
      {recentSessions && recentSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Letzte 7 Tage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSessions.map((session) => {
                const accuracy = session.exercises_completed > 0
                  ? Math.round((session.exercises_correct / session.exercises_completed) * 100)
                  : 0

                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {new Date(session.session_date).toLocaleDateString('de-DE', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {session.minutes_practiced} min
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {session.exercises_correct}
                      </span>
                      <span className="flex items-center gap-1">
                        <XCircle className="w-4 h-4 text-red-600" />
                        {session.exercises_completed - session.exercises_correct}
                      </span>
                      <Badge variant={accuracy >= 70 ? 'default' : 'secondary'}>
                        {accuracy}%
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
