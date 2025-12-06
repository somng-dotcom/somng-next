-- Add a Quiz Lesson to SS1 Module 1
DO $$
DECLARE
    v_course_id UUID;
    v_module_id UUID;
    v_lesson_id UUID;
    v_quiz_id UUID;
BEGIN
    -- Get Course ID
    SELECT id INTO v_course_id FROM courses WHERE slug = 'ss1-basic-mathematics';

    -- Get First Module ID
    SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id ORDER BY order_index LIMIT 1;

    -- 1. Create Lesson
    INSERT INTO lessons (module_id, title, content_type, order_index, duration_minutes)
    VALUES (v_module_id, 'Module 1 Assessment', 'quiz', 99, 15)
    RETURNING id INTO v_lesson_id;

    -- 2. Create Quiz
    INSERT INTO quizzes (lesson_id, title, passing_score, time_limit_minutes)
    VALUES (v_lesson_id, 'Algebraic Processes Quiz', 70, 15)
    RETURNING id INTO v_quiz_id;

    -- 3. Add Questions
    
    -- Q1
    INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, order_index, options, correct_answer)
    VALUES (
        v_quiz_id,
        'Simplify the expression: 2x + 3y - x + 2y',
        'mcq',
        10,
        1,
        '[
            {"text": "x + 5y", "is_correct": true},
            {"text": "3x + 5y", "is_correct": false},
            {"text": "x + y", "is_correct": false},
            {"text": "3x + y", "is_correct": false}
        ]'::jsonb,
        'x + 5y'
    );

    -- Q2
    INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, order_index, options, correct_answer)
    VALUES (
        v_quiz_id,
        'If x = 2 and y = 3, evaluate 2x + y',
        'mcq',
        10,
        2,
        '[
            {"text": "5", "is_correct": false},
            {"text": "6", "is_correct": false},
            {"text": "7", "is_correct": true},
            {"text": "8", "is_correct": false}
        ]'::jsonb,
        '7'
    );

    -- Q3
    INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, order_index, options, correct_answer)
    VALUES (
        v_quiz_id,
        'Expand (x + 2)(x + 3)',
        'mcq', 10, 3,
        '[
            {"text": "x^2 + 5x + 6", "is_correct": true},
            {"text": "x^2 + 6x + 5", "is_correct": false},
            {"text": "x^2 + 6", "is_correct": false},
            {"text": "x^2 + 5x + 5", "is_correct": false}
        ]'::jsonb,
        'x^2 + 5x + 6'
    );

END $$;
