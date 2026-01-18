import { ExerciseType, GrammarTopic } from './database'

export interface GeneratedExercise {
  type: ExerciseType
  topic: GrammarTopic
  difficulty: number
  prompt_en: string
  prompt_de: string
  correct_answer: string
  hint_de?: string
  hint_en?: string
  // For fill_gap
  sentence_with_gap?: string
  gap_options?: string[] // Optional hints, not multiple choice
  // For sentence_construction
  words?: string[]
  context?: string
  // For grammar_snap
  question_type?: 'article' | 'conjugation' | 'case' | 'preposition'
  time_limit_seconds?: number
}

export interface ExerciseResult {
  is_correct: boolean
  is_acceptable_alternative: boolean
  user_answer: string
  correct_answer: string
  errors: ExerciseError[]
  explanation_de: string
  explanation_en: string
  encouragement_de: string
  vocabulary_to_add?: VocabularyItem[]
}

export interface ExerciseError {
  type: 'grammar' | 'vocabulary' | 'word_order' | 'spelling' | 'case' | 'gender' | 'conjugation'
  description_de: string
  description_en: string
  correction: string
}

export interface VocabularyItem {
  word_de: string
  word_en: string
  gender?: 'der' | 'die' | 'das'
  part_of_speech?: string
  example_de?: string
  example_en?: string
}

export interface SessionState {
  session_id: string
  started_at: Date
  exercises_completed: number
  exercises_correct: number
  current_exercise: GeneratedExercise | null
  exercise_start_time: Date | null
  used_english_help: boolean
}

export interface PracticeSettings {
  daily_goal_minutes: number
  focus_topics: number[] // topic IDs to focus on, empty = auto
  exercise_types: ExerciseType[]
  difficulty_mode: 'adaptive' | 'fixed'
  fixed_difficulty?: number
}

export type Context = 'daily_life' | 'work' | 'travel' | 'social' | 'shopping' | 'health' | 'education'

export const CONTEXTS: Context[] = ['daily_life', 'work', 'travel', 'social', 'shopping', 'health', 'education']
