'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import { getQuizByLessonId, getQuizQuestions, submitQuizAttempt } from '@/lib/api/quiz';
import { Quiz, QuizQuestion, QuizOption } from '@/types/database';

interface QuizPlayerProps {
    lessonId: string;
    onComplete?: () => void;
}

export default function QuizPlayer({ lessonId, onComplete }: QuizPlayerProps) {
    const { user } = useAuth();
    const { addToast } = useToast();

    // Data state
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Play state
    const [status, setStatus] = useState<'loading' | 'intro' | 'playing' | 'results'>('loading');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> answer text
    const [score, setScore] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadQuiz = async () => {
            if (!lessonId) return;
            try {
                // 1. Get Quiz Metadata
                const quizData = await getQuizByLessonId(lessonId);

                if (!quizData) {
                    if (isMounted) {
                        setError('Quiz not found for this lesson.');
                        setStatus('intro'); // Or error state
                        setIsLoading(false);
                    }
                    return;
                }

                if (isMounted) setQuiz(quizData);

                // 2. Get Questions
                const questionsData = await getQuizQuestions(quizData.id);
                if (isMounted) {
                    setQuestions(questionsData || []);
                    setStatus('intro');
                }

            } catch (err: any) {
                console.error('Failed to load quiz:', err);
                if (isMounted) setError(err.message || 'Failed to load quiz');
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadQuiz();
        return () => { isMounted = false; };
    }, [lessonId]);

    const handleStart = () => {
        setStatus('playing');
        setCurrentQuestionIndex(0);
        setAnswers({});
        setScore(0);
    };

    const handleAnswerSelect = (questionId: string, value: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            finishQuiz();
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const finishQuiz = async () => {
        if (!quiz || !user) return;

        // Calculate score
        let totalScore = 0;
        let maxScore = 0;

        questions.forEach(q => {
            maxScore += q.points;
            if (answers[q.id] === q.correct_answer) {
                totalScore += q.points;
            }
        });

        const passed = totalScore >= (quiz.passing_score || 0); // Assuming passing_score is absolute points for now, or %? 
        // Logic check: passing_score in DB is integer. Usually % is better, but let's assume points for simplicity 
        // OR better: treat passing_score as Percentage (60 = 60%).

        const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
        const isPassed = percentage >= (quiz.passing_score || 0);

        setScore(percentage);
        setStatus('results');

        // Submit to DB
        setIsSubmitting(true);
        try {
            await submitQuizAttempt(user.id, quiz.id, totalScore, maxScore, isPassed, answers);
            if (isPassed && onComplete) {
                onComplete();
            }
        } catch (err) {
            console.error('Failed to submit results:', err);
            addToast({ type: 'error', title: 'Failed to save results', message: 'Please check your internet connection.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentQuestion = questions[currentQuestionIndex];

    if (isLoading) {
        return <div className="p-8 text-center text-gray-400">Loading quiz...</div>;
    }

    if (error || !quiz) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="bg-red-500/10 p-4 rounded-full mb-4">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Quiz currently unavailable</h3>
                <p className="text-gray-400">{error || "We couldn't find the quiz questions."}</p>
            </div>
        );
    }

    if (status === 'intro') {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center max-w-2xl mx-auto">
                <div className="bg-primary-500/10 p-6 rounded-full mb-6">
                    <svg className="w-12 h-12 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold mb-4">{quiz.title}</h1>
                <p className="text-gray-400 text-lg mb-8">
                    This quiz contains {questions.length} questions.
                    You need {quiz.passing_score}% to pass.
                    {quiz.time_limit_minutes && `Time limit: ${quiz.time_limit_minutes} minutes.`}
                </p>
                <div className="flex gap-4">
                    <Button size="lg" onClick={handleStart}>
                        Start Quiz
                    </Button>
                </div>
            </div>
        );
    }

    if (status === 'results') {
        const passed = score >= (quiz.passing_score || 60);
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center max-w-2xl mx-auto">
                <div className={`p-6 rounded-full mb-6 ${passed ? 'bg-success-500/10' : 'bg-red-500/10'}`}>
                    {passed ? (
                        <svg className="w-12 h-12 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ) : (
                        <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                </div>
                <h2 className="text-3xl font-bold mb-2">
                    {passed ? 'Congratulations!' : 'Keep Practicing'}
                </h2>
                <div className="text-6xl font-black mb-6 flex items-baseline justify-center">
                    <span className={passed ? 'text-success-500' : 'text-red-500'}>
                        {Math.round(score)}%
                    </span>
                </div>
                <p className="text-gray-400 text-lg mb-8">
                    {passed
                        ? "You've mastered this topic. Great work!"
                        : "You didn't reach the passing score this time. Review the material and try again."}
                </p>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={handleStart}>
                        Retry Quiz
                    </Button>
                    {passed && (
                        <Button onClick={onComplete}>
                            Continue Lesson
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col max-w-3xl mx-auto p-4 lg:p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-medium text-gray-400">
                    Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="text-sm font-medium text-primary-400">
                    {/* Timer could go here */}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-gray-800 rounded-full mb-8">
                <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
            </div>

            {/* Question */}
            <div className="flex-1 overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6">
                    {currentQuestion.question_text}
                </h2>

                <div className="space-y-3">
                    {currentQuestion.options?.map((option: any, idx: number) => {
                        const isSelected = answers[currentQuestion.id] === option.text;
                        return (
                            <label
                                key={idx}
                                className={`
                                    flex items-center gap-4 p-4 rounded-xl cursor-pointer border-2 transition-all
                                    ${isSelected
                                        ? 'border-primary-500 bg-primary-500/10'
                                        : 'border-gray-700 hover:border-gray-500 bg-gray-800'
                                    }
                                `}
                            >
                                <div className={`
                                    w-6 h-6 rounded-full border-2 flex items-center justify-center
                                    ${isSelected ? 'border-primary-500' : 'border-gray-500'}
                                `}>
                                    {isSelected && <div className="w-3 h-3 bg-primary-500 rounded-full" />}
                                </div>
                                <input
                                    type="radio"
                                    name={`question-${currentQuestion.id}`}
                                    value={option.text}
                                    checked={isSelected}
                                    onChange={() => handleAnswerSelect(currentQuestion.id, option.text)}
                                    className="hidden"
                                />
                                <span className="text-lg">{option.text}</span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-700">
                <Button
                    variant="ghost"
                    onClick={handlePrev}
                    disabled={currentQuestionIndex === 0}
                >
                    Previous
                </Button>
                <Button
                    onClick={handleNext}
                    disabled={!answers[currentQuestion.id]}
                >
                    {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                </Button>
            </div>
        </div>
    );
}
