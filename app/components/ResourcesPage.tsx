'use client';
import React, { useEffect, useState } from 'react';
import { FileText, Plus, Edit3, Trash2, X, Save, RefreshCw, Link as LinkIcon, Download } from 'lucide-react';
import { resourcesApi, API_BASE } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface Resource {
    _id: string;
    title: string;
    description: string;
    category: string;
    type: string;
    duration?: string;
    studyTime?: string;
    difficulty?: string;
    tags?: string[];
    featured?: boolean;
    status?: string;
    thumbnailUrl?: string;
    downloadUrl?: string;
    externalUrl?: string;
    rating?: number;
    downloads?: number;
    students?: number;
    createdAt?: string;
}

const emptyForm = {
    title: '',
    description: '',
    category: '',
    type: '',
    duration: '',
    studyTime: '',
    difficulty: 'Beginner',
    tags: '',
    featured: false,
    status: 'draft',
    externalUrl: '',
    rating: 0,
};

export default function ResourcesPage() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [resourceFile, setResourceFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await resourcesApi.getAll();
            setResources(data);
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
        setForm({ ...emptyForm });
        setThumbnail(null);
        setResourceFile(null);
        setShowModal(true);
    };

    const openEdit = (res: Resource) => {
        setEditId(res._id);
        setForm({
            title: res.title || '',
            description: res.description || '',
            category: res.category || '',
            type: res.type || '',
            duration: res.duration || '',
            studyTime: res.studyTime || '',
            difficulty: res.difficulty || 'Beginner',
            tags: res.tags ? res.tags.join(', ') : '',
            featured: res.featured || false,
            status: res.status || 'draft',
            externalUrl: res.externalUrl || '',
            rating: res.rating || 0,
        });
        setThumbnail(null);
        setResourceFile(null);
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('title', form.title);
            fd.append('description', form.description);
            fd.append('category', form.category);
            fd.append('type', form.type);
            fd.append('difficulty', form.difficulty);
            fd.append('status', form.status);
            fd.append('featured', form.featured ? 'true' : 'false');

            if (form.duration) fd.append('duration', form.duration);
            if (form.studyTime) fd.append('studyTime', form.studyTime);
            if (form.tags) fd.append('tags', form.tags); // String of comma separated tags is handled by backend Transform
            if (form.externalUrl) fd.append('externalUrl', form.externalUrl);
            if (form.rating) fd.append('rating', form.rating.toString());

            if (thumbnail) {
                fd.append('thumbnail', thumbnail);
            }
            if (resourceFile) {
                fd.append('resourceFile', resourceFile);
            }

            if (editId) {
                await resourcesApi.update(editId, fd);
            } else {
                await resourcesApi.create(fd);
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
        if (!confirm('Delete this resource?')) return;
        try {
            await resourcesApi.delete(id);
            fetchData();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const getDifficultyColor = (level?: string) => {
        switch (level?.toLowerCase()) {
            case 'beginner': return '#4ade80';
            case 'intermediate': return '#ffa726';
            case 'advanced': return '#ef5350';
            case 'expert': return '#d946ef';
            default: return '#94a3b8';
        }
    };

    return (
        <div style={{ padding: '24px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }} className="animate-fadeIn">
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800 }}>
                        <FileText size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle', color: '#6c63ff' }} />
                        Resources
                    </h1>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: 14, marginTop: 4 }}>
                        Manage downloadable materials, courses, and guides
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn-secondary" onClick={fetchData}>
                        <RefreshCw size={16} /> Refresh
                    </button>
                    <button className="btn-primary" onClick={openCreate}>
                        <Plus size={16} /> New Resource
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                    {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200 }} />)}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                    {resources.map((res, i) => (
                        <div key={res._id} className="glass-card animate-fadeIn" style={{ padding: 0, overflow: 'hidden', animationDelay: `${i * 60}ms` }}>
                            <div style={{
                                height: 120,
                                background: res.thumbnailUrl
                                    ? `url(${res.thumbnailUrl.startsWith('/') ? API_BASE : ''}${res.thumbnailUrl}) center/cover`
                                    : 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(0,212,170,0.2))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                            }}>
                                {!res.thumbnailUrl && <FileText size={32} style={{ opacity: 0.3 }} />}
                                <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
                                    {res.featured && <span className="badge badge-yellow">Featured</span>}
                                    <span className={`badge ${res.status === 'published' ? 'badge-active' : 'badge-draft'}`}>
                                        {res.status || 'draft'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ padding: '14px 18px' }}>
                                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{res.title}</div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
                                    {res.difficulty && (
                                        <span className="badge" style={{ background: `${getDifficultyColor(res.difficulty)}15`, color: getDifficultyColor(res.difficulty) }}>
                                            {res.difficulty}
                                        </span>
                                    )}
                                    {res.category && <span className="badge badge-purple">{res.category}</span>}
                                    {res.type && <span className="badge badge-blue">{res.type}</span>}
                                </div>
                                <div className="prose prose-sm prose-invert" style={{
                                    color: 'var(--muted-foreground)', fontSize: 13, lineHeight: 1.4,
                                    overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', marginBottom: 12
                                }}>
                                    {res.description ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{res.description}</ReactMarkdown> : <p>No description</p>}
                                </div>

                                <div style={{ display: 'flex', gap: 8, marginBottom: 12, fontSize: 12, color: 'var(--muted-foreground)' }}>
                                    {res.downloadUrl && (
                                        <a href={`${res.downloadUrl.startsWith('/') ? API_BASE : ''}${res.downloadUrl}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#60a5fa' }}>
                                            <Download size={14} /> File
                                        </a>
                                    )}
                                    {res.externalUrl && (
                                        <a href={res.externalUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#60a5fa' }}>
                                            <LinkIcon size={14} /> Link
                                        </a>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn-secondary" style={{ flex: 1, padding: '6px 10px', fontSize: 13 }} onClick={() => openEdit(res)}>
                                        <Edit3 size={13} /> Edit
                                    </button>
                                    <button className="btn-danger" style={{ padding: '6px 10px', fontSize: 13 }} onClick={() => handleDelete(res._id)}>
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {resources.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center', color: 'var(--muted-foreground)' }} className="glass-card">
                            <FileText size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                            <p>No resources yet. Create your first resource!</p>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ zIndex: 100 }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800, maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{editId ? 'Edit Resource' : 'New Resource'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>Title *</label>
                                <input className="form-input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Master React Hooks" required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>Category *</label>
                                    <input className="form-input" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="e.g. Programming" required />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>Type *</label>
                                    <input className="form-input" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} placeholder="e.g. Video Series" required />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: 12 }} data-color-mode="dark">
                            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>Description *</label>
                            <MDEditor value={form.description} onChange={(val) => setForm((p) => ({ ...p, description: val || '' }))} preview="edit" height={200} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>Difficulty</label>
                                <select className="form-input form-select" value={form.difficulty} onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))}>
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                    <option value="Expert">Expert</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>Duration</label>
                                <input className="form-input" value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} placeholder="e.g. 10 weeks" />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>Study Time</label>
                                <input className="form-input" value={form.studyTime} onChange={(e) => setForm((p) => ({ ...p, studyTime: e.target.value }))} placeholder="e.g. 4 hrs/week" />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>Initial Rating</label>
                                <input type="number" step="0.1" className="form-input" value={form.rating} onChange={(e) => setForm((p) => ({ ...p, rating: parseFloat(e.target.value) || 0 }))} placeholder="e.g. 4.8" />
                            </div>
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>Tags (comma separated)</label>
                            <input className="form-input" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} placeholder="e.g. React, JavaScript, Frontend" />
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>External URL</label>
                            <input className="form-input" value={form.externalUrl} onChange={(e) => setForm((p) => ({ ...p, externalUrl: e.target.value }))} placeholder="e.g. https://github.com/..." />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>Thumbnail Image</label>
                                <input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] || null)} className="form-input" />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>Downloadable File (PDF, etc.)</label>
                                <input type="file" onChange={(e) => setResourceFile(e.target.files?.[0] || null)} className="form-input" />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                                <input type="checkbox" checked={form.featured} onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))} style={{ width: 16, height: 16 }} />
                                Featured Resource
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                                <span>Status:</span>
                                <select className="form-input form-select" style={{ padding: '4px 10px' }} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleSave} disabled={saving || !form.title || !form.description || !form.category || !form.type}>
                                <Save size={16} /> {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
