-- CHECK LESSONS CONTENT
-- Run this in Supabase SQL Editor
SELECT 
  l.title, 
  l.content_url, 
  l.content_type, 
  m.title as module_title
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
WHERE c.slug = 'ss1-basic-mathematics'
ORDER BY m.order_index, l.order_index;
