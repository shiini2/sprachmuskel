import { Level, GrammarTopic } from '@/types/database'
import {
  PlacementQuestion,
  TopicAssessment,
  KnowledgeMap,
  LearningPathItem,
  MasteryLevel,
  QuizState
} from '@/types/placement'

// Level progression order (using profile Level type)
const LEVEL_ORDER: Level[] = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2']

// Map grammar topic level to nearest profile level
const GRAMMAR_TO_PROFILE_LEVEL: Record<string, Level> = {
  'A1': 'A1.2',
  'A2': 'A2.2',
  'B1': 'B1.2',
}

// Thresholds for level assessment
const MASTERY_THRESHOLD = 0.75 // 75% correct to consider mastered
const LEARNING_THRESHOLD = 0.50 // 50% correct to consider learning
const MIN_QUESTIONS_PER_TOPIC = 3
const MAX_QUESTIONS_PER_TOPIC = 6

// Calculate mastery level based on success rate
export function calculateMasteryLevel(correct: number, total: number): MasteryLevel {
  if (total === 0) return 'not_assessed'

  const rate = correct / total

  if (rate >= 0.90) return 'mastered'
  if (rate >= 0.75) return 'practiced'
  if (rate >= 0.50) return 'learning'
  return 'not_learned'
}

// Calculate confidence score (0-1)
export function calculateConfidence(correct: number, total: number): number {
  if (total === 0) return 0
  return Math.round((correct / total) * 100) / 100
}

// Determine if we should continue testing a topic
export function shouldContinueTopic(
  correct: number,
  total: number,
  maxQuestions: number = MAX_QUESTIONS_PER_TOPIC
): boolean {
  if (total >= maxQuestions) return false
  if (total < MIN_QUESTIONS_PER_TOPIC) return true

  // Only stop early if we have enough data and confidence is very high/low
  const rate = correct / total
  if (total >= 5 && (rate >= 0.95 || rate <= 0.15)) return false

  return true
}

// Determine overall level from topic assessments
export function determineOverallLevel(
  assessments: TopicAssessment[],
  topics: GrammarTopic[]
): Level {
  // Group assessments by level
  const levelScores: Record<string, { correct: number; total: number }> = {
    'A1': { correct: 0, total: 0 },
    'A2': { correct: 0, total: 0 },
    'B1': { correct: 0, total: 0 },
  }

  for (const assessment of assessments) {
    const topic = topics.find(t => t.id === assessment.topic_id)
    if (!topic) continue

    const levelKey = topic.level.substring(0, 2) as 'A1' | 'A2' | 'B1'
    levelScores[levelKey].correct += assessment.questions_correct
    levelScores[levelKey].total += assessment.questions_asked
  }

  // Determine level based on performance
  const a1Rate = levelScores.A1.total > 0 ? levelScores.A1.correct / levelScores.A1.total : 0
  const a2Rate = levelScores.A2.total > 0 ? levelScores.A2.correct / levelScores.A2.total : 0
  const b1Rate = levelScores.B1.total > 0 ? levelScores.B1.correct / levelScores.B1.total : 0

  // Determine level (returns profile Level type)
  if (b1Rate >= MASTERY_THRESHOLD) return 'B1.2'
  if (a2Rate >= MASTERY_THRESHOLD && b1Rate >= LEARNING_THRESHOLD) return 'B1.1'
  if (a2Rate >= MASTERY_THRESHOLD) return 'A2.2'
  if (a1Rate >= MASTERY_THRESHOLD && a2Rate >= LEARNING_THRESHOLD) return 'A2.1'
  if (a1Rate >= MASTERY_THRESHOLD) return 'A1.2'
  return 'A1.1'
}

// Generate a personalized learning path
export function generateLearningPath(
  assessments: TopicAssessment[],
  topics: GrammarTopic[]
): LearningPathItem[] {
  const path: LearningPathItem[] = []

  // Sort topics by level order, then by weight
  const grammarLevelOrder = ['A1', 'A2', 'B1']
  const sortedTopics = [...topics].sort((a, b) => {
    const levelDiff = grammarLevelOrder.indexOf(a.level) - grammarLevelOrder.indexOf(b.level)
    if (levelDiff !== 0) return levelDiff
    return (b.weight || 1) - (a.weight || 1)
  })

  let priority = 1

  for (const topic of sortedTopics) {
    const assessment = assessments.find(a => a.topic_id === topic.id)

    // Skip if already mastered
    if (assessment?.mastery_level === 'mastered') continue

    // Determine status and estimated sessions
    let status: 'pending' | 'in_progress' = 'pending'
    let estimatedSessions = 3

    if (assessment) {
      const confidence = assessment.confidence_score

      if (confidence >= 0.75) {
        estimatedSessions = 1 // Just needs review
      } else if (confidence >= 0.50) {
        estimatedSessions = 2 // Needs some practice
        status = 'in_progress'
      } else if (confidence >= 0.25) {
        estimatedSessions = 4 // Needs significant work
        status = 'in_progress'
      } else {
        estimatedSessions = 5 // Needs to learn from scratch
      }
    }

    path.push({
      user_id: '', // Will be set when saving
      topic_id: topic.id,
      topic,
      priority,
      status,
      estimated_sessions: estimatedSessions,
      completed_sessions: 0,
      target_mastery: 0.80,
    })

    priority++
  }

  return path
}

