'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface TimerProps {
  isRunning: boolean
  onTimeUpdate?: (seconds: number) => void
  showMinutes?: boolean
  countDown?: number // If set, counts down from this number
  onCountDownComplete?: () => void
  className?: string
}

export function Timer({
  isRunning,
  onTimeUpdate,
  showMinutes = true,
  countDown,
  onCountDownComplete,
  className = '',
}: TimerProps) {
  const [seconds, setSeconds] = useState(countDown ?? 0)

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setSeconds((prev) => {
        let newValue: number

        if (countDown !== undefined) {
          // Count down
          newValue = prev - 1
          if (newValue <= 0) {
            onCountDownComplete?.()
            return 0
          }
        } else {
          // Count up
          newValue = prev + 1
        }

        onTimeUpdate?.(newValue)
        return newValue
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, countDown, onTimeUpdate, onCountDownComplete])

  // Reset when countDown changes
  useEffect(() => {
    if (countDown !== undefined) {
      setSeconds(countDown)
    }
  }, [countDown])

  const formatTime = () => {
    if (showMinutes) {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
    return `${seconds}s`
  }

  const getColorClass = () => {
    if (countDown !== undefined) {
      if (seconds <= 3) return 'text-red-600 animate-pulse'
      if (seconds <= 5) return 'text-orange-600'
      return 'text-muted-foreground'
    }
    return 'text-muted-foreground'
  }

  return (
    <div className={`flex items-center gap-1 ${getColorClass()} ${className}`}>
      <Clock className="w-4 h-4" />
      <span className="font-mono text-sm">{formatTime()}</span>
    </div>
  )
}
