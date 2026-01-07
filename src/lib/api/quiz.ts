import { createClient } from '@/lib/supabase/client';



interface QuizQuestion {
    id?: string;
    quiz_id?: string;
    question_text: string;
    question_type: 'multiple_choice' | 'true_false' | 'short_answer';
    options: any; // JSONB - allowing flexible structure
    correct_answer: string;
    points: number;
    order_index: number;
}

interface QuizUpdate {
    title?: string;
    passing_score?: number;
    time_limit_minutes?: number | null;
    is_published?: boolean;
}

export async function getQuiz(lessonId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('quizzes')
        .select(`
            *,
            questions:quiz_questions(*)
        `)
        .eq('lesson_id', lessonId)
        .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows

    if (data?.questions) {
        data.questions.sort((a: QuizQuestion, b: QuizQuestion) => a.order_index - b.order_index);
    }

    return data;
}

export async function createQuiz(quiz: {
    lesson_id: string;
    title: string;
    passing_score: number;
    time_limit_minutes?: number;
}) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('quizzes')
        .insert(quiz)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateQuiz(id: string, updates: QuizUpdate) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('quizzes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function saveQuizQuestions(quizId: string, questions: QuizQuestion[]) {
    // 1. Delete existing questions (simple replace strategy for now)
    // In a production app, you might want to be smarter about this to preserve student answers history if needed
    // But since this is an admin editing tool, full replace is safer for consistency
    const supabase = createClient();
    const { error: deleteError } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('quiz_id', quizId);

    if (deleteError) throw deleteError;

    // 2. Insert new questions
    if (questions.length === 0) return;

    const questionsToInsert = questions.map((q, index) => ({
        quiz_id: quizId,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options, // JSONB
        correct_answer: q.correct_answer,
        points: q.points || 1,
        order_index: index
    }));

    // We already have client from above
    const { error: insertError } = await supabase
        .from('quiz_questions')
        .insert(questionsToInsert);

    if (insertError) throw insertError;
}

// Alias for compatibility with QuizPlayer component
export async function getQuizByLessonId(lessonId: string) {
    return getQuiz(lessonId);
}

export async function getQuizQuestions(quizId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('order_index', { ascending: true });

    if (error) throw error;
    return data;
}

export async function submitQuizAttempt(
    userId: string,
    quizId: string,
    score: number,
    maxScore: number,
    passed: boolean,
    answers: Record<string, string>
) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
            user_id: userId,
            quiz_id: quizId,
            score,
            max_score: maxScore,
            passed,
            answers,
            completed_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getUserQuizStats(userId: string) {
    const supabase = createClient();
    const { data: attempts, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .not('completed_at', 'is', null);

    if (error) throw error;

    if (!attempts || attempts.length === 0) {
        return {
            totalTaken: 0,
            averageScore: 0
        };
    }

    const totalTaken = attempts.length;

    // Calculate average score percentage
    const totalScorePercentage = attempts.reduce((sum, attempt) => {
        if (!attempt.score || !attempt.max_score) return sum;
        return sum + ((attempt.score / attempt.max_score) * 100);
    }, 0);

    const averageScore = Math.round(totalScorePercentage / totalTaken);

    return {
        totalTaken,
        averageScore
    };
}
