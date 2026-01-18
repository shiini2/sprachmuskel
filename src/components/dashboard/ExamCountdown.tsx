'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CalendarDays, Target, TrendingUp } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { de } from 'date-fns/locale'

interface ExamCountdownProps {
  examDate: Date | null
  readinessScore: number
  projectedReadyDate: Date | null
}

export function ExamCountdown({
  examDate,
  readinessScore,
  projectedReadyDate,
}: ExamCountdownProps) {
  const daysUntilExam = examDate
    ? differenceInDays(examDate, new Date())
    : null

  const isReady = readinessScore >= 75

  // Determine status color
  const getStatusColor = () => {
    if (isReady) return 'text-green-600'
    if (daysUntilExam !== null && daysUntilExam < 30 && readinessScore < 60) {
      return 'text-red-600'
    }
    if (daysUntilExam !== null && daysUntilExam < 60 && readinessScore < 70) {
      return 'text-yellow-600'
    }
    return 'text-blue-600'
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5" />
          B1 Prufung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Readiness Score */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Bereitschaft</span>
            <span className={`text-2xl font-bold ${getStatusColor()}`}>
              {readinessScore}%
            </span>
          </div>
          <Progress value={readinessScore} className="h-3" />
          <p className="text-xs text-muted-foreground mt-1">
            {isReady
              ? 'Du bist prufungsbereit!'
              : readinessScore >= 60
              ? 'Fast bereit - weiter so!'
              : 'Noch etwas Arbeit notig'}
          </p>
        </div>

        {/* Exam Date */}
        {examDate && daysUntilExam !== null && (
          <div className="flex items-center gap-3 pt-2 border-t">
            <CalendarDays className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {format(examDate, 'dd. MMMM yyyy', { locale: de })}
              </p>
              <p className="text-sm text-muted-foreground">
                {daysUntilExam === 0
                  ? 'Heute!'
                  : daysUntilExam === 1
                  ? 'Morgen!'
                  : `Noch ${daysUntilExam} Tage`}
              </p>
            </div>
          </div>
        )}

        {/* Projected Ready Date */}
        {!isReady && projectedReadyDate && (
          <div className="flex items-center gap-3 pt-2 border-t">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">
                Voraussichtlich bereit am
              </p>
              <p className="font-medium">
                {format(projectedReadyDate, 'dd. MMMM yyyy', { locale: de })}
              </p>
            </div>
          </div>
        )}

        {/* No exam date set */}
        {!examDate && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Kein Prufungsdatum gesetzt.
            <br />
            <a href="/settings" className="text-primary hover:underline">
              Jetzt einstellen
            </a>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
