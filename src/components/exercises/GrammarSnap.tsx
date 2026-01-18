'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Timer } from '@/components/common/Timer'
import { GeneratedExercise } from '@/types/exercises'
import { AlertTriangle } from 'lucide-react'

interface GrammarSnapProps {
  exercise: GeneratedExercise
  onAnswerChange: (answer: string) => void
  answer: string
  isSubmitted: boolean
  isCorrect: boolean | null
  disabled: boolean
  onTimeOut?: () => void
}

export function GrammarSnap({
  exercise,
  onAnswerChange,
  answer,
  isSubmitted,
  isCorrect,
  disabled,
  onTimeOut,
}: GrammarSnapProps) {
  const [timedOut, setTimedOut] = useState(false)
  const timeLimit = exercise.time_limit_seconds || 5

  const handleTimeOut = useCallback(() => {
    if (!isSubmitted && !timedOut) {
      setTimedOut(true)
      onTimeOut?.()
    }
  }, [isSubmitted, timedOut, onTimeOut])

  const getBorderColor = () => {
    if (!isSubmitted && !timedOut) return 'border-primary'
    if (isCorrect) return 'border-green-500 focus-visible:ring-green-500'
    return 'border-red-500 focus-visible:ring-red-500'
  }

  const getQuestionTypeLabel = () => {
    switch (exercise.question_type) {
      case 'article':
        return 'Welcher Artikel? (der/die/das)'
      case 'conjugation':
        return 'Konjugiere das Verb!'
      case 'case':
        return 'Welcher Fall?'
      case 'preposition':
        return 'Welche Praposition?'
      default:
        return 'Schnell antworten!'
    }
  }

  return (
    <div className="space-y-4">
      {/* Timer and instruction */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          {getQuestionTypeLabel()}
        </p>
        {!isSubmitted && !timedOut && (
          <Timer
            isRunning={!isSubmitted && !timedOut}
            countDown={timeLimit}
            onCountDownComplete={handleTimeOut}
            showMinutes={false}
            className="text-lg font-bold"
          />
        )}
      </div>

      {/* Question */}
      <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border-2 border-primary/20">
        <p className="text-2xl font-bold text-center">{exercise.prompt_de}</p>
      </div>

      {/* Time out warning */}
      {timedOut && !isSubmitted && (
        <div className="flex items-center gap-2 text-orange-600 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm font-medium">Zeit abgelaufen! Die Antwort wird trotzdem gezahlt.</span>
        </div>
      )}

      {/* Answer input - large and centered for quick typing */}
      <div className="flex justify-center">
        <Input
          type="text"
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          disabled={disabled}
          className={`text-2xl text-center w-48 h-14 font-bold ${getBorderColor()}`}
          placeholder="?"
          autoComplete="off"
          autoFocus
        />
      </div>

      {/* Context/translation */}
      <p className="text-center text-sm text-muted-foreground">
        {exercise.prompt_en}
      </p>

      {/* Result comparison */}
      {isSubmitted && (
        <div className="text-center space-y-2">
          {!isCorrect && (
            <>
              <p className="text-red-600">
                Du: <span className="line-through">{answer || '(keine Antwort)'}</span>
              </p>
              <p className="text-green-600 text-xl font-bold">
                Richtig: {exercise.correct_answer}
              </p>
            </>
          )}
          {isCorrect && (
            <p className="text-green-600 text-xl font-bold">
              {exercise.correct_answer} - Richtig!
            </p>
          )}
        </div>
      )}
    </div>
  )
}
