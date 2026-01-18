'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Flame, Trophy } from 'lucide-react'

interface StreakDisplayProps {
  currentStreak: number
  longestStreak: number
}

export function StreakDisplay({ currentStreak, longestStreak }: StreakDisplayProps) {
  const getStreakMessage = () => {
    if (currentStreak === 0) return 'Starte heute deine Serie!'
    if (currentStreak === 1) return 'Guter Start!'
    if (currentStreak < 7) return 'Weiter so!'
    if (currentStreak < 30) return 'Fantastisch!'
    if (currentStreak < 100) return 'Unglaublich!'
    return 'Legende!'
  }

  const getFlameSize = () => {
    if (currentStreak < 7) return 'w-8 h-8'
    if (currentStreak < 30) return 'w-10 h-10'
    return 'w-12 h-12'
  }

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Flame
                className={`${getFlameSize()} text-orange-500 ${
                  currentStreak >= 7 ? 'animate-pulse' : ''
                }`}
              />
              {currentStreak >= 30 && (
                <span className="absolute -top-1 -right-1 text-xs">🔥</span>
              )}
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-600">
                {currentStreak}
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                {currentStreak === 1 ? 'Tag' : 'Tage'} Serie
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">
              {getStreakMessage()}
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Trophy className="w-4 h-4" />
              <span>Rekord: {longestStreak}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
