'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PlacementQuestion as PlacementQuestionType } from '@/types/placement'
import { Loader2 } from 'lucide-react'

interface PlacementQuestionProps {
  question: PlacementQuestionType
  onAnswer: (answer: string) => Promise<boolean>
  questionNumber: number
  totalQuestions: number
}

export function PlacementQuestion({
  question,
  onAnswer,
  questionNumber,
  totalQuestions,
}: PlacementQuestionProps) {
  const [answer, setAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (isSubmitting) return

    const userAnswer = question.type === 'grammar_choice' ? selectedOption : answer
    if (!userAnswer?.trim()) return

    setIsSubmitting(true)
    await onAnswer(userAnswer)
    setIsSubmitting(false)
    setAnswer('')
    setSelectedOption(null)
  }

  const getQuestionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      translate: 'Ubersetzen',
      fill_gap: 'Lucke fullen',
      grammar_choice: 'Grammatik wahlen',
      error_detection: 'Fehler finden',
    }
    return labels[type] || type
  }

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'translate':
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium">{question.prompt_en}</p>
            <Input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Auf Deutsch schreiben..."
              className="text-lg"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={isSubmitting}
              autoFocus
            />
          </div>
        )

      case 'fill_gap':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{question.prompt_en}</p>
            <p className="text-lg font-medium">{question.prompt_de}</p>
            <Input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Das fehlende Wort..."
              className="text-lg"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={isSubmitting}
              autoFocus
            />
          </div>
        )

      case 'grammar_choice':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{question.prompt_en}</p>
            {question.prompt_de && (
              <p className="text-lg font-medium">{question.prompt_de}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              {question.options?.map((option, idx) => (
                <Button
                  key={idx}
                  variant={selectedOption === option ? 'default' : 'outline'}
                  className="h-12 text-base"
                  onClick={() => setSelectedOption(option)}
                  disabled={isSubmitting}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )

      case 'error_detection':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{question.prompt_en}</p>
            <p className="text-lg font-medium border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-50 dark:bg-yellow-900/20">
              {question.prompt_de}
            </p>
            <Input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Die korrigierte Version..."
              className="text-lg"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={isSubmitting}
              autoFocus
            />
          </div>
        )

      default:
        return null
    }
  }

  const canSubmit = question.type === 'grammar_choice' ? !!selectedOption : !!answer.trim()

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Frage {questionNumber} von {totalQuestions}
          </span>
          <div className="flex gap-2">
            <Badge variant="outline">{getQuestionTypeLabel(question.type)}</Badge>
            <Badge variant="secondary">{question.topic.level}</Badge>
          </div>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-4">
        <Badge variant="secondary" className="mb-2">
          {question.topic.name_de}
        </Badge>

        {renderQuestionContent()}

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Wird gepruft...
            </>
          ) : (
            'Weiter'
          )}
        </Button>

        {question.hint && (
          <p className="text-sm text-muted-foreground text-center">
            Hinweis: {question.hint}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
