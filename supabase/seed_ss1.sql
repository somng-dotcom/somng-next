-- ============================================
-- ADD SS1 COURSE CONTENT
-- Run this in Supabase SQL Editor
-- ============================================

DO $$
DECLARE
  ss1_course_id UUID;
  module_id UUID;
BEGIN
  -- Get the SS1 course ID
  SELECT id INTO ss1_course_id FROM courses WHERE slug = 'ss1-basic-mathematics';
  
  -- Create a module
  INSERT INTO modules (course_id, title, description, order_index)
  VALUES (ss1_course_id, 'Algebraic Processes', 'Fundamental algebra concepts', 1)
  RETURNING id INTO module_id;
  
  -- Create lessons
  INSERT INTO lessons (module_id, title, content_type, duration_minutes, order_index, is_free_preview)
  VALUES 
  (module_id, 'Simplification of Algebraic Expressions', 'video', 20, 1, true),
  (module_id, 'Substitution in Formulae', 'video', 15, 2, false),
  (module_id, 'Linear Equations', 'quiz', 10, 3, false);
  
END $$;