// Build knowledge map from assessments
export function buildKnowledgeMap(
  assessments: TopicAssessment[],
  topics: GrammarTopic[]
): KnowledgeMap {
  const enrichedAssessments = assessments.map(a => ({
    ...a,
    topic: topics.find(t => t.id === a.topic_id),
  }))

  const strongTopics = enrichedAssessments.filter(a =>
    a.mastery_level === 'mastered' || a.mastery_level === 'practiced'
  )

  const weakTopics = enrichedAssessments.filter(a =>
    a.mastery_level === 'learning'
  )

  const notLearnedTopics = enrichedAssessments.filter(a =>
    a.mastery_level === 'not_learned' || a.mastery_level === 'not_assessed'
  )

  // Calculate readiness score (weighted by exam importance)
  let totalWeight = 0
  let achievedWeight = 0

  for (const topic of topics) {
    const weight = topic.weight || 1
    totalWeight += weight

    const assessment = assessments.find(a => a.topic_id === topic.id)
    if (assessment) {
      achievedWeight += weight * assessment.confidence_score
    }
  }

  const readinessScore = totalWeight > 0
    ? Math.round((achievedWeight / totalWeight) * 100)
    : 0

  return {
    assessments: enrichedAssessments,
    overallLevel: determineOverallLevel(assessments, topics),
    strongTopics,
    weakTopics,
    notLearnedTopics,
    readinessScore,
  }
}

// Select next question in adaptive quiz
export function selectNextQuestion(
  state: QuizState,
  availableQuestions: PlacementQuestion[],
  topics: GrammarTopic[]
): PlacementQuestion | null {
  // Group questions by topic
  const questionsByTopic = new Map<number, PlacementQuestion[]>()

  for (const q of availableQuestions) {
    const topicId = q.topic.id
    if (!questionsByTopic.has(topicId)) {
      questionsByTopic.set(topicId, [])
    }
    questionsByTopic.get(topicId)!.push(q)
  }

  // Find topics that need more testing
  const grammarLevelOrder = ['A1', 'A2', 'B1']
  const topicsNeedingTest: { topicId: number; level: string; priority: number }[] = []

  for (const [topicId, questions] of questionsByTopic) {
    const results = state.topicResults.get(topicId) || { correct: 0, total: 0 }

    if (shouldContinueTopic(results.correct, results.total)) {
      const topic = topics.find(t => t.id === topicId)
      if (topic) {
        // Priority: lower levels first, then exam weight
        const levelPriority = grammarLevelOrder.indexOf(topic.level) * 100
        const weightPriority = 10 - (topic.weight || 1)

        topicsNeedingTest.push({
          topicId,
          level: topic.level,
          priority: levelPriority + weightPriority,
        })
      }
    }
  }

  if (topicsNeedingTest.length === 0) return null

  // Sort by priority and pick one (with some randomness)
  topicsNeedingTest.sort((a, b) => a.priority - b.priority)

  // Pick from top 3 with some randomness
  const topCandidates = topicsNeedingTest.slice(0, 3)
  const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)]

  // Get unused questions for this topic
  const topicQuestions = questionsByTopic.get(selected.topicId) || []
  const usedQuestionIds = new Set(state.answers.map(a => a.questionId))
  const unusedQuestions = topicQuestions.filter(q => !usedQuestionIds.has(q.id))

  if (unusedQuestions.length === 0) return null

  // Pick a question based on current performance
  const results = state.topicResults.get(selected.topicId) || { correct: 0, total: 0 }
  const successRate = results.total > 0 ? results.correct / results.total : 0.5

  // Sort by difficulty and pick appropriately
  unusedQuestions.sort((a, b) => a.difficulty - b.difficulty)

  let targetDifficulty: number
  if (successRate >= 0.75) {
    targetDifficulty = 4 // Doing well, give harder
  } else if (successRate >= 0.50) {
    targetDifficulty = 3 // Medium
  } else {
    targetDifficulty = 2 // Struggling, give easier
  }

  // Find question closest to target difficulty
  let bestQuestion = unusedQuestions[0]
  let bestDiff = Math.abs(bestQuestion.difficulty - targetDifficulty)

  for (const q of unusedQuestions) {
    const diff = Math.abs(q.difficulty - targetDifficulty)
    if (diff < bestDiff) {
      bestDiff = diff
      bestQuestion = q
    }
  }

  return bestQuestion
}

// Calculate estimated time to B1 readiness
export function estimateTimeToB1(
  learningPath: LearningPathItem[],
  dailyMinutes: number
): { days: number; sessions: number } {
  const totalSessions = learningPath.reduce((sum, item) => {
    if (item.status === 'completed') return sum
    return sum + (item.estimated_sessions - item.completed_sessions)
  }, 0)

  // Assume average 2 sessions per practice day
  const sessionsPerDay = Math.max(1, Math.floor(dailyMinutes / 5))
  const days = Math.ceil(totalSessions / sessionsPerDay)

  return { days, sessions: totalSessions }
}
