'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, ChevronRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface PlacementPromptProps {
  hasCompletedPlacement: boolean
  detectedLevel?: string | null
}

export function PlacementPrompt({
  hasCompletedPlacement,
  detectedLevel,
}: PlacementPromptProps) {
  if (hasCompletedPlacement && detectedLevel) {
    return null // Don't show if already completed
  }

  return (
    <Card className="border-2 border-primary/50 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Personalisiere dein Lernen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Mache den Einstufungstest um einen personalisierten Lernplan zu bekommen, der genau auf dein Niveau abgestimmt ist.
        </p>
        <Button asChild className="w-full">
          <Link href="/placement">
            <BookOpen className="w-4 h-4 mr-2" />
            Einstufungstest starten
            <ChevronRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Etwa 10-15 Minuten
        </p>
      </CardContent>
    </Card>
  )
}
