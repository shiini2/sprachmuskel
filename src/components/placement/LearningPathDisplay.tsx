'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LearningPathItem } from '@/types/placement'
import { Target, Clock, ChevronRight, CheckCircle } from 'lucide-react'

interface LearningPathDisplayProps {
  learningPath: LearningPathItem[]
  onStartTopic?: (topicId: number) => void
}

export function LearningPathDisplay({
  learningPath,
  onStartTopic,
}: LearningPathDisplayProps) {
  const totalSessions = learningPath.reduce((sum, item) => {
    if (item.status === 'completed') return sum
    return sum + (item.estimated_sessions - item.completed_sessions)
  }, 0)

  const completedTopics = learningPath.filter(item => item.status === 'completed').length
  const inProgressTopics = learningPath.filter(item => item.status === 'in_progress').length

  const getLevelColor = (level: string) => {
    if (level === 'B1') return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    if (level?.startsWith('A2')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600">Abgeschlossen</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-600">In Arbeit</Badge>
      case 'skipped':
        return <Badge variant="outline">Ubersprungen</Badge>
      default:
        return <Badge variant="secondary">Anstehend</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Dein Lernweg nach B1
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">{completedTopics}</p>
              <p className="text-sm text-muted-foreground">Geschafft</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{inProgressTopics}</p>
              <p className="text-sm text-muted-foreground">In Arbeit</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{learningPath.length - completedTopics}</p>
              <p className="text-sm text-muted-foreground">Verbleibend</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Etwa {totalSessions} Ubungseinheiten bis B1</span>
          </div>
        </CardContent>
      </Card>

      {/* Learning Path Items */}
      <div className="space-y-3">
        {learningPath.slice(0, 15).map((item, index) => (
          <Card
            key={item.topic_id}
            className={`transition-all ${
              item.status === 'completed' ? 'opacity-60' : ''
            } ${item.status === 'in_progress' ? 'border-blue-500 shadow-md' : ''}`}
          >
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                {/* Priority number */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${item.status === 'completed'
                    ? 'bg-green-100 text-green-600'
                    : item.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }
                `}>
                  {item.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Topic info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">
                      {item.topic?.name_de || `Topic ${item.topic_id}`}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${getLevelColor(item.topic?.level || 'A1')}`}>
                      {item.topic?.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {getStatusBadge(item.status)}
                    <span>
                      {item.completed_sessions}/{item.estimated_sessions} Einheiten
                    </span>
                  </div>
                </div>

                {/* Action button */}
                {item.status !== 'completed' && onStartTopic && (
                  <Button
                    variant={item.status === 'in_progress' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onStartTopic(item.topic_id)}
                  >
                    {item.status === 'in_progress' ? 'Weitermachen' : 'Starten'}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {learningPath.length > 15 && (
          <p className="text-center text-muted-foreground py-2">
            +{learningPath.length - 15} weitere Themen
          </p>
        )}
      </div>
    </div>
  )
}
