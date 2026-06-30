-- =============================================
-- GoalSlider AI - Supabase Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Topics Table (master data for exam topics)
CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  pyq_frequency INT NOT NULL DEFAULT 5,
  marks_weightage_govt INT NOT NULL DEFAULT 5,
  marks_weightage_placement INT NOT NULL DEFAULT 5,
  difficulty INT NOT NULL DEFAULT 5,
  videos INT NOT NULL DEFAULT 3,
  pyqs INT NOT NULL DEFAULT 10,
  practice INT NOT NULL DEFAULT 15,
  notes INT NOT NULL DEFAULT 4,
  study_minutes INT NOT NULL DEFAULT 90,
  syllabus_weight INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Students Table (linked to Supabase Auth users)
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT NOT NULL,
  exam_profile TEXT DEFAULT 'govt' CHECK (exam_profile IN ('govt', 'placement')),
  target_score INT DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Student Weakness Table (per topic weakness scores)
CREATE TABLE IF NOT EXISTS student_weakness (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  topic_id TEXT REFERENCES topics(id) ON DELETE CASCADE,
  weakness_score INT DEFAULT 5 CHECK (weakness_score BETWEEN 1 AND 10),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, topic_id)
);

-- 4. Student Progress Table (tracks task completion)
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  topic_id TEXT REFERENCES topics(id) ON DELETE CASCADE,
  videos_done BOOLEAN DEFAULT FALSE,
  videos_completed_at TIMESTAMPTZ,
  pyqs_done BOOLEAN DEFAULT FALSE,
  pyqs_completed_at TIMESTAMPTZ,
  practice_done BOOLEAN DEFAULT FALSE,
  practice_completed_at TIMESTAMPTZ,
  study_seconds INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, topic_id)
);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_weakness ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

-- Students can only read/write their own data
CREATE POLICY "Students: own data only" ON students
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Weakness: own data only" ON student_weakness
  FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Progress: own data only" ON student_progress
  FOR ALL USING (auth.uid() = student_id);

-- Topics are publicly readable
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Topics: public read" ON topics
  FOR SELECT USING (true);

-- =============================================
-- Seed Data: Insert default topics
-- =============================================

INSERT INTO topics (id, name, category, pyq_frequency, marks_weightage_govt, marks_weightage_placement, difficulty, videos, pyqs, practice, notes, study_minutes, syllabus_weight) VALUES
('t1', 'Quantitative Aptitude: Percentages & Interest', 'Quantitative Aptitude', 10, 14, 10, 3, 5, 25, 40, 6, 120, 10),
('t2', 'Quantitative Aptitude: Time, Speed & Distance', 'Quantitative Aptitude', 8, 12, 8, 6, 4, 18, 30, 5, 110, 9),
('t3', 'Data Interpretation: Charts & Tables', 'Quantitative Aptitude', 9, 15, 12, 5, 4, 22, 35, 4, 90, 11),
('t4', 'Logical Reasoning: Syllogisms & Arrangements', 'Logical Reasoning', 9, 13, 10, 4, 4, 20, 30, 5, 95, 10),
('t5', 'Logical Reasoning: Coding-Decoding & Series', 'Logical Reasoning', 10, 10, 8, 2, 3, 28, 45, 4, 70, 8),
('t6', 'Verbal Ability: Reading Comprehension', 'Verbal & English', 7, 12, 10, 5, 3, 15, 25, 5, 80, 10),
('t7', 'Verbal Ability: Error Spotting & Grammar', 'Verbal & English', 8, 8, 6, 3, 3, 16, 30, 4, 65, 7),
('t8', 'Technical: Data Structures & Algorithms', 'Technical Core', 8, 2, 22, 7, 9, 30, 50, 10, 240, 18),
('t9', 'Technical: Database Systems (DBMS) & SQL', 'Technical Core', 6, 4, 12, 4, 4, 15, 25, 6, 100, 10),
('t10', 'General Awareness: Economy & Current Affairs', 'General Knowledge', 9, 10, 2, 5, 5, 30, 40, 8, 110, 9)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Function: Auto-create student profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.students (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
