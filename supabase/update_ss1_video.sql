-- ============================================
-- UPDATE SS1 LESSON CONTENT
-- Run this in Supabase SQL Editor
-- ============================================

-- Update the first lesson of the SS1 course with the provided YouTube link
UPDATE lessons
SET content_url = 'https://youtu.be/lMF6uTIXLNM?si=J6hFCmM3CuU4WsYD'
WHERE title = 'Simplification of Algebraic Expressions'
AND EXISTS (
  SELECT 1 FROM modules 
  JOIN courses ON modules.course_id = courses.id
  WHERE modules.id = lessons.module_id 
  AND courses.slug = 'ss1-basic-mathematics'
);
