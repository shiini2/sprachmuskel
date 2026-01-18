'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle, Dumbbell } from 'lucide-react'
import Link from 'next/link'

interface DailyProgressProps {
  minutesPracticed: number
  goalMinutes: number
  exercisesCompleted: number
  exercisesCorrect: number
}

export function DailyProgress({
  minutesPracticed,
  goalMinutes,
  exercisesCompleted,
  exercisesCorrect,
}: DailyProgressProps) {
  const progressPercent = Math.min(100, (minutesPracticed / goalMinutes) * 100)
  const goalReached = minutesPracticed >= goalMinutes
  const accuracy = exercisesCompleted > 0
    ? Math.round((exercisesCorrect / exercisesCompleted) * 100)
    : 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Heute
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Ubungszeit</span>
            <span className="font-semibold">
              {minutesPracticed} / {goalMinutes} min
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          {goalReached && (
            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Tagesziel erreicht!
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold">{exercisesCompleted}</p>
            <p className="text-xs text-muted-foreground">Ubungen</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{accuracy}%</p>
            <p className="text-xs text-muted-foreground">Richtig</p>
          </div>
        </div>

        {/* CTA */}
        <Button asChild className="w-full" size="lg">
          <Link href="/practice">
            <Dumbbell className="w-4 h-4 mr-2" />
            {exercisesCompleted === 0 ? 'Jetzt starten' : 'Weiter uben'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
