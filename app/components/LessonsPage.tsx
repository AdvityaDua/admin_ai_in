'use client';
import React, { useEffect, useState } from 'react';
import { GraduationCap, Plus, Edit3, Trash2, X, Save, RefreshCw, ChevronRight, BookOpen, Video, Layers } from 'lucide-react';
import { lessonsApi, subjectsApi } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface Lesson {
    _id: string;
    subjectId: string;
    title: string;
    description?: string;
    content?: { heading: string; points: string[] }[];
    videoUrl?: string;
    order: number;
    subLessons?: {
        title: string;
        content?: { heading: string; points: string[] }[];
        videoUrl?: string;
        order: number;
    }[];
}

interface Subject {
    _id: string;
    title: string;
}

export default function LessonsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

    const [form, setForm] = useState({
        subjectId: '',
        title: '',
        description: '',
        videoUrl: '',
        order: 0,
        content: [] as { heading: string; points: string[] }[],
        subLessons: [] as { title: string; content: { heading: string; points: string[] }[]; videoUrl: string; order: number }[],
    });
    const [contentBlock, setContentBlock] = useState({ heading: '', points: '' });
    const [subLessonForm, setSubLessonForm] = useState({ title: '', videoUrl: '', order: 0 });

    useEffect(() => {
        subjectsApi
            .getAll()
            .then((data: Subject[]) => {
                setSubjects(data);
                if (data.length > 0) {
                    setSelectedSubject(data[0]._id);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (selectedSubject) {
            setLoading(true);
            lessonsApi
                .getBySubject(selectedSubject)
                .then(setLessons)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [selectedSubject]);

    const openCreate = () => {
        setEditId(null);
        setForm({
            subjectId: selectedSubject,
            title: '',
            description: '',
            videoUrl: '',
            order: lessons.length,
            content: [],
            subLessons: [],
        });
        setShowModal(true);
    };

    const openEdit = (lesson: Lesson) => {
        setEditId(lesson._id);
        setForm({
            subjectId: lesson.subjectId,
            title: lesson.title,
            description: lesson.description || '',
            videoUrl: lesson.videoUrl || '',
            order: lesson.order,
            content: [...(lesson.content || [])],
            subLessons: (lesson.subLessons || []).map((s) => ({
                title: s.title,
                content: [...(s.content || [])],
                videoUrl: s.videoUrl || '',
                order: s.order,
            })),
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editId) {
                await lessonsApi.update(editId, form);
            } else {
                await lessonsApi.create(form);
            }
            setShowModal(false);
            // Refresh
            const data = await lessonsApi.getBySubject(selectedSubject);
            setLessons(data);
        } catch (e: any) {
            alert(e.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this lesson?')) return;
        try {
            await lessonsApi.delete(id);
            const data = await lessonsApi.getBySubject(selectedSubject);
            setLessons(data);
        } catch (e: any) {
            alert(e.message);
        }
    };

    const addContentBlock = () => {
        if (!contentBlock.heading.trim()) return;
        setForm((p) => ({
            ...p,
            content: [
                ...p.content,
                {
                    heading: contentBlock.heading,
                    points: contentBlock.points.split('\n').map((s) => s.trim()).filter(Boolean),
                },
            ],
        }));
        setContentBlock({ heading: '', points: '' });
    };

    const addSubLesson = () => {
        if (!subLessonForm.title.trim()) return;
        setForm((p) => ({
            ...p,
            subLessons: [
                ...p.subLessons,
                { ...subLessonForm, content: [], order: p.subLessons.length },
            ],
        }));
        setSubLessonForm({ title: '', videoUrl: '', order: 0 });
    };

    const getSubjectName = (id: string) => subjects.find((s) => s._id === id)?.title || id;

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
                        <GraduationCap
                            size={28}
                            style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle', color: '#6c63ff' }}
                        />
                        Lessons
                    </h1>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: 14, marginTop: 4 }}>
                        Create and manage lessons for each subject
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn-primary" onClick={openCreate} disabled={!selectedSubject}>
                        <Plus size={16} /> New Lesson
                    </button>
                </div>
            </div>

            {/* Subject Selector */}
            <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 6, display: 'block' }}>
                    Select Subject
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {subjects.map((sub) => (
                        <button
                            key={sub._id}
                            className={`tab-btn ${selectedSubject === sub._id ? 'active' : ''}`}
                            onClick={() => setSelectedSubject(sub._id)}
                        >
                            <BookOpen size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                            {sub.title}
                        </button>
                    ))}
                    {subjects.length === 0 && (
                        <span style={{ color: 'var(--muted-foreground)', fontSize: 14, padding: '8px' }}>
                            No subjects found. Create one first!
                        </span>
                    )}
                </div>
            </div>

            {/* Lessons list */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 80 }} />
                    ))}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {lessons
                        .sort((a, b) => a.order - b.order)
                        .map((lesson, i) => (
                            <div
                                key={lesson._id}
                                className="glass-card animate-fadeIn"
                                style={{
                                    padding: 0,
                                    overflow: 'hidden',
                                    animationDelay: `${i * 50}ms`,
                                }}
                            >
                                {/* Lesson Header */}
                                <div
                                    style={{
                                        padding: '16px 20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => setExpandedLesson(expandedLesson === lesson._id ? null : lesson._id)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <div
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 10,
                                                background: 'rgba(108,99,255,0.12)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#6c63ff',
                                                fontWeight: 700,
                                                fontSize: 14,
                                            }}
                                        >
                                            {lesson.order + 1}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 15, fontWeight: 600 }}>{lesson.title}</div>
                                            <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 6 }}>
                                                {lesson.description ? (
                                                    <div className="prose prose-sm prose-invert max-w-none" style={{ WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.description}</ReactMarkdown>
                                                    </div>
                                                ) : 'No description'}

                                                <div style={{ marginTop: 8, display: 'flex', gap: 12, fontSize: 12 }}>
                                                    {lesson.videoUrl && (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <Video size={12} /> Video
                                                        </span>
                                                    )}
                                                    {(lesson.subLessons || []).length > 0 && (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <Layers size={12} /> {lesson.subLessons!.length} sub-lessons
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <button
                                            className="btn-secondary"
                                            style={{ padding: '6px 10px' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEdit(lesson);
                                            }}
                                        >
                                            <Edit3 size={13} />
                                        </button>
                                        <button
                                            className="btn-danger"
                                            style={{ padding: '6px 10px' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(lesson._id);
                                            }}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                        <ChevronRight
                                            size={18}
                                            style={{
                                                color: 'var(--muted-foreground)',
                                                transform: expandedLesson === lesson._id ? 'rotate(90deg)' : 'none',
                                                transition: 'transform 0.2s ease',
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Expanded content */}
                                {expandedLesson === lesson._id && (
                                    <div
                                        style={{
                                            padding: '0 20px 16px',
                                            borderTop: '1px solid var(--card-border)',
                                        }}
                                    >
                                        {(lesson.content || []).length > 0 && (
                                            <div style={{ marginTop: 12 }}>
                                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 8 }}>
                                                    Content Blocks
                                                </div>
                                                {lesson.content!.map((block, bi) => (
                                                    <div
                                                        key={bi}
                                                        style={{
                                                            padding: '8px 12px',
                                                            background: 'rgba(30,41,59,0.4)',
                                                            borderRadius: 8,
                                                            marginBottom: 6,
                                                        }}
                                                    >
                                                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{block.heading}</div>
                                                        <ul style={{ paddingLeft: 16, color: 'var(--muted-foreground)' }}>
                                                            {block.points.map((p, pi) => (
                                                                <li key={pi} style={{ marginBottom: 4 }}>
                                                                    <div className="prose prose-sm prose-invert max-w-none">
                                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{p}</ReactMarkdown>
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {(lesson.subLessons || []).length > 0 && (
                                            <div style={{ marginTop: 12 }}>
                                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 8 }}>
                                                    Sub-Lessons
                                                </div>
                                                {lesson.subLessons!.map((sl, si) => (
                                                    <div
                                                        key={si}
                                                        style={{
                                                            padding: '8px 12px',
                                                            background: 'rgba(30,41,59,0.3)',
                                                            borderRadius: 8,
                                                            marginBottom: 6,
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                        }}
                                                    >
                                                        <span style={{ fontSize: 13 }}>
                                                            {si + 1}. {sl.title}
                                                        </span>
                                                        {sl.videoUrl && <Video size={14} color="var(--muted-foreground)" />}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    {lessons.length === 0 && selectedSubject && (
                        <div
                            className="glass-card"
                            style={{ padding: 40, textAlign: 'center', color: 'var(--muted-foreground)' }}
                        >
                            <GraduationCap size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                            <p>No lessons for &quot;{getSubjectName(selectedSubject)}&quot; yet.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{editId ? 'Edit Lesson' : 'New Lesson'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>Title</label>
                                <input className="form-input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Lesson title" />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>Order</label>
                                <input className="form-input" type="number" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: +e.target.value }))} />
                            </div>
                        </div>

                        <div style={{ marginBottom: 12 }} data-color-mode="dark">
                            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>Description</label>
                            <MDEditor
                                value={form.description}
                                onChange={(val) => setForm((p) => ({ ...p, description: val || '' }))}
                                preview="edit"
                                height={250}
                            />
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>Video URL</label>
                            <input className="form-input" value={form.videoUrl} onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))} placeholder="https://..." />
                        </div>

                        {/* Content blocks */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>Content Blocks</label>
                            {form.content.map((block, i) => (
                                <div key={i} style={{ padding: '8px 12px', background: 'rgba(30,41,59,0.4)', borderRadius: 8, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 13 }}>{block.heading} ({block.points.length} points)</span>
                                    <button onClick={() => setForm((p) => ({ ...p, content: p.content.filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <input className="form-input" value={contentBlock.heading} onChange={(e) => setContentBlock((p) => ({ ...p, heading: e.target.value }))} placeholder="Heading" />
                                <textarea className="form-input" value={contentBlock.points} onChange={(e) => setContentBlock((p) => ({ ...p, points: e.target.value }))} placeholder="Points (one per line)" style={{ minHeight: 50 }} />
                                <button className="btn-secondary" onClick={addContentBlock} style={{ alignSelf: 'flex-start' }}>
                                    <Plus size={14} /> Add Block
                                </button>
                            </div>
                        </div>

                        {/* Sub-lessons */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>Sub-Lessons</label>
                            {form.subLessons.map((sl, i) => (
                                <div key={i} style={{ padding: '8px 12px', background: 'rgba(30,41,59,0.4)', borderRadius: 8, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 13 }}>{i + 1}. {sl.title}</span>
                                    <button onClick={() => setForm((p) => ({ ...p, subLessons: p.subLessons.filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 8 }}>
                                <input className="form-input" value={subLessonForm.title} onChange={(e) => setSubLessonForm((p) => ({ ...p, title: e.target.value }))} placeholder="Sub-lesson title" />
                                <input className="form-input" value={subLessonForm.videoUrl} onChange={(e) => setSubLessonForm((p) => ({ ...p, videoUrl: e.target.value }))} placeholder="Video URL" />
                                <button className="btn-secondary" onClick={addSubLesson} style={{ padding: '8px 14px' }}>
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleSave} disabled={saving}>
                                <Save size={16} /> {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
