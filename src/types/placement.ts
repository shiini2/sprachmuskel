import { GrammarTopic, Level } from './database'

export type MasteryLevel = 'not_assessed' | 'not_learned' | 'learning' | 'practiced' | 'mastered'

export interface PlacementQuestion {
  id: string
  topic: GrammarTopic
  level: Level
  type: 'translate' | 'fill_gap' | 'grammar_choice' | 'error_detection'
  prompt_en: string
  prompt_de?: string
  correct_answer: string
  options?: string[] // For multiple choice
  hint?: string
  difficulty: number // 1-5 within the level
}

export interface TopicAssessment {
  id?: string
  user_id: string
  topic_id: number
  topic?: GrammarTopic
  questions_asked: number
  questions_correct: number
  mastery_level: MasteryLevel
  confidence_score: number
  last_assessed_at?: string
}

export interface PlacementResult {
  id?: string
  user_id: string
  completed_at?: string
  overall_level: Level
  total_questions: number
  correct_answers: number
  time_taken_seconds?: number
}

export interface LearningPathItem {
  id?: string
  user_id: string
  topic_id: number
  topic?: GrammarTopic
  priority: number
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  estimated_sessions: number
  completed_sessions: number
  target_mastery: number
}

export interface KnowledgeMap {
  assessments: TopicAssessment[]
  overallLevel: Level
  strongTopics: TopicAssessment[]
  weakTopics: TopicAssessment[]
  notLearnedTopics: TopicAssessment[]
  readinessScore: number // 0-100
}

export interface QuizState {
  currentQuestion: number
  totalQuestions: number
  answers: { questionId: string; correct: boolean; timeTaken: number }[]
  currentLevel: Level
  startTime: number
  topicResults: Map<number, { correct: number; total: number }>
}

// Placement quiz question bank organized by topic and level
export interface QuestionBank {
  [topicId: number]: {
    topic: GrammarTopic
    questions: PlacementQuestion[]
  }
}
