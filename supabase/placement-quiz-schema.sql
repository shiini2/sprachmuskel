-- Placement Quiz and Knowledge Map Schema

-- Store placement quiz results
CREATE TABLE IF NOT EXISTS placement_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  overall_level TEXT NOT NULL, -- 'A1', 'A1.2', 'A2', 'A2.2', 'B1'
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  time_taken_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store per-topic assessment results (knowledge map)
CREATE TABLE IF NOT EXISTS topic_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES grammar_topics(id) ON DELETE CASCADE,
  placement_result_id UUID REFERENCES placement_results(id) ON DELETE CASCADE,
  questions_asked INTEGER NOT NULL DEFAULT 0,
  questions_correct INTEGER NOT NULL DEFAULT 0,
  mastery_level TEXT NOT NULL DEFAULT 'not_assessed', -- 'not_assessed', 'not_learned', 'learning', 'practiced', 'mastered'
  confidence_score NUMERIC(3,2) DEFAULT 0, -- 0.00 to 1.00
  last_assessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

-- Store personalized learning path
CREATE TABLE IF NOT EXISTS learning_path (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES grammar_topics(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 0, -- Lower = higher priority (1 = learn first)
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'skipped'
  estimated_sessions INTEGER DEFAULT 3,
  completed_sessions INTEGER DEFAULT 0,
  target_mastery NUMERIC(3,2) DEFAULT 0.80,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

-- Update profiles table to add daily goal and placement status
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS daily_goal_minutes INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS has_completed_placement BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS detected_level TEXT,
ADD COLUMN IF NOT EXISTS placement_completed_at TIMESTAMPTZ;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_topic_assessments_user ON topic_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_user ON learning_path(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_placement_results_user ON placement_results(user_id);

-- RLS Policies
ALTER TABLE placement_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own placement results"
  ON placement_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own placement results"
  ON placement_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own topic assessments"
  ON topic_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own topic assessments"
  ON topic_assessments FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own learning path"
  ON learning_path FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own learning path"
  ON learning_path FOR ALL
  USING (auth.uid() = user_id);
