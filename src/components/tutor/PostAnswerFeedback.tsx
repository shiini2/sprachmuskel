'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GrammarTopic } from '@/types/database'
import { TutorChat } from './TutorChat'
import {
  CheckCircle,
  XCircle,
  MessageCircleQuestion,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react'

interface PostAnswerFeedbackProps {
  isCorrect: boolean
  topic: GrammarTopic
  question: string
  userAnswer: string
  correctAnswer: string
  explanation?: {
    explanation_de: string
    explanation_en: string
    rule_reminder_de: string
    rule_reminder_en: string
    encouragement_de: string
    encouragement_en: string
  }
  isLoadingExplanation?: boolean
  onContinue: () => void
}

export function PostAnswerFeedback({
  isCorrect,
  topic,
  question,
  userAnswer,
  correctAnswer,
  explanation,
  isLoadingExplanation,
  onContinue,
}: PostAnswerFeedbackProps) {
  const [showEnglish, setShowEnglish] = useState(false)
  const [showTutor, setShowTutor] = useState(false)

  return (
    <div className="space-y-4">
      {/* Result Card */}
      <Card className={`border-2 ${isCorrect ? 'border-green-500' : 'border-red-500'}`}>
        <CardContent className="pt-6">
          {/* Result Header */}
          <div className="flex items-center gap-3 mb-4">
            {isCorrect ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500" />
            )}
            <div>
              <p className={`font-bold text-lg ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                {isCorrect
                  ? (showEnglish ? 'Correct!' : 'Richtig!')
                  : (showEnglish ? 'Not quite right' : 'Nicht ganz richtig')}
              </p>
              {explanation && (
                <p className="text-sm text-muted-foreground">
                  {showEnglish ? explanation.encouragement_en : explanation.encouragement_de}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setShowEnglish(!showEnglish)}
            >
              {showEnglish ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>

          {/* Answers Comparison */}
          {!isCorrect && (
            <div className="space-y-2 mb-4">
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {showEnglish ? 'Your answer:' : 'Deine Antwort:'}
                </p>
                <p className="text-red-600 line-through">{userAnswer}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {showEnglish ? 'Correct answer:' : 'Richtige Antwort:'}
                </p>
                <p className="text-green-600 font-medium">{correctAnswer}</p>
              </div>
            </div>
          )}

          {/* Explanation */}
          {isLoadingExplanation ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{showEnglish ? 'Loading explanation...' : 'Erklarung wird geladen...'}</span>
            </div>
          ) : explanation ? (
            <div className="space-y-3">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <p className="mb-2">
                  {showEnglish ? explanation.explanation_en : explanation.explanation_de}
                </p>
                <p className="text-sm text-primary font-medium">
                  {showEnglish ? '📌 ' + explanation.rule_reminder_en : '📌 ' + explanation.rule_reminder_de}
                </p>
              </div>
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowTutor(true)}
              className="flex-1"
            >
              <MessageCircleQuestion className="w-4 h-4 mr-2" />
              {showEnglish ? 'Ask more' : 'Mehr fragen'}
            </Button>
            <Button onClick={onContinue} className="flex-1">
              {showEnglish ? 'Continue' : 'Weiter'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tutor Chat Modal */}
      {showTutor && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setShowTutor(false)}
          />
          <div className="relative w-full max-w-md h-[500px] bg-background rounded-lg shadow-xl border overflow-hidden">
            <TutorChat
              topic={topic}
              currentQuestion={question}
              userAnswer={userAnswer}
              wasCorrect={isCorrect}
              initialMessage={
                isCorrect
                  ? undefined
                  : (showEnglish ? 'Why was my answer wrong?' : 'Warum war meine Antwort falsch?')
              }
              onClose={() => setShowTutor(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
