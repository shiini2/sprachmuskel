'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GeneratedExercise } from '@/types/exercises'

interface FillTheGapProps {
  exercise: GeneratedExercise
  onAnswerChange: (answer: string) => void
  answer: string
  isSubmitted: boolean
  isCorrect: boolean | null
  disabled: boolean
}

export function FillTheGap({
  exercise,
  onAnswerChange,
  answer,
  isSubmitted,
  isCorrect,
  disabled,
}: FillTheGapProps) {
  const getBorderColor = () => {
    if (!isSubmitted) return ''
    if (isCorrect) return 'border-green-500 focus-visible:ring-green-500'
    return 'border-red-500 focus-visible:ring-red-500'
  }

  // Split the sentence at the gap
  const sentenceWithGap = exercise.sentence_with_gap || exercise.prompt_de
  const parts = sentenceWithGap.split('___')

  return (
    <div className="space-y-4">
      {/* Instruction */}
      <p className="text-sm text-muted-foreground">
        Fulle die Lucke mit dem richtigen Wort:
      </p>

      {/* English context */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm">
        <span className="text-muted-foreground">Bedeutung: </span>
        <span>{exercise.prompt_en}</span>
      </div>

      {/* Sentence with inline input */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border text-lg leading-relaxed">
        {parts.length === 2 ? (
          <>
            <span>{parts[0]}</span>
            <Input
              type="text"
              value={answer}
              onChange={(e) => onAnswerChange(e.target.value)}
              disabled={disabled}
              className={`inline-block w-32 mx-1 text-center ${getBorderColor()}`}
              placeholder="..."
              autoComplete="off"
              autoFocus
            />
            <span>{parts[1]}</span>
          </>
        ) : (
          <>
            <p className="mb-4">{sentenceWithGap}</p>
            <div className="space-y-2">
              <Label htmlFor="answer">Deine Antwort:</Label>
              <Input
                id="answer"
                type="text"
                value={answer}
                onChange={(e) => onAnswerChange(e.target.value)}
                disabled={disabled}
                className={`${getBorderColor()}`}
                placeholder="Das fehlende Wort..."
                autoComplete="off"
                autoFocus
              />
            </div>
          </>
        )}
      </div>

      {/* Show result comparison if wrong */}
      {isSubmitted && !isCorrect && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Du hast geschrieben:</p>
            <p className="line-through text-red-600">{answer || '(leer)'}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Richtig ware:</p>
            <p className="text-green-600 font-medium">{exercise.correct_answer}</p>
          </div>
        </div>
      )}

      {/* Full correct sentence after submission */}
      {isSubmitted && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-muted-foreground mb-1">Vollstandiger Satz:</p>
          <p className="font-medium">
            {parts[0]}
            <span className="text-green-600 font-bold">{exercise.correct_answer}</span>
            {parts[1]}
          </p>
        </div>
      )}
    </div>
  )
}
