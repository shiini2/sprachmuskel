'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GrammarTopic } from '@/types/database'
import { LessonContent } from '@/app/api/tutor/lesson/route'
import {
  BookOpen,
  Lightbulb,
  AlertTriangle,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react'

interface MiniLessonProps {
  topic: GrammarTopic
  lesson: LessonContent
  onContinue: () => void
  isLoading?: boolean
}

export function MiniLesson({ topic, lesson, onContinue, isLoading }: MiniLessonProps) {
  const [showEnglish, setShowEnglish] = useState(false)

  if (isLoading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Lektion wird geladen...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">
              {showEnglish ? lesson.title_en : lesson.title_de}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{topic.level}</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEnglish(!showEnglish)}
              className="text-xs"
            >
              {showEnglish ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {showEnglish ? 'Deutsch' : 'English'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Rule */}
        <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-lg">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-primary mb-1">
                {showEnglish ? 'Key Rule' : 'Die wichtigste Regel'}
              </p>
              <p className="text-lg">
                {showEnglish ? lesson.key_rule_en : lesson.key_rule_de}
              </p>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div>
          <p className="text-muted-foreground">
            {showEnglish ? lesson.explanation_en : lesson.explanation_de}
          </p>
        </div>

        {/* Examples */}
        <div className="space-y-3">
          <h3 className="font-semibold">
            {showEnglish ? 'Examples' : 'Beispiele'}
          </h3>
          <div className="space-y-2">
            {lesson.examples.map((example, idx) => (
              <div
                key={idx}
                className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg"
              >
                <p className="font-medium">{example.de}</p>
                {showEnglish && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {example.en}
                  </p>
                )}
                {example.highlight && (
                  <p className="text-xs text-primary mt-1">
                    → {example.highlight}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Common Mistakes */}
        {lesson.common_mistakes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold">
                {showEnglish ? 'Common Mistakes' : 'Haufige Fehler'}
              </h3>
            </div>
            <div className="space-y-2">
              {lesson.common_mistakes.map((mistake, idx) => (
                <div
                  key={idx}
                  className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-sm"
                >
                  <p>
                    <span className="text-red-500 line-through">{mistake.wrong}</span>
                    {' → '}
                    <span className="text-green-600 font-medium">{mistake.correct}</span>
                  </p>
                  <p className="text-muted-foreground mt-1">
                    {showEnglish ? mistake.tip_en : mistake.tip_de}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Remember Tip */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-sm">
            <span className="font-semibold">
              {showEnglish ? 'Remember: ' : 'Merke dir: '}
            </span>
            {showEnglish ? lesson.remember_en : lesson.remember_de}
          </p>
        </div>

        {/* Continue Button */}
        <Button onClick={onContinue} className="w-full" size="lg">
          {showEnglish ? "Got it, let's practice!" : 'Verstanden, los geht\'s!'}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  )
}
