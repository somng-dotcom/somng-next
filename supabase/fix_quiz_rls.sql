-- Enable RLS
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- Allow anyone (authenticated) to view quizzes and questions
-- In a stricter app, we would query enrollments, but for now we trust the app's navigation guards
CREATE POLICY "Authenticated users can view quizzes" ON quizzes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view quiz questions" ON quiz_questions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admins can do everything
CREATE POLICY "Admins can manage quizzes" ON quizzes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage quiz questions" ON quiz_questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
