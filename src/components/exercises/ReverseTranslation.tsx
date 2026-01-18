'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GeneratedExercise } from '@/types/exercises'

interface ReverseTranslationProps {
  exercise: GeneratedExercise
  onAnswerChange: (answer: string) => void
  answer: string
  isSubmitted: boolean
  isCorrect: boolean | null
  disabled: boolean
}

export function ReverseTranslation({
  exercise,
  onAnswerChange,
  answer,
  isSubmitted,
  isCorrect,
  disabled,
}: ReverseTranslationProps) {
  const getBorderColor = () => {
    if (!isSubmitted) return ''
    if (isCorrect) return 'border-green-500 focus-visible:ring-green-500'
    return 'border-red-500 focus-visible:ring-red-500'
  }

  return (
    <div className="space-y-4">
      {/* Instruction */}
      <p className="text-sm text-muted-foreground">
        Ubersetze den folgenden Satz ins Deutsche:
      </p>

      {/* English sentence to translate */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-lg font-medium text-blue-900 dark:text-blue-100">
          {exercise.prompt_en}
        </p>
      </div>

      {/* Answer input */}
      <div className="space-y-2">
        <Label htmlFor="answer">Deine Antwort auf Deutsch:</Label>
        <Input
          id="answer"
          type="text"
          placeholder="Schreibe den deutschen Satz..."
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          disabled={disabled}
          className={`text-lg ${getBorderColor()}`}
          autoComplete="off"
          autoFocus
        />
      </div>

      {/* Show submitted answer vs correct if wrong */}
      {isSubmitted && !isCorrect && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Du hast geschrieben:</p>
            <p className="line-through text-red-600">{answer}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Richtig ware:</p>
            <p className="text-green-600 font-medium">{exercise.correct_answer}</p>
          </div>
        </div>
      )}
    </div>
  )
}
