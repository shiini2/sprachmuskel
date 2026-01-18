// B1 Exam Readiness Score Calculator

import { GrammarTopic, UserTopicProgress, Level } from '@/types/database'

export interface ReadinessScore {
  overall: number // 0-100
  byLevel: {
    A1: number
    A2: number
    B1: number
  }
  weakestTopics: Array<{
    id: number
    name_de: string
    name_en: string
    proficiency: number
    level: string
  }>
  strongestTopics: Array<{
    id: number
    name_de: string
    name_en: string
    proficiency: number
    level: string
  }>
  daysUntilExam: number | null
  projectedReadyDate: Date | null
  recommendation: string
  recommendationDe: string
}

interface TopicWithProgress {
  topic: GrammarTopic
  progress: UserTopicProgress | null
}

export function calculateReadinessScore(
  topics: TopicWithProgress[],
  examDate: Date | null,
  currentLevel: Level
): ReadinessScore {
  // Group topics by level
  const byLevel = {
    A1: topics.filter((t) => t.topic.level === 'A1'),
    A2: topics.filter((t) => t.topic.level === 'A2'),
    B1: topics.filter((t) => t.topic.level === 'B1'),
  }

  // Calculate level scores (weighted by topic importance)
  const calculateLevelScore = (levelTopics: TopicWithProgress[]): number => {
    if (levelTopics.length === 0) return 0

    let totalWeight = 0
    let weightedScore = 0

    for (const { topic, progress } of levelTopics) {
      const proficiency = progress?.proficiency ?? 0
      const weight = topic.weight

      weightedScore += proficiency * weight
      totalWeight += weight
    }

    return totalWeight > 0 ? weightedScore / totalWeight : 0
  }

  const levelScores = {
    A1: calculateLevelScore(byLevel.A1),
    A2: calculateLevelScore(byLevel.A2),
    B1: calculateLevelScore(byLevel.B1),
  }

  // Overall score: weighted combination
  // A1 and A2 are prerequisites, B1 is the goal
  const overallScore =
    levelScores.A1 * 0.15 + // A1 should be solid (15%)
    levelScores.A2 * 0.30 + // A2 is important bridge (30%)
    levelScores.B1 * 0.55 // B1 is main focus (55%)

  // Find weakest and strongest topics
  const allWithScores = topics.map(({ topic, progress }) => ({
    id: topic.id,
    name_de: topic.name_de,
    name_en: topic.name_en,
    proficiency: progress?.proficiency ?? 0,
    level: topic.level,
    weight: topic.weight,
    // Priority score for weakness: low proficiency + high weight + current/target level
    weaknessScore:
      (100 - (progress?.proficiency ?? 0)) * topic.weight *
      (topic.level === 'B1' ? 1.5 : topic.level === 'A2' ? 1.2 : 1),
  }))

  const sorted = [...allWithScores].sort((a, b) => b.weaknessScore - a.weaknessScore)
  const weakestTopics = sorted.slice(0, 5).map(({ id, name_de, name_en, proficiency, level }) => ({
    id,
    name_de,
    name_en,
    proficiency,
    level,
  }))

  const sortedByStrength = [...allWithScores].sort((a, b) => b.proficiency - a.proficiency)
  const strongestTopics = sortedByStrength.slice(0, 3).map(({ id, name_de, name_en, proficiency, level }) => ({
    id,
    name_de,
    name_en,
    proficiency,
    level,
  }))

  // Days until exam
  let daysUntilExam: number | null = null
  if (examDate) {
    const today = new Date()
    daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntilExam < 0) daysUntilExam = 0
  }

  // Projected ready date
  // Assumes ~1% improvement per day with consistent practice
  const pointsNeeded = Math.max(0, 75 - overallScore)
  const daysToReady = Math.ceil(pointsNeeded / 0.8) // 0.8% per day is realistic
  const projectedReadyDate = new Date()
  projectedReadyDate.setDate(projectedReadyDate.getDate() + daysToReady)

  // Generate recommendation
  const { recommendation, recommendationDe } = generateRecommendation(
    overallScore,
    levelScores,
    weakestTopics,
    daysUntilExam
  )

  return {
    overall: Math.round(overallScore),
    byLevel: {
      A1: Math.round(levelScores.A1),
      A2: Math.round(levelScores.A2),
      B1: Math.round(levelScores.B1),
    },
    weakestTopics,
    strongestTopics,
    daysUntilExam,
    projectedReadyDate: overallScore < 75 ? projectedReadyDate : null,
    recommendation,
    recommendationDe,
  }
}

