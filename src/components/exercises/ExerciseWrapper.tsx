'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { GermanExplanation } from '@/components/common/GermanExplanation'
import { Timer } from '@/components/common/Timer'
import { GeneratedExercise, ExerciseResult } from '@/types/exercises'
import { CheckCircle, XCircle, ArrowRight, Lightbulb, Loader2, ThumbsDown, Minus, MessageCircleQuestion } from 'lucide-react'
import { useTutor } from '@/contexts/TutorContext'

export type DifficultyFeedback = 'too_easy' | 'just_right' | 'too_hard'

interface ExerciseWrapperProps {
  exercise: GeneratedExercise
  onSubmit: (answer: string, timeTaken: number, usedHint: boolean, usedEnglish: boolean) => Promise<ExerciseResult>
  onNext: (difficultyFeedback?: DifficultyFeedback) => void
  onComplete: (difficultyFeedback?: DifficultyFeedback) => void
  exerciseNumber: number
  totalExercises: number
  children: (props: {
    onAnswerChange: (answer: string) => void
    answer: string
    isSubmitted: boolean
    isCorrect: boolean | null
    disabled: boolean
  }) => React.ReactNode
}

export function ExerciseWrapper({
  exercise,
  onSubmit,
  onNext,
  onComplete,
  exerciseNumber,
  totalExercises,
  children,
}: ExerciseWrapperProps) {
  const { setExerciseContext, setIsOpen: openTutor } = useTutor()
  const [answer, setAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [result, setResult] = useState<ExerciseResult | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [usedHint, setUsedHint] = useState(false)
  const [usedEnglish, setUsedEnglish] = useState(false)
  const [startTime] = useState(Date.now())
  const [timeTaken, setTimeTaken] = useState(0)
  const [difficultyFeedback, setDifficultyFeedback] = useState<DifficultyFeedback | null>(null)

  const isLast = exerciseNumber === totalExercises

  const handleSubmit = useCallback(async () => {
    if (!answer.trim() || isSubmitting || isSubmitted) return

    setIsSubmitting(true)
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    setTimeTaken(elapsed)

    try {
      const res = await onSubmit(answer, elapsed, usedHint, usedEnglish)
      setResult(res)
      setIsSubmitted(true)
      // Update tutor context with result
      setExerciseContext({
        topic: exercise.topic,
        currentQuestion: exercise.prompt_en || exercise.prompt_de,
        userAnswer: answer,
        wasCorrect: res.is_correct || res.is_acceptable_alternative,
      })
    } catch (error) {
      console.error('Error submitting answer:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [answer, isSubmitting, isSubmitted, onSubmit, startTime, usedHint, usedEnglish, exercise, setExerciseContext])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        if (!isSubmitted && answer.trim()) {
          e.preventDefault()
          handleSubmit()
        } else if (isSubmitted) {
          e.preventDefault()
          if (isLast) {
            onComplete(difficultyFeedback || undefined)
          } else {
            onNext(difficultyFeedback || undefined)
          }
        }
      }
    },
    [isSubmitted, answer, handleSubmit, isLast, onNext, onComplete, difficultyFeedback]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleShowHint = () => {
    setShowHint(true)
    setUsedHint(true)
  }

  const handleEnglishRevealed = () => {
    setUsedEnglish(true)
  }

  const getDifficultyLabel = (level: number) => {
    const labels = ['Sehr leicht', 'Leicht', 'Mittel', 'Schwer', 'Sehr schwer']
    return labels[level - 1] || 'Mittel'
  }

  const getExerciseTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      reverse_translation: 'Ubersetzen',
      fill_gap: 'Lucke fullen',
      sentence_construction: 'Satz bauen',
      grammar_snap: 'Schnell-Grammatik',
      error_correction: 'Fehler finden',
    }
    return labels[type] || type
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="pb-2">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Ubung {exerciseNumber} von {totalExercises}
            </span>
            <Timer isRunning={!isSubmitted} />
          </div>
          <Progress value={(exerciseNumber / totalExercises) * 100} className="h-2" />
        </div>

        {/* Exercise info */}
        <div className="flex items-center gap-2 pt-2">
          <Badge variant="outline">{getExerciseTypeLabel(exercise.type)}</Badge>
          <Badge variant="secondary">{exercise.topic.name_de}</Badge>
          <Badge variant="secondary" className="ml-auto">
            {getDifficultyLabel(exercise.difficulty)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Exercise content (provided by children) */}
        {children({
          onAnswerChange: setAnswer,
          answer,
          isSubmitted,
          isCorrect: result?.is_correct ?? null,
          disabled: isSubmitted || isSubmitting,
        })}

        {/* Hint (before submission) */}
        {!isSubmitted && exercise.hint_de && (
          <div>
            {showHint ? (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <Lightbulb className="w-4 h-4 inline mr-2" />
                  {exercise.hint_de}
                </p>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShowHint}
                className="text-yellow-600 hover:text-yellow-700"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Hinweis anzeigen
              </Button>
            )}
          </div>
        )}

        {/* Result (after submission) */}
        {isSubmitted && result && (
          <div className="space-y-4">
            {/* Correct/Incorrect indicator */}
            <div
              className={`p-4 rounded-lg ${
                result.is_correct || result.is_acceptable_alternative
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {result.is_correct || result.is_acceptable_alternative ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800 dark:text-green-200">
                      {result.encouragement_de}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-800 dark:text-red-200">
                      Nicht ganz richtig
                    </span>
                  </>
                )}
              </div>

              {/* Show correct answer if wrong */}
              {!result.is_correct && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Richtige Antwort: </span>
                  <span className="font-medium">{result.correct_answer}</span>
                </p>
              )}

              {/* Show acceptable alternative note */}
              {result.is_acceptable_alternative && !result.is_correct && (
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Deine Antwort ist auch akzeptabel!
                </p>
              )}
            </div>

            {/* Explanation */}
            <GermanExplanation
              explanationDe={result.explanation_de}
              explanationEn={result.explanation_en}
              onEnglishRevealed={handleEnglishRevealed}
            />

            {/* Errors detail */}
            {result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Fehler:</p>
                {result.errors.map((error, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-slate-50 dark:bg-slate-800 rounded text-sm"
                  >
                    <Badge variant="outline" className="mb-1">
                      {error.type}
                    </Badge>
                    <p>{error.description_de}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Ask the tutor button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => openTutor(true)}
              className="w-full"
            >
              <MessageCircleQuestion className="w-4 h-4 mr-2" />
              Mehr erfahren / Tutor fragen
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        {!isSubmitted ? (
          <Button
            onClick={handleSubmit}
            disabled={!answer.trim() || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird gepruft...
              </>
            ) : (
              'Prufen'
            )}
          </Button>
        ) : (
          <>
            {/* Difficulty feedback */}
            <div className="w-full space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                Wie war die Schwierigkeit?
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant={difficultyFeedback === 'too_easy' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDifficultyFeedback('too_easy')}
                  className={difficultyFeedback === 'too_easy' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  <ThumbsDown className="w-4 h-4 mr-1 rotate-180" />
                  Zu leicht
                </Button>
                <Button
                  variant={difficultyFeedback === 'just_right' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDifficultyFeedback('just_right')}
                  className={difficultyFeedback === 'just_right' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  <Minus className="w-4 h-4 mr-1" />
                  Genau richtig
                </Button>
                <Button
                  variant={difficultyFeedback === 'too_hard' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDifficultyFeedback('too_hard')}
                  className={difficultyFeedback === 'too_hard' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  <ThumbsDown className="w-4 h-4 mr-1" />
                  Zu schwer
                </Button>
              </div>
            </div>

            <Button
              onClick={() => isLast ? onComplete(difficultyFeedback || undefined) : onNext(difficultyFeedback || undefined)}
              className="w-full"
              size="lg"
            >
              {isLast ? 'Ubung beenden' : 'Weiter'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
