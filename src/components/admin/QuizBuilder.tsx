'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { getQuiz, createQuiz, updateQuiz, saveQuizQuestions } from '@/lib/api/quiz';

interface QuizBuilderProps {
    lessonId: string;
    lessonTitle: string;
    onClose: () => void;
}

interface Question {
    id?: string;
    question_text: string;
    question_type: 'mcq' | 'short_answer';
    options: { text: string; is_correct: boolean }[];
    correct_answer?: string;
    points: number;
}

export function QuizBuilder({ lessonId, lessonTitle, onClose }: QuizBuilderProps) {
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Quiz Metadata
    const [quizId, setQuizId] = useState<string | null>(null);
    const [settings, setSettings] = useState({
        title: `${lessonTitle} Quiz`,
        passing_score: 70,
        time_limit_minutes: 30
    });

    // Questions State
    const [questions, setQuestions] = useState<Question[]>([]);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);

    // Initial Load
    useEffect(() => {
        loadQuiz();
    }, [lessonId]);

    const loadQuiz = async () => {
        try {
            const data = await getQuiz(lessonId);
            if (data) {
                setQuizId(data.id);
                setSettings({
                    title: data.title,
                    passing_score: data.passing_score,
                    time_limit_minutes: data.time_limit_minutes || 0
                });
                setQuestions(data.questions || []);
            }
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Failed to load quiz' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let currentQuizId = quizId;

            // 1. Create or Update Quiz Record
            if (currentQuizId) {
                await updateQuiz(currentQuizId, {
                    title: settings.title,
                    passing_score: settings.passing_score,
                    time_limit_minutes: settings.time_limit_minutes
                });
            } else {
                const newQuiz = await createQuiz({
                    lesson_id: lessonId,
                    title: settings.title,
                    passing_score: settings.passing_score,
                    time_limit_minutes: settings.time_limit_minutes
                });
                currentQuizId = newQuiz.id;
                setQuizId(newQuiz.id);
            }

            // 2. Save Questions
            // 2. Save Questions
            if (currentQuizId) {
                const questionsToSave = questions.map((q, idx) => ({
                    ...q,
                    order_index: idx,
                    quiz_id: currentQuizId,
                    options: q.options // Ensure options are passed
                }));
                // @ts-ignore - Temporary bypass if strict types still complain about specific fields, but structure should now match better
                await saveQuizQuestions(currentQuizId, questionsToSave);
            }

            addToast({ type: 'success', title: 'Quiz saved successfully' });
            onClose();
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Failed to save quiz' });
        } finally {
            setIsSaving(false);
        }
    };

    const addQuestion = () => {
        const newQuestion: Question = {
            question_text: '',
            question_type: 'mcq',
            options: [
                { text: '', is_correct: false },
                { text: '', is_correct: false }
            ],
            points: 1
        };
        setQuestions([...questions, newQuestion]);
        setActiveQuestionIndex(questions.length);
    };

    const removeQuestion = (index: number) => {
        const newQuestions = [...questions];
        newQuestions.splice(index, 1);
        setQuestions(newQuestions);
        if (activeQuestionIndex === index) setActiveQuestionIndex(null);
    };

    const updateQuestion = (index: number, updates: Partial<Question>) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], ...updates };
        setQuestions(newQuestions);
    };

    if (isLoading) return <div className="p-8 text-center">Loading Quiz...</div>;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--background)] w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col">

                {/* Header */}
                <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[var(--foreground)]">Quiz Builder</h2>
                    <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

                    {/* Sidebar: Question List */}
                    <div className="w-full lg:w-64 border-r border-[var(--border)] overflow-y-auto p-4 bg-[var(--muted)]/10">
                        <div className="space-y-4 mb-6">
                            <h3 className="font-medium text-sm text-[var(--muted-foreground)]">SETTINGS</h3>
                            <Input
                                label="Quiz Title"
                                value={settings.title}
                                onChange={e => setSettings(s => ({ ...s, title: e.target.value }))}
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    label="Pass (%)"
                                    type="number"
                                    value={settings.passing_score}
                                    onChange={e => setSettings(s => ({ ...s, passing_score: Number(e.target.value) }))}
                                />
                                <Input
                                    label="Time (min)"
                                    type="number"
                                    value={settings.time_limit_minutes}
                                    onChange={e => setSettings(s => ({ ...s, time_limit_minutes: Number(e.target.value) }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-medium text-sm text-[var(--muted-foreground)] flex justify-between items-center">
                                QUESTIONS
                                <button onClick={addQuestion} className="text-primary-600 text-xs hover:underline">+ Add</button>
                            </h3>
                            {questions.map((q, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setActiveQuestionIndex(idx)}
                                    className={`p-3 rounded-lg text-sm cursor-pointer border ${activeQuestionIndex === idx
                                        ? 'bg-primary-50 border-primary-200 dark:bg-primary-900/20 dark:border-primary-800'
                                        : 'bg-[var(--card-bg)] border-[var(--border)] hover:border-primary-300'
                                        }`}
                                >
                                    <div className="flex justify-between">
                                        <span className="font-medium truncate flex-1">
                                            {idx + 1}. {q.question_text || '(Untitled)'}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }}
                                            className="text-error-500 hover:text-error-600 ml-2"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <div className="text-xs text-[var(--muted-foreground)] mt-1 uppercase">
                                        {q.question_type}
                                    </div>
                                </div>
                            ))}
                            {questions.length === 0 && (
                                <p className="text-xs text-[var(--muted-foreground)] text-center py-4">
                                    No questions yet
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Main Area: Editor */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {activeQuestionIndex !== null && questions[activeQuestionIndex] ? (
                            <div className="space-y-6 max-w-2xl mx-auto">
                                <h3 className="text-lg font-medium text-[var(--foreground)]">
                                    Question {activeQuestionIndex + 1}
                                </h3>

                                <div className="space-y-4">
                                    <Textarea
                                        label="Question Text"
                                        value={questions[activeQuestionIndex].question_text}
                                        onChange={(e) => updateQuestion(activeQuestionIndex, { question_text: e.target.value })}
                                        placeholder="Enter the question here..."
                                        rows={3}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <Select
                                            label="Type"
                                            value={questions[activeQuestionIndex].question_type}
                                            options={[
                                                { value: 'mcq', label: 'Multiple Choice' },
                                                { value: 'short_answer', label: 'Short Answer' }
                                            ]}
                                            onChange={(e) => updateQuestion(activeQuestionIndex, { question_type: e.target.value as any })}
                                        />
                                        <Input
                                            label="Points"
                                            type="number"
                                            value={questions[activeQuestionIndex].points}
                                            onChange={(e) => updateQuestion(activeQuestionIndex, { points: Number(e.target.value) })}
                                        />
                                    </div>

                                    {questions[activeQuestionIndex].question_type === 'mcq' && (
                                        <div className="space-y-3">
                                            <label className="text-sm font-medium text-[var(--foreground)]">Options</label>
                                            {questions[activeQuestionIndex].options.map((option, optIdx) => (
                                                <div key={optIdx} className="flex gap-2 items-center">
                                                    <input
                                                        type="radio"
                                                        name={`correct-${activeQuestionIndex}`}
                                                        checked={option.is_correct}
                                                        onChange={() => {
                                                            const newOptions = [...questions[activeQuestionIndex].options];
                                                            newOptions.forEach(o => o.is_correct = false);
                                                            newOptions[optIdx].is_correct = true;
                                                            updateQuestion(activeQuestionIndex, { options: newOptions });
                                                        }}
                                                        className="w-4 h-4 text-primary-600 cursor-pointer"
                                                    />
                                                    <Input
                                                        value={option.text}
                                                        onChange={(e) => {
                                                            const newOptions = [...questions[activeQuestionIndex].options];
                                                            newOptions[optIdx].text = e.target.value;
                                                            updateQuestion(activeQuestionIndex, { options: newOptions });
                                                        }}
                                                        placeholder={`Option ${optIdx + 1}`}
                                                        className="flex-1"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const newOptions = [...questions[activeQuestionIndex].options];
                                                            newOptions.splice(optIdx, 1);
                                                            updateQuestion(activeQuestionIndex, { options: newOptions });
                                                        }}
                                                        className="text-error-500 hover:text-error-600 text-xl px-2"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    const newOptions = [...questions[activeQuestionIndex].options, { text: '', is_correct: false }];
                                                    updateQuestion(activeQuestionIndex, { options: newOptions });
                                                }}
                                            >
                                                + Add Option
                                            </Button>
                                        </div>
                                    )}

                                    {questions[activeQuestionIndex].question_type === 'short_answer' && (
                                        <Input
                                            label="Correct Answer (Exact Match)"
                                            value={questions[activeQuestionIndex].correct_answer || ''}
                                            onChange={(e) => updateQuestion(activeQuestionIndex, { correct_answer: e.target.value })}
                                            placeholder="Enter the correct answer..."
                                        />
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-[var(--muted-foreground)]">
                                <p>Select a question to edit or add a new one.</p>
                                <Button className="mt-4" onClick={addQuestion}>Create Question</Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--border)] flex justify-end gap-3 bg-[var(--muted)]/10">
                    <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSave} isLoading={isSaving} disabled={questions.length === 0}>
                        Save Quiz
                    </Button>
                </div>
            </div>
        </div>
    );
}
