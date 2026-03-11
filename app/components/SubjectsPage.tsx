'use client';
import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, Edit3, Trash2, X, Save, RefreshCw, Image as ImageIcon, Layers } from 'lucide-react';
import { subjectsApi, API_BASE } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface Subject {
    _id: string;
    title: string;
    description?: string;
    category?: string;
    level?: string;
    estimatedTime?: string;
    thumbnailUrl?: string;
    author?: string;
    status?: string;
    content?: { heading: string; points: string[] }[];
    createdAt?: string;
}

const emptyForm = {
    title: '',
    description: '',
    category: '',
    level: 'Beginner',
    estimatedTime: '',
    author: '',
    status: 'draft',
    content: [] as { heading: string; points: string[] }[],
};

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [contentBlock, setContentBlock] = useState({ heading: '', points: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await subjectsApi.getAll();
            setSubjects(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openCreate = () => {
        setEditId(null);
        setForm({ ...emptyForm, content: [] });
        setThumbnail(null);
        setShowModal(true);
    };

    const openEdit = (sub: Subject) => {
        setEditId(sub._id);
        setForm({
            title: sub.title,
            description: sub.description || '',
            category: sub.category || '',
            level: sub.level || 'Beginner',
            estimatedTime: sub.estimatedTime || '',
            author: sub.author || '',
            status: sub.status || 'draft',
            content: [...(sub.content || [])],
        });
        setThumbnail(null);
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('title', form.title);
            fd.append('description', form.description);
            fd.append('category', form.category);
            fd.append('level', form.level);
            fd.append('estimatedTime', form.estimatedTime);
            fd.append('author', form.author);
            fd.append('status', form.status);
            if (form.content.length > 0) {
                fd.append('content', JSON.stringify(form.content));
            }
            if (thumbnail) {
                fd.append('thumbnail', thumbnail);
            }

            if (editId) {
                await subjectsApi.update(editId, fd);
            } else {
                await subjectsApi.create(fd);
            }
            setShowModal(false);
            fetchData();
        } catch (e: any) {
            alert(e.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this subject?')) return;
        try {
            await subjectsApi.delete(id);
            fetchData();
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
                    points: contentBlock.points
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean),
                },
            ],
        }));
        setContentBlock({ heading: '', points: '' });
    };

    const removeContentBlock = (i: number) => {
        setForm((p) => ({ ...p, content: p.content.filter((_, idx) => idx !== i) }));
    };

    const getLevelColor = (level?: string) => {
        switch (level?.toLowerCase()) {
            case 'beginner':
                return '#4ade80';
            case 'intermediate':
                return '#ffa726';
            case 'advanced':
                return '#ef5350';
            default:
                return '#94a3b8';
        }
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
                        <BookOpen
                            size={28}
                            style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle', color: '#6c63ff' }}
                        />
                        Subjects
                    </h1>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: 14, marginTop: 4 }}>
                        Manage learning subjects and categories
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn-secondary" onClick={fetchData}>
                        <RefreshCw size={16} /> Refresh
                    </button>
                    <button className="btn-primary" onClick={openCreate}>
                        <Plus size={16} /> New Subject
                    </button>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 200 }} />
                    ))}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                    {subjects.map((sub, i) => (
                        <div
                            key={sub._id}
                            className="glass-card animate-fadeIn"
                            style={{
                                padding: 0,
                                overflow: 'hidden',
                                animationDelay: `${i * 60}ms`,
                                cursor: 'pointer',
                            }}
                        >
                            {/* Thumbnail */}
                            <div
                                style={{
                                    height: 120,
                                    background: sub.thumbnailUrl
                                        ? `url(${sub.thumbnailUrl.startsWith('/') ? API_BASE : ''}${sub.thumbnailUrl}) center/cover`
                                        : 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(0,212,170,0.2))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                }}
                            >
                                {!sub.thumbnailUrl && <BookOpen size={32} style={{ opacity: 0.3 }} />}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 10,
                                        right: 10,
                                        display: 'flex',
                                        gap: 6,
                                    }}
                                >
                                    <span
                                        className={`badge ${sub.status === 'published' ? 'badge-active' : 'badge-draft'}`}
                                    >
                                        {sub.status || 'draft'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ padding: '14px 18px' }}>
                                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{sub.title}</div>
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: 8,
                                        flexWrap: 'wrap',
                                        marginBottom: 8,
                                        alignItems: 'center',
                                    }}
                                >
                                    {sub.level && (
                                        <span
                                            className="badge"
                                            style={{
                                                background: `${getLevelColor(sub.level)}15`,
                                                color: getLevelColor(sub.level),
                                            }}
                                        >
                                            {sub.level}
                                        </span>
                                    )}
                                    {sub.category && (
                                        <span className="badge badge-purple">{sub.category}</span>
                                    )}
                                    {sub.estimatedTime && (
                                        <span
                                            style={{
                                                fontSize: 11,
                                                color: 'var(--muted-foreground)',
                                            }}
                                        >
                                            ⏱ {sub.estimatedTime}
                                        </span>
                                    )}
                                </div>
                                <div
                                    className="prose prose-sm prose-invert"
                                    style={{
                                        color: 'var(--muted-foreground)',
                                        fontSize: 13,
                                        lineHeight: 1.4,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        marginBottom: 12,
                                    }}
                                >
                                    {sub.description ? (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {sub.description}
                                        </ReactMarkdown>
                                    ) : (
                                        <p>No description</p>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn-secondary" style={{ flex: 1, padding: '6px 10px', fontSize: 13 }} onClick={() => openEdit(sub)}>
                                        <Edit3 size={13} /> Edit
                                    </button>
                                    <button className="btn-danger" style={{ padding: '6px 10px', fontSize: 13 }} onClick={() => handleDelete(sub._id)}>
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {subjects.length === 0 && (
                        <div
                            style={{
                                gridColumn: '1 / -1',
                                padding: 60,
                                textAlign: 'center',
                                color: 'var(--muted-foreground)',
                            }}
                            className="glass-card"
                        >
                            <BookOpen size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                            <p>No subjects yet. Create your first subject!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700 }}>
                                {editId ? 'Edit Subject' : 'New Subject'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>Title</label>
                                <input className="form-input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. JavaScript Fundamentals" />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>Category</label>
                                <input className="form-input" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="e.g. Programming" />
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

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>Level</label>
                                <select className="form-input form-select" value={form.level} onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))}>
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>Estimated Time</label>
                                <input className="form-input" value={form.estimatedTime} onChange={(e) => setForm((p) => ({ ...p, estimatedTime: e.target.value }))} placeholder="e.g. 2 hours" />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>Status</label>
                                <select className="form-input form-select" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>Author</label>
                            <input className="form-input" value={form.author} onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))} placeholder="Author name" />
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>Thumbnail Image</label>
                            <input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] || null)} className="form-input" />
                        </div>

                        {/* Content blocks */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>Content Blocks</label>
                            {form.content.map((block, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: '10px 14px',
                                        background: 'rgba(30,41,59,0.4)',
                                        borderRadius: 8,
                                        marginBottom: 8,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{block.heading}</div>
                                        <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 4 }}>
                                            {block.points.length} point(s)
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeContentBlock(i)}
                                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <input
                                    className="form-input"
                                    value={contentBlock.heading}
                                    onChange={(e) => setContentBlock((p) => ({ ...p, heading: e.target.value }))}
                                    placeholder="Section heading"
                                />
                                <textarea
                                    className="form-input"
                                    value={contentBlock.points}
                                    onChange={(e) => setContentBlock((p) => ({ ...p, points: e.target.value }))}
                                    placeholder="Points (one per line)"
                                    style={{ minHeight: 60 }}
                                />
                                <button className="btn-secondary" onClick={addContentBlock} style={{ alignSelf: 'flex-start' }}>
                                    <Plus size={14} /> Add Block
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
