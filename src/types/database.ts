export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          current_level: 'A1.1' | 'A1.2' | 'A2.1' | 'A2.2' | 'B1.1' | 'B1.2'
          exam_date: string | null
          daily_goal_minutes: number
          streak_current: number
          streak_longest: number
          last_practice_date: string | null
          english_help_count: number
          total_exercises: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          current_level?: 'A1.1' | 'A1.2' | 'A2.1' | 'A2.2' | 'B1.1' | 'B1.2'
          exam_date?: string | null
          daily_goal_minutes?: number
          streak_current?: number
          streak_longest?: number
          last_practice_date?: string | null
          english_help_count?: number
          total_exercises?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          current_level?: 'A1.1' | 'A1.2' | 'A2.1' | 'A2.2' | 'B1.1' | 'B1.2'
          exam_date?: string | null
          daily_goal_minutes?: number
          streak_current?: number
          streak_longest?: number
          last_practice_date?: string | null
          english_help_count?: number
          total_exercises?: number
          updated_at?: string
        }
      }
      grammar_topics: {
        Row: {
          id: number
          slug: string
          name_de: string
          name_en: string
          level: 'A1' | 'A2' | 'B1'
          description_de: string | null
          description_en: string | null
          order_index: number
          weight: number
        }
        Insert: {
          slug: string
          name_de: string
          name_en: string
          level: 'A1' | 'A2' | 'B1'
          description_de?: string | null
          description_en?: string | null
          order_index: number
          weight?: number
        }
        Update: {
          slug?: string
          name_de?: string
          name_en?: string
          level?: 'A1' | 'A2' | 'B1'
          description_de?: string | null
          description_en?: string | null
          order_index?: number
          weight?: number
        }
      }
      user_topic_progress: {
        Row: {
          id: number
          user_id: string
          topic_id: number
          difficulty_level: number
          attempts: number
          correct: number
          proficiency: number
          last_practiced: string | null
        }
        Insert: {
          user_id: string
          topic_id: number
          difficulty_level?: number
          attempts?: number
          correct?: number
          proficiency?: number
          last_practiced?: string | null
        }
        Update: {
          difficulty_level?: number
          attempts?: number
          correct?: number
          proficiency?: number
          last_practiced?: string | null
        }
      }
      vocabulary: {
        Row: {
          id: number
          user_id: string
          word_de: string
          word_en: string
          gender: 'der' | 'die' | 'das' | null
          part_of_speech: string | null
          example_sentence_de: string | null
          example_sentence_en: string | null
          ease_factor: number
          interval_days: number
          next_review: string
          review_count: number
          consecutive_correct: number
          created_at: string
        }
        Insert: {
          user_id: string
          word_de: string
          word_en: string
          gender?: 'der' | 'die' | 'das' | null
          part_of_speech?: string | null
          example_sentence_de?: string | null
          example_sentence_en?: string | null
          ease_factor?: number
          interval_days?: number
          next_review?: string
          review_count?: number
          consecutive_correct?: number
        }
        Update: {
          word_de?: string
          word_en?: string
          gender?: 'der' | 'die' | 'das' | null
          part_of_speech?: string | null
          example_sentence_de?: string | null
          example_sentence_en?: string | null
          ease_factor?: number
          interval_days?: number
          next_review?: string
          review_count?: number
          consecutive_correct?: number
        }
      }
      exercise_history: {
        Row: {
          id: number
          user_id: string
          exercise_type: 'reverse_translation' | 'fill_gap' | 'sentence_construction' | 'grammar_snap' | 'error_correction'
          topic_id: number | null
          prompt_en: string | null
          prompt_de: string | null
          correct_answer: string
          user_answer: string | null
          was_correct: boolean | null
          used_english_help: boolean
          time_taken_seconds: number | null
          difficulty_level: number | null
          session_id: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          exercise_type: 'reverse_translation' | 'fill_gap' | 'sentence_construction' | 'grammar_snap' | 'error_correction'
          topic_id?: number | null
          prompt_en?: string | null
          prompt_de?: string | null
          correct_answer: string
          user_answer?: string | null
          was_correct?: boolean | null
          used_english_help?: boolean
          time_taken_seconds?: number | null
          difficulty_level?: number | null
          session_id?: string | null
        }
        Update: {
          user_answer?: string | null
          was_correct?: boolean | null
          used_english_help?: boolean
          time_taken_seconds?: number | null
        }
      }
      daily_sessions: {
        Row: {
          id: number
          user_id: string
          session_date: string
          minutes_practiced: number
          exercises_completed: number
          exercises_correct: number
          started_at: string
          ended_at: string | null
        }
        Insert: {
          user_id: string
          session_date: string
          minutes_practiced?: number
          exercises_completed?: number
          exercises_correct?: number
          started_at?: string
          ended_at?: string | null
        }
        Update: {
          minutes_practiced?: number
          exercises_completed?: number
          exercises_correct?: number
          ended_at?: string | null
        }
      }
      seen_sentences: {
        Row: {
          id: number
          user_id: string
          sentence_hash: string
          created_at: string
        }
        Insert: {
          user_id: string
          sentence_hash: string
        }
        Update: never
      }
    }
    Functions: {
      update_streak: {
        Args: { p_user_id: string }
        Returns: void
      }
    }
  }
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type GrammarTopic = Database['public']['Tables']['grammar_topics']['Row']
export type UserTopicProgress = Database['public']['Tables']['user_topic_progress']['Row']
export type Vocabulary = Database['public']['Tables']['vocabulary']['Row']
export type ExerciseHistory = Database['public']['Tables']['exercise_history']['Row']
export type DailySession = Database['public']['Tables']['daily_sessions']['Row']

export type ExerciseType = ExerciseHistory['exercise_type']
export type Level = Profile['current_level']
export type GrammarLevel = GrammarTopic['level']
