'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { KnowledgeMap } from '@/types/placement'
import { CheckCircle, AlertCircle, HelpCircle, BookOpen } from 'lucide-react'

interface KnowledgeMapDisplayProps {
  knowledgeMap: KnowledgeMap
}

export function KnowledgeMapDisplay({ knowledgeMap }: KnowledgeMapDisplayProps) {
  const {
    overallLevel,
    strongTopics,
    weakTopics,
    notLearnedTopics,
    readinessScore,
  } = knowledgeMap

  const getLevelColor = (level: string) => {
    if (level === 'B1') return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    if (level.startsWith('A2')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  }

  const getMasteryIcon = (level: string) => {
    switch (level) {
      case 'mastered':
      case 'practiced':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'learning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      default:
        return <HelpCircle className="w-4 h-4 text-slate-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Overall Level & Readiness */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Dein aktuelles Niveau
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold">{overallLevel}</span>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">B1 Bereitschaft</p>
              <p className="text-2xl font-bold">{readinessScore}%</p>
            </div>
          </div>
          <Progress value={readinessScore} className="h-3" />
          <p className="text-sm text-muted-foreground">
            {readinessScore < 30 && 'Du bist am Anfang deiner Reise nach B1. Schritt fur Schritt!'}
            {readinessScore >= 30 && readinessScore < 60 && 'Guter Fortschritt! Weiter so.'}
            {readinessScore >= 60 && readinessScore < 80 && 'Du bist auf einem guten Weg zu B1!'}
            {readinessScore >= 80 && 'Fast bereit fur B1! Nur noch ein bisschen Ubung.'}
          </p>
        </CardContent>
      </Card>

      {/* Strong Topics */}
      {strongTopics.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Starke Themen ({strongTopics.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {strongTopics.map((assessment) => (
                <Badge
                  key={assessment.topic_id}
                  variant="outline"
                  className="flex items-center gap-1 py-1"
                >
                  {getMasteryIcon(assessment.mastery_level)}
                  {assessment.topic?.name_de || `Topic ${assessment.topic_id}`}
                  <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${getLevelColor(assessment.topic?.level || 'A1')}`}>
                    {assessment.topic?.level}
                  </span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weak Topics - Need Practice */}
      {weakTopics.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Braucht Ubung ({weakTopics.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {weakTopics.map((assessment) => (
                <Badge
                  key={assessment.topic_id}
                  variant="outline"
                  className="flex items-center gap-1 py-1 border-yellow-300 dark:border-yellow-700"
                >
                  {getMasteryIcon(assessment.mastery_level)}
                  {assessment.topic?.name_de || `Topic ${assessment.topic_id}`}
                  <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${getLevelColor(assessment.topic?.level || 'A1')}`}>
                    {assessment.topic?.level}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({Math.round(assessment.confidence_score * 100)}%)
                  </span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Not Learned Topics */}
      {notLearnedTopics.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-slate-400" />
              Neu zu lernen ({notLearnedTopics.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {notLearnedTopics.slice(0, 10).map((assessment) => (
                <Badge
                  key={assessment.topic_id}
                  variant="outline"
                  className="flex items-center gap-1 py-1 opacity-70"
                >
                  {getMasteryIcon(assessment.mastery_level)}
                  {assessment.topic?.name_de || `Topic ${assessment.topic_id}`}
                  <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${getLevelColor(assessment.topic?.level || 'A1')}`}>
                    {assessment.topic?.level}
                  </span>
                </Badge>
              ))}
              {notLearnedTopics.length > 10 && (
                <Badge variant="secondary">
                  +{notLearnedTopics.length - 10} mehr
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
