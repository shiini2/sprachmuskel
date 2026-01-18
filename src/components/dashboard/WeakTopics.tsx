'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle } from 'lucide-react'

interface WeakTopic {
  id: number
  name_de: string
  name_en: string
  proficiency: number
  level: string
}

interface WeakTopicsProps {
  topics: WeakTopic[]
}

export function WeakTopics({ topics }: WeakTopicsProps) {
  if (topics.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Schwache Bereiche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Noch keine Daten vorhanden.
            <br />
            Starte eine Ubung, um deine Starken und Schwachen zu entdecken.
          </p>
        </CardContent>
      </Card>
    )
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'A1':
        return 'bg-green-100 text-green-800'
      case 'A2':
        return 'bg-blue-100 text-blue-800'
      case 'B1':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProficiencyColor = (proficiency: number) => {
    if (proficiency < 30) return 'text-red-600'
    if (proficiency < 50) return 'text-orange-600'
    if (proficiency < 70) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Zum Uben empfohlen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topics.map((topic) => (
            <div key={topic.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getLevelColor(topic.level)}>
                    {topic.level}
                  </Badge>
                  <span className="text-sm font-medium">{topic.name_de}</span>
                </div>
                <span
                  className={`text-sm font-semibold ${getProficiencyColor(
                    topic.proficiency
                  )}`}
                >
                  {Math.round(topic.proficiency)}%
                </span>
              </div>
              <Progress value={topic.proficiency} className="h-1.5" />
              <p className="text-xs text-muted-foreground">{topic.name_en}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
