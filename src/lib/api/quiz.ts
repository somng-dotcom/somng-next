import { createClient } from '@/lib/supabase/client';
import { Database, Quiz, QuizQuestion, QuizAttempt } from '@/types/database';

const supabase = createClient();

export async function getQuizByLessonId(lessonId: string) {
    const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('lesson_id', lessonId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
    }
    return data as Quiz;
}

export async function getQuizQuestions(quizId: string) {
    const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('order_index', { ascending: true });

    if (error) throw error;
    return data as QuizQuestion[];
}

export async function submitQuizAttempt(
    userId: string,
    quizId: string,
    score: number,
    maxScore: number,
    passed: boolean,
    answers: Record<string, any>
) {
    const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
            user_id: userId,
            quiz_id: quizId,
            score,
            max_score: maxScore,
            passed,
            answers,
            started_at: new Date().toISOString(), // In a real app, strict start time might be tracked earlier
            completed_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) throw error;
    return data as QuizAttempt;
}

export async function getUserQuizStats(userId: string) {
    const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId);

    if (error) throw error;

    const attempts = data || [];
    const totalTaken = attempts.length;

    if (totalTaken === 0) {
        return { totalTaken: 0, averageScore: 0 };
    }

    const totalPercentage = attempts.reduce((sum, attempt) => {
        const percentage = attempt.max_score > 0 ? (attempt.score / attempt.max_score) * 100 : 0;
        return sum + percentage;
    }, 0);

    return {
        totalTaken,
        averageScore: Math.round(totalPercentage / totalTaken)
    };
}
