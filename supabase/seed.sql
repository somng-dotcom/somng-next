-- ============================================
-- SEED DATA for School of Mathematics Nigeria LMS
-- Run this AFTER schema.sql in Supabase SQL Editor
-- ============================================

-- ============================================
-- SAMPLE COURSES
-- ============================================
INSERT INTO courses (title, slug, description, thumbnail_url, level, is_premium, price, duration_hours, status) VALUES
(
  'JAMB Mathematics - Complete Course',
  'jamb-mathematics-complete',
  'Master all JAMB mathematics topics with comprehensive lessons, practice questions, and mock exams. This course covers everything you need to score high in your JAMB examination including Algebra, Trigonometry, Calculus, Statistics, and more.',
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
  'JAMB',
  true,
  5000,
  40,
  'published'
),
(
  'WAEC Further Mathematics',
  'waec-further-mathematics',
  'Complete preparation for WAEC Further Mathematics with solved past questions and step-by-step explanations. Perfect for students aiming for A1.',
  'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800',
  'WAEC',
  false,
  0,
  25,
  'published'
),
(
  'SS2 Algebra and Calculus',
  'ss2-algebra-calculus',
  'Learn algebra and introductory calculus concepts for SS2 students with practical examples and exercises.',
  'https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=800',
  'SS2',
  true,
  3500,
  20,
  'published'
),
(
  'SS1 Basic Mathematics',
  'ss1-basic-mathematics',
  'Foundation mathematics course covering all SS1 topics with interactive exercises and quizzes.',
  'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=800',
  'SS1',
  false,
  0,
  18,
  'published'
),
(
  'JAMB Past Questions & Solutions',
  'jamb-past-questions',
  'Comprehensive coverage of JAMB past questions from the last 10 years with detailed solutions and explanations.',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
  'JAMB',
  true,
  4500,
  35,
  'published'
),
(
  'WAEC Mathematics Core',
  'waec-mathematics-core',
  'Essential mathematics preparation for WAEC examinations with practice tests and mock exams.',
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
  'WAEC',
  true,
  4000,
  30,
  'published'
);

-- ============================================
-- MODULES FOR JAMB MATHEMATICS COURSE
-- ============================================
DO $$
DECLARE
  jamb_course_id UUID;
BEGIN
  SELECT id INTO jamb_course_id FROM courses WHERE slug = 'jamb-mathematics-complete';
  
  INSERT INTO modules (course_id, title, description, order_index) VALUES
  (jamb_course_id, 'Introduction to JAMB Mathematics', 'Get started with JAMB mathematics preparation', 1),
  (jamb_course_id, 'Number and Numeration', 'Master number bases, indices, and logarithms', 2),
  (jamb_course_id, 'Algebra', 'Linear, quadratic, and simultaneous equations', 3),
  (jamb_course_id, 'Geometry', 'Angles, triangles, circles, and coordinate geometry', 4);
END $$;

-- ============================================
-- LESSONS FOR JAMB MATHEMATICS
-- ============================================
DO $$
DECLARE
  module1_id UUID;
  module2_id UUID;
  module3_id UUID;
BEGIN
  SELECT id INTO module1_id FROM modules WHERE title = 'Introduction to JAMB Mathematics';
  SELECT id INTO module2_id FROM modules WHERE title = 'Number and Numeration';
  SELECT id INTO module3_id FROM modules WHERE title = 'Algebra';
  
  -- Module 1 lessons
  INSERT INTO lessons (module_id, title, content_type, duration_minutes, order_index, is_free_preview) VALUES
  (module1_id, 'Course Overview', 'video', 15, 1, true),
  (module1_id, 'JAMB Exam Format', 'video', 20, 2, true),
  (module1_id, 'Study Strategies', 'video', 25, 3, false);
  
  -- Module 2 lessons
  INSERT INTO lessons (module_id, title, content_type, duration_minutes, order_index, is_free_preview) VALUES
  (module2_id, 'Number Bases', 'video', 30, 1, false),
  (module2_id, 'Indices and Logarithms', 'video', 35, 2, false),
  (module2_id, 'Fractions and Decimals', 'video', 25, 3, false),
  (module2_id, 'Practice Quiz: Numbers', 'quiz', 15, 4, false);
  
  -- Module 3 lessons
  INSERT INTO lessons (module_id, title, content_type, duration_minutes, order_index, is_free_preview) VALUES
  (module3_id, 'Linear Equations', 'video', 30, 1, false),
  (module3_id, 'Quadratic Equations', 'video', 40, 2, false),
  (module3_id, 'Simultaneous Equations', 'video', 35, 3, false),
  (module3_id, 'Practice Quiz: Algebra', 'quiz', 20, 4, false);
END $$;

-- ============================================
-- MODULES AND LESSONS FOR WAEC FURTHER MATH
-- ============================================
DO $$
DECLARE
  waec_course_id UUID;
  waec_module_id UUID;
BEGIN
  SELECT id INTO waec_course_id FROM courses WHERE slug = 'waec-further-mathematics';
  
  INSERT INTO modules (course_id, title, description, order_index) VALUES
  (waec_course_id, 'Pure Mathematics', 'Algebra, trigonometry, and calculus', 1),
  (waec_course_id, 'Statistics', 'Data analysis and probability', 2);
  
  SELECT id INTO waec_module_id FROM modules WHERE title = 'Pure Mathematics' AND course_id = waec_course_id;
  
  INSERT INTO lessons (module_id, title, content_type, duration_minutes, order_index, is_free_preview) VALUES
  (waec_module_id, 'Introduction to Further Math', 'video', 20, 1, true),
  (waec_module_id, 'Complex Numbers', 'video', 35, 2, false),
  (waec_module_id, 'Matrices', 'video', 40, 3, false);
END $$;
