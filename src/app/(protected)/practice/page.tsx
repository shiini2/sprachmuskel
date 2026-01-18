'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ExerciseWrapper, DifficultyFeedback } from '@/components/exercises/ExerciseWrapper'
import { ReverseTranslation } from '@/components/exercises/ReverseTranslation'
import { FillTheGap } from '@/components/exercises/FillTheGap'
import { GrammarSnap } from '@/components/exercises/GrammarSnap'
import { GeneratedExercise, ExerciseResult } from '@/types/exercises'
import { ExerciseType } from '@/types/database'
import { MiniLesson } from '@/components/tutor/MiniLesson'
import { LessonContent } from '@/app/api/tutor/lesson/route'
import { GrammarTopic } from '@/types/database'
import { useTutor } from '@/contexts/TutorContext'
import {
  Loader2,
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Zap,
  Flame,
} from 'lucide-react'

interface SessionStats {
  totalExercises: number
  correct: number
  totalTime: number
  usedHints: number
  usedEnglish: number
}

interface UserProfile {
  daily_goal_minutes: number
  current_level: string
}

type SessionState = 'setup' | 'lesson' | 'loading' | 'exercise' | 'complete'

const EXERCISE_TYPES: ExerciseType[] = [
  'reverse_translation',
  'fill_gap',
  'grammar_snap',
]

// Calculate exercises based on time (roughly 1 exercise per minute)
const getExercisesForMinutes = (minutes: number) => Math.ceil(minutes * 1)

