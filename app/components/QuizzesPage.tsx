'use client';
import React, { useEffect, useState } from 'react';
import {
    HelpCircle,
    Plus,
    Trash2,
    X,
    Save,
    RefreshCw,
    BookOpen,
    GraduationCap,
    CheckCircle2,
    Circle,
} from 'lucide-react';
import { quizzesApi, lessonsApi, subjectsApi } from '../lib/api';

interface Quiz {
    _id: string;
    lessonId: string;
    question: string;
    options: string[];
    correctAnswer: string;
}

interface Subject {
    _id: string;
    title: string;
}

interface Lesson {
    _id: string;
    title: string;
    subjectId: string;
}

export default function QuizzesPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [selectedLesson, setSelectedLesson] = useState('');
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        lessonId: '',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
    });

    // Load subjects
    useEffect(() => {
        subjectsApi
            .getAll()
            .then((data: Subject[]) => {
                setSubjects(data);
                if (data.length > 0) setSelectedSubject(data[0]._id);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Load lessons when subject changes
    useEffect(() => {
        if (!selectedSubject) return;
        lessonsApi
            .getBySubject(selectedSubject)
            .then((data: Lesson[]) => {
                setLessons(data);
                if (data.length > 0) setSelectedLesson(data[0]._id);
                else {
                    setSelectedLesson('');
                    setQuizzes([]);
                }
            })
            .catch(console.error);
    }, [selectedSubject]);

    // Load quizzes when lesson changes
    useEffect(() => {
        if (!selectedLesson) return;
        setLoading(true);
        quizzesApi
            .getByLesson(selectedLesson)
            .then(setQuizzes)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [selectedLesson]);

    const openCreate = () => {
        setForm({
            lessonId: selectedLesson,
            question: '',
            options: ['', '', '', ''],
            correctAnswer: '',
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        const validOptions = form.options.filter((o) => o.trim());
        if (validOptions.length < 2) {
            alert('At least 2 options required');
            return;
        }
        if (!form.correctAnswer) {
            alert('Please select a correct answer');
            return;
        }
        setSaving(true);
        try {
            await quizzesApi.create({
                lessonId: form.lessonId,
                question: form.question,
                options: validOptions,
                correctAnswer: form.correctAnswer,
            });
            setShowModal(false);
            const data = await quizzesApi.getByLesson(selectedLesson);
            setQuizzes(data);
        } catch (e: any) {
            alert(e.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this quiz question?')) return;
        try {
            await quizzesApi.delete(id);
            const data = await quizzesApi.getByLesson(selectedLesson);
            setQuizzes(data);
        } catch (e: any) {
            alert(e.message);
        }
    };

    const updateOption = (i: number, value: string) => {
        setForm((p) => {
            const opts = [...p.options];
            opts[i] = value;
            return { ...p, options: opts };
        });
    };

    const addOption = () => {
        setForm((p) => ({ ...p, options: [...p.options, ''] }));
    };

    const removeOption = (i: number) => {
        setForm((p) => ({
            ...p,
            options: p.options.filter((_, idx) => idx !== i),
            correctAnswer: p.correctAnswer === p.options[i] ? '' : p.correctAnswer,
        }));
    };

    return (
        <div style={{ padding: '24px 32px' }}>
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 28,
                }}
                className="animate-fadeIn"
            >
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800 }}>
                        <HelpCircle
                            size={28}
                            style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle', color: '#6c63ff' }}
                        />
                        Quizzes
                    </h1>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: 14, marginTop: 4 }}>
                        Create quiz questions for each lesson
                    </p>
                </div>
                <button className="btn-primary" onClick={openCreate} disabled={!selectedLesson}>
                    <Plus size={16} /> Add Question
                </button>
            </div>

            {/* Selectors */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
                {/* Subject selector */}
                <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>
                        Subject
                    </label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {subjects.map((s) => (
                            <button
                                key={s._id}
                                className={`tab-btn ${selectedSubject === s._id ? 'active' : ''}`}
                                onClick={() => setSelectedSubject(s._id)}
                            >
                                <BookOpen size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                                {s.title}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Lesson selector */}
            {lessons.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>
                        Lesson
                    </label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {lessons.map((l) => (
                            <button
                                key={l._id}
                                className={`tab-btn ${selectedLesson === l._id ? 'active' : ''}`}
                                onClick={() => setSelectedLesson(l._id)}
                            >
                                <GraduationCap size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                                {l.title}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Quizzes grid */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 200 }} />
                    ))}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                    {quizzes.map((quiz, i) => (
                        <div
                            key={quiz._id}
                            className="glass-card animate-fadeIn"
                            style={{ padding: 20, animationDelay: `${i * 60}ms` }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                                <div
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 700,
                                        lineHeight: 1.4,
                                        flex: 1,
                                        paddingRight: 10,
                                    }}
                                >
                                    <span
                                        style={{
                                            display: 'inline-flex',
                                            width: 24,
                                            height: 24,
                                            borderRadius: 7,
                                            background: 'rgba(108,99,255,0.12)',
                                            color: '#6c63ff',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 12,
                                            fontWeight: 700,
                                            marginRight: 8,
                                            verticalAlign: 'middle',
                                        }}
                                    >
                                        Q{i + 1}
                                    </span>
                                    {quiz.question}
                                </div>
                                <button className="btn-danger" style={{ padding: '4px 8px' }} onClick={() => handleDelete(quiz._id)}>
                                    <Trash2 size={13} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {quiz.options.map((opt, oi) => {
                                    const isCorrect = opt === quiz.correctAnswer;
                                    return (
                                        <div
                                            key={oi}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                padding: '8px 12px',
                                                borderRadius: 8,
                                                background: isCorrect ? 'rgba(0,200,83,0.08)' : 'rgba(30,41,59,0.3)',
                                                border: isCorrect ? '1px solid rgba(0,200,83,0.2)' : '1px solid transparent',
                                                fontSize: 13,
                                            }}
                                        >
                                            {isCorrect ? (
                                                <CheckCircle2 size={16} color="#4ade80" />
                                            ) : (
                                                <Circle size={16} color="var(--muted-foreground)" />
                                            )}
                                            <span style={{ color: isCorrect ? '#4ade80' : 'var(--foreground)' }}>{opt}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    {quizzes.length === 0 && selectedLesson && (
                        <div
                            className="glass-card"
                            style={{
                                gridColumn: '1 / -1',
                                padding: 40,
                                textAlign: 'center',
                                color: 'var(--muted-foreground)',
                            }}
                        >
                            <HelpCircle size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                            <p>No quiz questions for this lesson yet.</p>
                        </div>
                    )}
                    {!selectedLesson && (
                        <div
                            className="glass-card"
                            style={{
                                gridColumn: '1 / -1',
                                padding: 40,
                                textAlign: 'center',
                                color: 'var(--muted-foreground)',
                            }}
                        >
                            <GraduationCap size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                            <p>Select a lesson to view quizzes</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 550 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700 }}>New Quiz Question</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>
                                Question
                            </label>
                            <textarea
                                className="form-input"
                                value={form.question}
                                onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))}
                                placeholder="Enter your question..."
                                style={{ minHeight: 70 }}
                            />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>
                                Options (click to mark as correct)
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {form.options.map((opt, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <button
                                            onClick={() => setForm((p) => ({ ...p, correctAnswer: opt }))}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                flexShrink: 0,
                                            }}
                                            title="Mark as correct"
                                        >
                                            {form.correctAnswer === opt && opt.trim() ? (
                                                <CheckCircle2 size={20} color="#4ade80" />
                                            ) : (
                                                <Circle size={20} color="var(--muted-foreground)" />
                                            )}
                                        </button>
                                        <input
                                            className="form-input"
                                            value={opt}
                                            onChange={(e) => {
                                                const newVal = e.target.value;
                                                if (form.correctAnswer === opt) {
                                                    setForm((p) => ({ ...p, correctAnswer: newVal }));
                                                }
                                                updateOption(i, newVal);
                                            }}
                                            placeholder={`Option ${i + 1}`}
                                            style={{
                                                flex: 1,
                                                borderColor: form.correctAnswer === opt && opt.trim() ? 'rgba(0,200,83,0.3)' : undefined,
                                            }}
                                        />
                                        {form.options.length > 2 && (
                                            <button
                                                onClick={() => removeOption(i)}
                                                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button
                                className="btn-secondary"
                                onClick={addOption}
                                style={{ marginTop: 8, fontSize: 13, padding: '6px 12px' }}
                            >
                                <Plus size={14} /> Add Option
                            </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleSave} disabled={saving}>
                                <Save size={16} /> {saving ? 'Saving...' : 'Create Question'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
