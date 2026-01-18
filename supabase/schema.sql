-- Sprachmuskel Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users profile table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  current_level TEXT DEFAULT 'A1.2' CHECK (current_level IN ('A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2')),
  exam_date DATE,
  daily_goal_minutes INTEGER DEFAULT 20,
  streak_current INTEGER DEFAULT 0,
  streak_longest INTEGER DEFAULT 0,
  last_practice_date DATE,
  english_help_count INTEGER DEFAULT 0,
  total_exercises INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grammar topics with B1 curriculum
CREATE TABLE grammar_topics (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name_de TEXT NOT NULL,
  name_en TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1')),
  description_de TEXT,
  description_en TEXT,
  order_index INTEGER NOT NULL,
  weight FLOAT DEFAULT 1.0 -- Weight for readiness calculation
);

-- User progress per grammar topic
CREATE TABLE user_topic_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id INTEGER REFERENCES grammar_topics(id) ON DELETE CASCADE,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  attempts INTEGER DEFAULT 0,
  correct INTEGER DEFAULT 0,
  proficiency FLOAT DEFAULT 0 CHECK (proficiency BETWEEN 0 AND 100),
  last_practiced TIMESTAMPTZ,
  UNIQUE(user_id, topic_id)
);

-- Vocabulary with spaced repetition
CREATE TABLE vocabulary (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  word_de TEXT NOT NULL,
  word_en TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('der', 'die', 'das', NULL)),
  part_of_speech TEXT,
  example_sentence_de TEXT,
  example_sentence_en TEXT,
  -- Spaced repetition (SM-2 algorithm)
  ease_factor FLOAT DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,
  next_review TIMESTAMPTZ DEFAULT NOW(),
  review_count INTEGER DEFAULT 0,
  consecutive_correct INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercise history
CREATE TABLE exercise_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN (
    'reverse_translation',
    'fill_gap',
    'sentence_construction',
    'grammar_snap',
    'error_correction'
  )),
  topic_id INTEGER REFERENCES grammar_topics(id),
  prompt_en TEXT,
  prompt_de TEXT,
  correct_answer TEXT NOT NULL,
  user_answer TEXT,
  was_correct BOOLEAN,
  used_english_help BOOLEAN DEFAULT FALSE,
  time_taken_seconds INTEGER,
  difficulty_level INTEGER,
  session_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily sessions for streak and progress tracking
CREATE TABLE daily_sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  minutes_practiced INTEGER DEFAULT 0,
  exercises_completed INTEGER DEFAULT 0,
  exercises_correct INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  UNIQUE(user_id, session_date)
);

-- Seen sentences hash (prevent repetition)
CREATE TABLE seen_sentences (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sentence_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sentence_hash)
);

-- Row Level Security Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seen_sentences ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User topic progress: users can only access their own
CREATE POLICY "Users can manage own topic progress" ON user_topic_progress
  FOR ALL USING (auth.uid() = user_id);

-- Vocabulary: users can only access their own
CREATE POLICY "Users can manage own vocabulary" ON vocabulary
  FOR ALL USING (auth.uid() = user_id);

-- Exercise history: users can only access their own
CREATE POLICY "Users can manage own exercise history" ON exercise_history
  FOR ALL USING (auth.uid() = user_id);

-- Daily sessions: users can only access their own
CREATE POLICY "Users can manage own daily sessions" ON daily_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Seen sentences: users can only access their own
CREATE POLICY "Users can manage own seen sentences" ON seen_sentences
  FOR ALL USING (auth.uid() = user_id);

-- Grammar topics are public read
CREATE POLICY "Anyone can view grammar topics" ON grammar_topics
  FOR SELECT TO PUBLIC USING (true);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update streak
CREATE OR REPLACE FUNCTION update_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_last_practice DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
BEGIN
  SELECT last_practice_date, streak_current, streak_longest
  INTO v_last_practice, v_current_streak, v_longest_streak
  FROM profiles WHERE id = p_user_id;

  IF v_last_practice IS NULL OR v_last_practice < CURRENT_DATE - 1 THEN
    -- Streak broken or first time
    v_current_streak := 1;
  ELSIF v_last_practice = CURRENT_DATE - 1 THEN
    -- Consecutive day
    v_current_streak := v_current_streak + 1;
  END IF;
  -- If same day, don't change streak

  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;

  UPDATE profiles
  SET streak_current = v_current_streak,
      streak_longest = v_longest_streak,
      last_practice_date = CURRENT_DATE,
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index for performance
CREATE INDEX idx_exercise_history_user_date ON exercise_history(user_id, created_at DESC);
CREATE INDEX idx_vocabulary_next_review ON vocabulary(user_id, next_review);
CREATE INDEX idx_user_topic_progress_user ON user_topic_progress(user_id);
CREATE INDEX idx_daily_sessions_user_date ON daily_sessions(user_id, session_date DESC);