export default function PracticePage() {
  const router = useRouter()
  const { setExerciseContext } = useTutor()
  const [sessionId] = useState(uuidv4())
  const [sessionState, setSessionState] = useState<SessionState>('setup')
  const [currentExercise, setCurrentExercise] = useState<GeneratedExercise | null>(null)
  const [exerciseNumber, setExerciseNumber] = useState(0)
  const [totalExercises, setTotalExercises] = useState(10)
  const [stats, setStats] = useState<SessionStats>({
    totalExercises: 0,
    correct: 0,
    totalTime: 0,
    usedHints: 0,
    usedEnglish: 0,
  })
  const [error, setError] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState(2)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [recentPerformance, setRecentPerformance] = useState<boolean[]>([])
  const [todayMinutes, setTodayMinutes] = useState(0)
  const [currentLesson, setCurrentLesson] = useState<LessonContent | null>(null)
  const [currentTopic, setCurrentTopic] = useState<GrammarTopic | null>(null)
  const [lessonLoading, setLessonLoading] = useState(false)
  const [hasSeenLesson, setHasSeenLesson] = useState<Set<number>>(new Set())

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('profiles')
        .select('daily_goal_minutes, current_level')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
        // Set initial difficulty based on level
        const levelDifficulty: Record<string, number> = {
          'A1.1': 1, 'A1.2': 2, 'A2.1': 2, 'A2.2': 3, 'B1.1': 3, 'B1.2': 4,
        }
        setDifficulty(levelDifficulty[data.current_level] || 2)
      }

      // Get today's session to see how many minutes practiced
      const today = new Date().toISOString().split('T')[0]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: session } = await (supabase as any)
        .from('daily_sessions')
        .select('minutes_practiced')
        .eq('user_id', user.id)
        .eq('session_date', today)
        .single()

      if (session) {
        setTodayMinutes(session.minutes_practiced)
      }

      setLoadingProfile(false)
    }

    fetchProfile()
  }, [router])

  // Update tutor context when exercise/topic changes
  useEffect(() => {
    if (currentExercise) {
      setExerciseContext({
        topic: currentExercise.topic,
        currentQuestion: currentExercise.prompt_en || currentExercise.prompt_de,
      })
    } else if (currentTopic) {
      setExerciseContext({
        topic: currentTopic,
      })
    }
  }, [currentExercise, currentTopic, setExerciseContext])

  // Auto-adjust difficulty based on recent performance
  const autoAdjustDifficulty = useCallback(() => {
    if (recentPerformance.length < 3) return

    const recent5 = recentPerformance.slice(-5)
    const correctCount = recent5.filter(Boolean).length
    const successRate = correctCount / recent5.length

    // Target 60-75% success rate
    if (successRate >= 0.8 && difficulty < 5) {
      setDifficulty(prev => Math.min(5, prev + 1))
    } else if (successRate <= 0.4 && difficulty > 1) {
      setDifficulty(prev => Math.max(1, prev - 1))
    }
  }, [recentPerformance, difficulty])

  useEffect(() => {
    autoAdjustDifficulty()
  }, [recentPerformance, autoAdjustDifficulty])

  // Fetch a mini-lesson for a topic
  const fetchLesson = useCallback(async (topicId: number) => {
    setLessonLoading(true)
    try {
      const response = await fetch('/api/tutor/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId }),
      })

      if (!response.ok) throw new Error('Failed to fetch lesson')

      const data = await response.json()
      setCurrentLesson(data.lesson)
      setCurrentTopic(data.topic)
      setSessionState('lesson')
    } catch (err) {
      console.error('Error fetching lesson:', err)
      // If lesson fails, skip to exercise
      setSessionState('loading')
    } finally {
      setLessonLoading(false)
    }
  }, [])

  const generateExercise = useCallback(async () => {
    setSessionState('loading')
    setError(null)

    try {
      // Rotate through exercise types
      const exerciseType = EXERCISE_TYPES[exerciseNumber % EXERCISE_TYPES.length]

      const response = await fetch('/api/exercises/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseType,
          difficulty,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate exercise')
      }

      const data = await response.json()
      const exercise = data.exercise as GeneratedExercise

      // Check if we need to show a lesson for this topic
      const topicId = exercise.topic.id
      if (!hasSeenLesson.has(topicId)) {
        setCurrentExercise(exercise)
        setHasSeenLesson(prev => new Set(prev).add(topicId))
        await fetchLesson(topicId)
        return
      }

      setCurrentExercise(exercise)
      setCurrentTopic(exercise.topic)
      setSessionState('exercise')
    } catch (err) {
      console.error('Error generating exercise:', err)
      setError('Fehler beim Laden der Ubung. Bitte versuche es erneut.')
      setSessionState('setup')
    }
  }, [exerciseNumber, difficulty, hasSeenLesson, fetchLesson])

  const handleSubmit = async (
    answer: string,
    timeTaken: number,
    usedHint: boolean,
    usedEnglish: boolean
  ): Promise<ExerciseResult> => {
    if (!currentExercise) {
      throw new Error('No exercise loaded')
    }

    const response = await fetch('/api/exercises/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exerciseType: currentExercise.type,
        topic: currentExercise.topic,
        expectedAnswer: currentExercise.correct_answer,
        userAnswer: answer,
        originalPrompt: currentExercise.prompt_en,
        timeTakenSeconds: timeTaken,
        usedHint,
        usedEnglish,
        sessionId,
        difficulty: currentExercise.difficulty,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to evaluate answer')
    }

    const data = await response.json()
    const result = data.result as ExerciseResult
    const isCorrect = result.is_correct || result.is_acceptable_alternative

    // Track performance for auto-adjustment
    setRecentPerformance(prev => [...prev.slice(-9), isCorrect])

    // Update stats
    setStats((prev) => ({
      totalExercises: prev.totalExercises + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
      totalTime: prev.totalTime + timeTaken,
      usedHints: prev.usedHints + (usedHint ? 1 : 0),
      usedEnglish: prev.usedEnglish + (usedEnglish ? 1 : 0),
    }))

    return result
  }

  const adjustDifficulty = (feedback: DifficultyFeedback | undefined) => {
    if (!feedback) return

    setDifficulty((prev) => {
      if (feedback === 'too_easy' && prev < 5) {
        return prev + 1
      } else if (feedback === 'too_hard' && prev > 1) {
        return prev - 1
      }
      return prev
    })
  }

  const handleNext = (feedback?: DifficultyFeedback) => {
    adjustDifficulty(feedback)
    setExerciseNumber((prev) => prev + 1)
    setCurrentExercise(null)
  }

  const handleComplete = (feedback?: DifficultyFeedback) => {
    adjustDifficulty(feedback)
    setSessionState('complete')
  }

  // Load next exercise when exerciseNumber changes
  useEffect(() => {
    if (sessionState === 'exercise' && !currentExercise && exerciseNumber < totalExercises) {
      generateExercise()
    }
  }, [exerciseNumber, sessionState, currentExercise, totalExercises, generateExercise])

  const startSession = (numExercises: number) => {
    setTotalExercises(numExercises)
    setExerciseNumber(1)
    setStats({
      totalExercises: 0,
      correct: 0,
      totalTime: 0,
      usedHints: 0,
      usedEnglish: 0,
    })
    setRecentPerformance([])
    generateExercise()
  }

  const renderExerciseContent = (props: {
    onAnswerChange: (answer: string) => void
    answer: string
    isSubmitted: boolean
    isCorrect: boolean | null
    disabled: boolean
  }) => {
    if (!currentExercise) return null

    switch (currentExercise.type) {
      case 'reverse_translation':
        return <ReverseTranslation exercise={currentExercise} {...props} />
      case 'fill_gap':
        return <FillTheGap exercise={currentExercise} {...props} />
      case 'grammar_snap':
        return <GrammarSnap exercise={currentExercise} {...props} />
      default:
        return <ReverseTranslation exercise={currentExercise} {...props} />
    }
  }

  // Loading profile
  if (loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Wird geladen...</p>
      </div>
    )
  }

  const dailyGoal = profile?.daily_goal_minutes || 20
  const remainingMinutes = Math.max(0, dailyGoal - todayMinutes)
  const goalProgress = Math.min(100, (todayMinutes / dailyGoal) * 100)

  // Setup screen
  if (sessionState === 'setup') {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Ubung starten</h1>
          <p className="text-muted-foreground">
            Wahle deine Ubungseinheit
          </p>
        </div>

        {/* Daily Goal Progress */}
        <Card className="border-primary/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4" />
                Tagesziel
              </span>
              <span className="text-sm text-muted-foreground">
                {todayMinutes} / {dailyGoal} min
              </span>
            </div>
            <Progress value={goalProgress} className="h-2 mb-2" />
            {goalProgress >= 100 ? (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Tagesziel erreicht!
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Noch {remainingMinutes} Minuten bis zum Tagesziel
              </p>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <div className="grid gap-3">
          {/* Primary option: Complete daily goal */}
          {remainingMinutes > 0 && (
            <Button
              className="h-auto py-4 justify-between"
              onClick={() => startSession(getExercisesForMinutes(remainingMinutes))}
            >
              <div className="text-left flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">Tagesziel erreichen</p>
                  <p className="text-sm opacity-80">
                    {getExercisesForMinutes(remainingMinutes)} Ubungen (~{remainingMinutes} min)
                  </p>
                </div>
              </div>
            </Button>
          )}

          {/* Quick options */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-auto py-3"
              onClick={() => startSession(5)}
            >
              <div className="text-center">
                <Zap className="w-5 h-5 mx-auto mb-1" />
                <p className="font-medium">Schnell</p>
                <p className="text-xs text-muted-foreground">5 Ubungen</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-3"
              onClick={() => startSession(10)}
            >
              <div className="text-center">
                <Clock className="w-5 h-5 mx-auto mb-1" />
                <p className="font-medium">Standard</p>
                <p className="text-xs text-muted-foreground">10 Ubungen</p>
              </div>
            </Button>
          </div>

          {/* More options */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => startSession(15)}
            >
              15 Ubungen
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => startSession(20)}
            >
              20 Ubungen
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => startSession(30)}
            >
              30 Ubungen
            </Button>
          </div>
        </div>

        {/* Auto-adaptive difficulty info */}
        <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Die Schwierigkeit passt sich automatisch an dein Niveau an.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Aktuell: Stufe {difficulty}/5
          </p>
        </div>
      </div>
    )
  }

  // Lesson screen (shown before exercise for new topics)
  if (sessionState === 'lesson' && currentLesson && currentTopic) {
    return (
      <MiniLesson
        topic={currentTopic}
        lesson={currentLesson}
        isLoading={lessonLoading}
        onContinue={() => {
          setCurrentLesson(null)
          setSessionState('exercise')
        }}
      />
    )
  }

  // Loading screen
  if (sessionState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Ubung wird geladen...</p>
      </div>
    )
  }

  // Exercise screen
  if (sessionState === 'exercise' && currentExercise) {
    return (
      <ExerciseWrapper
        exercise={currentExercise}
        onSubmit={handleSubmit}
        onNext={handleNext}
        onComplete={handleComplete}
        exerciseNumber={exerciseNumber}
        totalExercises={totalExercises}
      >
        {renderExerciseContent}
      </ExerciseWrapper>
    )
  }

  // Complete screen
  if (sessionState === 'complete') {
    const accuracy = stats.totalExercises > 0
      ? Math.round((stats.correct / stats.totalExercises) * 100)
      : 0
    const avgTime = stats.totalExercises > 0
      ? Math.round(stats.totalTime / stats.totalExercises)
      : 0
    const sessionMinutes = Math.ceil(stats.totalTime / 60)

    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Geschafft!</CardTitle>
          <p className="text-muted-foreground">
            Du hast die Ubung abgeschlossen
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Target className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{accuracy}%</p>
              <p className="text-sm text-muted-foreground">Genauigkeit</p>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{avgTime}s</p>
              <p className="text-sm text-muted-foreground">Durchschnitt</p>
            </div>
          </div>

          {/* Session summary */}
          <div className="p-3 bg-primary/10 rounded-lg text-center">
            <p className="text-sm">
              +{sessionMinutes} Minuten zu deinem Tagesziel
            </p>
          </div>

          {/* Detailed stats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Richtig
              </span>
              <span className="font-medium">{stats.correct}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                Falsch
              </span>
              <span className="font-medium">
                {stats.totalExercises - stats.correct}
              </span>
            </div>
            {stats.usedEnglish > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Englische Hilfe benutzt</span>
                <span>{stats.usedEnglish}x</span>
              </div>
            )}
          </div>

          {/* Difficulty update info */}
          <p className="text-xs text-center text-muted-foreground">
            Schwierigkeit angepasst: Stufe {difficulty}/5
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/dashboard')}
            >
              Dashboard
            </Button>
            <Button
              className="flex-1"
              onClick={() => setSessionState('setup')}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Nochmal
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
