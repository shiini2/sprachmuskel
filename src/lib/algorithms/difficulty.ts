// Adaptive difficulty algorithm
// Target: 60-75% success rate (optimal learning zone)

export interface PerformanceData {
  topicId: number
  recentAttempts: number
  recentCorrect: number
  averageTimeSeconds: number
  currentDifficulty: number
}

export interface DifficultyAdjustment {
  newDifficulty: number
  reason: string
  shouldIncreaseChallenge: boolean
}

const MIN_DIFFICULTY = 1
const MAX_DIFFICULTY = 5
const MIN_ATTEMPTS_FOR_ADJUSTMENT = 5
const OPTIMAL_SUCCESS_RATE_LOW = 0.60
const OPTIMAL_SUCCESS_RATE_HIGH = 0.75

export function calculateDifficultyAdjustment(
  performance: PerformanceData
): DifficultyAdjustment {
  const { recentAttempts, recentCorrect, currentDifficulty } = performance

  // Not enough data yet
  if (recentAttempts < MIN_ATTEMPTS_FOR_ADJUSTMENT) {
    return {
      newDifficulty: currentDifficulty,
      reason: 'Noch nicht genug Daten',
      shouldIncreaseChallenge: false,
    }
  }

  const successRate = recentCorrect / recentAttempts

  // Too easy - increase difficulty
  if (successRate > OPTIMAL_SUCCESS_RATE_HIGH + 0.05) {
    // >80%
    if (currentDifficulty < MAX_DIFFICULTY) {
      return {
        newDifficulty: currentDifficulty + 1,
        reason: `Sehr gut! Erhohung der Schwierigkeit (${Math.round(successRate * 100)}% richtig)`,
        shouldIncreaseChallenge: true,
      }
    }
    return {
      newDifficulty: MAX_DIFFICULTY,
      reason: 'Maximale Schwierigkeit erreicht',
      shouldIncreaseChallenge: false,
    }
  }

  // Too hard - decrease difficulty
  if (successRate < OPTIMAL_SUCCESS_RATE_LOW - 0.10) {
    // <50%
    if (currentDifficulty > MIN_DIFFICULTY) {
      return {
        newDifficulty: currentDifficulty - 1,
        reason: `Etwas einfacher machen (${Math.round(successRate * 100)}% richtig)`,
        shouldIncreaseChallenge: false,
      }
    }
    return {
      newDifficulty: MIN_DIFFICULTY,
      reason: 'Minimale Schwierigkeit - weiter uben!',
      shouldIncreaseChallenge: false,
    }
  }

  // In optimal zone
  return {
    newDifficulty: currentDifficulty,
    reason: `Optimaler Bereich (${Math.round(successRate * 100)}% richtig)`,
    shouldIncreaseChallenge: false,
  }
}

// Calculate proficiency based on recent performance
export function calculateProficiency(
  attempts: number,
  correct: number,
  currentDifficulty: number,
  daysSinceLastPractice: number
): number {
  if (attempts === 0) return 0

  const successRate = correct / attempts

  // Weight by difficulty (higher difficulty = more valuable)
  const difficultyBonus = (currentDifficulty - 1) * 0.1 // 0-40% bonus

  // Base proficiency from success rate
  let proficiency = successRate * 100

  // Apply difficulty bonus
  proficiency = proficiency * (1 + difficultyBonus)

  // Apply decay for time since last practice
  const decayFactor = Math.max(0.5, 1 - daysSinceLastPractice * 0.02)
  proficiency = proficiency * decayFactor

  // Cap at 100
  return Math.min(100, Math.round(proficiency))
}

// Determine which topics to focus on
export function selectTopicsForSession(
  topicProgress: Array<{
    topicId: number
    level: string
    proficiency: number
    daysSinceLastPractice: number
    weight: number
  }>,
  userLevel: string,
  sessionLength: number = 5 // number of exercises
): number[] {
  const levelOrder = ['A1', 'A2', 'B1']
  const userLevelBase = userLevel.substring(0, 2) // 'A1', 'A2', or 'B1'
  const userLevelIndex = levelOrder.indexOf(userLevelBase)

  // Filter to topics at or below user's level
  const relevantTopics = topicProgress.filter((t) => {
    const topicLevelIndex = levelOrder.indexOf(t.level)
    return topicLevelIndex <= userLevelIndex
  })

  // Score each topic (lower score = higher priority)
  const scoredTopics = relevantTopics.map((topic) => {
    // Prioritize:
    // 1. Low proficiency topics
    // 2. Topics not practiced recently
    // 3. Topics at current level (not below)
    // 4. Higher weight topics (more important for B1)

    let score = topic.proficiency

    // Boost topics not practiced recently
    score -= topic.daysSinceLastPractice * 2

    // Boost current level topics
    const topicLevelIndex = levelOrder.indexOf(topic.level)
    if (topicLevelIndex === userLevelIndex) {
      score -= 20
    }

    // Boost high-weight topics
    score -= topic.weight * 10

    return { ...topic, score }
  })

  // Sort by score (lowest first = highest priority)
  scoredTopics.sort((a, b) => a.score - b.score)

  // Select topics for session
  // Mix: mostly priority topics, but include some variety
  const priorityCount = Math.ceil(sessionLength * 0.7)
  const varietyCount = sessionLength - priorityCount

  const selected: number[] = []

  // Add priority topics
  for (let i = 0; i < Math.min(priorityCount, scoredTopics.length); i++) {
    selected.push(scoredTopics[i].topicId)
  }

  // Add variety (random from remaining)
  const remaining = scoredTopics.slice(priorityCount)
  for (let i = 0; i < Math.min(varietyCount, remaining.length); i++) {
    const randomIndex = Math.floor(Math.random() * remaining.length)
    selected.push(remaining[randomIndex].topicId)
    remaining.splice(randomIndex, 1)
  }

  return selected
}
