'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Languages } from 'lucide-react'

interface GermanExplanationProps {
  explanationDe: string
  explanationEn: string
  onEnglishRevealed?: () => void
  className?: string
}

export function GermanExplanation({
  explanationDe,
  explanationEn,
  onEnglishRevealed,
  className = '',
}: GermanExplanationProps) {
  const [showEnglish, setShowEnglish] = useState(false)

  const handleShowEnglish = () => {
    if (!showEnglish) {
      setShowEnglish(true)
      onEnglishRevealed?.()
    } else {
      setShowEnglish(false)
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* German explanation (always visible) */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border">
        <p className="text-sm">{explanationDe}</p>
      </div>

      {/* English toggle button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleShowEnglish}
        className="text-muted-foreground hover:text-foreground"
      >
        <Languages className="w-4 h-4 mr-2" />
        {showEnglish ? 'Englisch ausblenden' : 'Auf Englisch erklaren'}
        {showEnglish ? (
          <ChevronUp className="w-4 h-4 ml-1" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-1" />
        )}
      </Button>

      {/* English explanation (collapsible) */}
      {showEnglish && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">{explanationEn}</p>
        </div>
      )}
    </div>
  )
}