function generateRecommendation(
  overall: number,
  byLevel: { A1: number; A2: number; B1: number },
  weakestTopics: Array<{ name_de: string; level: string }>,
  daysUntilExam: number | null
): { recommendation: string; recommendationDe: string } {
  // Check if any level is particularly weak
  if (byLevel.A1 < 60) {
    return {
      recommendation: `Focus on A1 basics first. Your foundation needs strengthening before moving to harder topics.`,
      recommendationDe: `Konzentriere dich zuerst auf A1-Grundlagen. Dein Fundament muss starker werden.`,
    }
  }

  if (byLevel.A2 < 50) {
    return {
      recommendation: `Strengthen your A2 grammar. Key topics to practice: ${weakestTopics
        .filter((t) => t.level === 'A2')
        .slice(0, 2)
        .map((t) => t.name_de)
        .join(', ')}.`,
      recommendationDe: `Starke deine A2-Grammatik. Wichtige Themen: ${weakestTopics
        .filter((t) => t.level === 'A2')
        .slice(0, 2)
        .map((t) => t.name_de)
        .join(', ')}.`,
    }
  }

  if (overall >= 75) {
    return {
      recommendation: `You're exam-ready! Keep practicing to maintain your skills. Focus on any remaining weak spots.`,
      recommendationDe: `Du bist prufungsbereit! Ube weiter, um deine Fahigkeiten zu halten.`,
    }
  }

  if (daysUntilExam !== null && daysUntilExam < 30 && overall < 60) {
    return {
      recommendation: `Exam is soon! Intensify practice on: ${weakestTopics
        .slice(0, 3)
        .map((t) => t.name_de)
        .join(', ')}. Consider daily sessions.`,
      recommendationDe: `Die Prufung ist bald! Intensive Ubung bei: ${weakestTopics
        .slice(0, 3)
        .map((t) => t.name_de)
        .join(', ')}. Taglich uben!`,
    }
  }

  const topWeakness = weakestTopics[0]
  return {
    recommendation: `Good progress! Next focus: ${topWeakness.name_de} (${topWeakness.level}). Practice daily for best results.`,
    recommendationDe: `Guter Fortschritt! Nachster Fokus: ${topWeakness.name_de}. Taglich uben fur beste Ergebnisse.`,
  }
}

// Calculate daily practice goal based on exam date and current readiness
export function calculateDailyGoal(
  currentReadiness: number,
  daysUntilExam: number | null,
  targetReadiness: number = 75
): { minutes: number; exercises: number; urgency: 'low' | 'medium' | 'high' } {
  const gap = targetReadiness - currentReadiness

  if (gap <= 0) {
    return { minutes: 15, exercises: 10, urgency: 'low' }
  }

  if (daysUntilExam === null || daysUntilExam > 90) {
    // Plenty of time
    return { minutes: 15, exercises: 10, urgency: 'low' }
  }

  if (daysUntilExam > 30) {
    // 1-3 months
    const intensity = gap > 30 ? 'high' : 'medium'
    return {
      minutes: intensity === 'high' ? 30 : 20,
      exercises: intensity === 'high' ? 20 : 15,
      urgency: intensity,
    }
  }

  // Less than a month
  return {
    minutes: 30,
    exercises: 25,
    urgency: 'high',
  }
}
