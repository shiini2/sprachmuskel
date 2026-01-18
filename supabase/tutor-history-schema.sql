-- Tutor Conversation History Schema
-- Run this in Supabase SQL Editor

-- Tutor conversation messages
CREATE TABLE tutor_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'tutor')),
  content_de TEXT NOT NULL,
  content_en TEXT NOT NULL,
  examples JSONB, -- [{de: string, en: string}]
  -- Context at the time of the message
  topic_id INTEGER REFERENCES grammar_topics(id),
  question_context TEXT, -- The exercise question if any
  user_answer_context TEXT, -- The user's answer if any
  was_correct_context BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE tutor_messages ENABLE ROW LEVEL SECURITY;

-- Users can only access their own messages
CREATE POLICY "Users can manage own tutor messages" ON tutor_messages
  FOR ALL USING (auth.uid() = user_id);

-- Index for efficient retrieval
CREATE INDEX idx_tutor_messages_user_date ON tutor_messages(user_id, created_at DESC);

-- Function to get recent tutor context (last N messages)
CREATE OR REPLACE FUNCTION get_tutor_context(p_user_id UUID, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  role TEXT,
  content_de TEXT,
  content_en TEXT,
  examples JSONB,
  topic_name TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tm.role,
    tm.content_de,
    tm.content_en,
    tm.examples,
    gt.name_de as topic_name,
    tm.created_at
  FROM tutor_messages tm
  LEFT JOIN grammar_topics gt ON tm.topic_id = gt.id
  WHERE tm.user_id = p_user_id
  ORDER BY tm.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
