'use client';
import React, { useEffect, useState } from 'react';
import {
    CreditCard,
    Plus,
    Edit3,
    Trash2,
    ToggleLeft,
    ToggleRight,
    X,
    DollarSign,
    Tag,
    Sparkles,
    RefreshCw,
    Save,
    ChevronDown,
} from 'lucide-react';
import { subscriptionsApi } from '../lib/api';

interface Subscription {
    _id: string;
    name: string;
    displayName: string;
    description: string;
    price: number;
    currency: string;
    type: string;
    duration: number;
    status: string;
    order: number;
    popularBadge: boolean;
    discountPercentage: number;
    originalPrice: number;
    colorScheme: string;
    country: string;
    features: { name: string; description: string; type: string; value: any; enabled: boolean; limit?: number; unit?: string }[];
    tags: string[];
    razorpayPlanId?: string;
}

const emptyForm: Partial<Subscription> = {
    name: '',
    displayName: '',
    description: '',
    price: 0,
    currency: 'INR',
    type: 'monthly',
    duration: 30,
    status: 'draft',
    order: 0,
    popularBadge: false,
    discountPercentage: 0,
    originalPrice: 0,
    colorScheme: '#6c63ff',
    country: 'IN',
    features: [],
    tags: [],
};

export default function SubscriptionsPage() {
    const [subscriptions, setSubs] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<Subscription>>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [featureForm, setFeatureForm] = useState({ name: '', description: '', type: 'boolean', value: true, enabled: true, limit: 0, unit: '' });
    const [tagInput, setTagInput] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await subscriptionsApi.getAll();
            setSubs(data);
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
        setForm({ ...emptyForm, features: [], tags: [] });
        setShowModal(true);
    };

    const openEdit = (sub: Subscription) => {
        setEditId(sub._id);
        setForm({
            name: sub.name,
            displayName: sub.displayName,
            description: sub.description,
            price: sub.price,
            currency: sub.currency,
            type: sub.type,
            duration: sub.duration,
            status: sub.status,
            order: sub.order,
            popularBadge: sub.popularBadge,
            discountPercentage: sub.discountPercentage,
            originalPrice: sub.originalPrice,
            colorScheme: sub.colorScheme,
            country: sub.country,
            features: [...(sub.features || [])],
            tags: [...(sub.tags || [])],
            razorpayPlanId: sub.razorpayPlanId,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editId) {
                await subscriptionsApi.update(editId, form);
            } else {
                await subscriptionsApi.create(form);
            }
            setShowModal(false);
            fetchData();
        } catch (e: any) {
            alert(e.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (sub: Subscription) => {
        try {
            if (sub.status === 'active') {
                await subscriptionsApi.deactivate(sub._id);
            } else {
                await subscriptionsApi.activate(sub._id);
            }
            fetchData();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This cannot be undone.')) return;
        try {
            await subscriptionsApi.delete(id);
            fetchData();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const addFeature = () => {
        if (!featureForm.name.trim()) return;
        setForm((p) => ({
            ...p,
            features: [
                ...(p.features || []),
                { ...featureForm, value: featureForm.type === 'boolean' ? true : featureForm.value },
            ],
        }));
        setFeatureForm({ name: '', description: '', type: 'boolean', value: true, enabled: true, limit: 0, unit: '' });
    };

    const removeFeature = (i: number) => {
        setForm((p) => ({
            ...p,
            features: (p.features || []).filter((_, idx) => idx !== i),
        }));
    };

    const addTag = () => {
        if (!tagInput.trim()) return;
        setForm((p) => ({ ...p, tags: [...(p.tags || []), tagInput.trim()] }));
        setTagInput('');
    };

    const removeTag = (i: number) => {
        setForm((p) => ({ ...p, tags: (p.tags || []).filter((_, idx) => idx !== i) }));
    };

    const formatPrice = (priceInPaisa: number, currency: string) => {
        const amount = priceInPaisa / 100;
        return currency === 'INR' ? `₹${amount.toLocaleString()}` : `$${amount.toLocaleString()}`;
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
                        <CreditCard
                            size={28}
                            style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle', color: '#6c63ff' }}
                        />
                        Subscriptions
                    </h1>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: 14, marginTop: 4 }}>
                        Manage pricing plans, features, and billing
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn-secondary" onClick={fetchData}>
                        <RefreshCw size={16} /> Refresh
                    </button>
                    <button className="btn-primary" onClick={openCreate}>
                        <Plus size={16} /> Create Plan
                    </button>
                </div>
            </div>

            {/* Subscription Cards */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 300 }} />
                    ))}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                    {subscriptions.map((sub, idx) => (
                        <div
                            key={sub._id || `sub-${idx}`}
                            className="glass-card animate-fadeIn"
                            style={{
                                padding: 0,
                                overflow: 'hidden',
                                animationDelay: `${idx * 80}ms`,
                                position: 'relative',
                            }}
                        >
                            {/* Top accent bar */}
                            <div
                                style={{
                                    height: 4,
                                    background: sub.colorScheme
                                        ? `linear-gradient(90deg, ${sub.colorScheme}, ${sub.colorScheme}88)`
                                        : 'linear-gradient(90deg, #6c63ff, #a78bfa)',
                                }}
                            />

                            {/* Badges */}
                            <div style={{ display: 'flex', gap: 6, padding: '12px 20px 0', flexWrap: 'wrap' }}>
                                <span
                                    key="status"
                                    className={`badge ${sub.status === 'active' ? 'badge-active' : sub.status === 'draft' ? 'badge-draft' : 'badge-inactive'
                                        }`}
                                >
                                    {sub.status}
                                </span>
                                {sub.popularBadge && <span key="popular" className="badge badge-purple">⭐ Popular</span>}
                                {(sub.tags || []).map((t, i) => (
                                    <span key={`tag-${i}`} className="badge" style={{ background: 'rgba(108,99,255,0.08)', color: '#a78bfa' }}>
                                        {t}
                                    </span>
                                ))}
                            </div>

                            {/* Content */}
                            <div style={{ padding: '12px 20px 20px' }}>
                                <div style={{ fontSize: 18, fontWeight: 700 }}>{sub.displayName}</div>
                                <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>
                                    {sub.name} · {sub.country} · {sub.type}
                                </div>

                                {/* Price */}
                                <div
                                    style={{
                                        marginTop: 16,
                                        display: 'flex',
                                        alignItems: 'baseline',
                                        gap: 6,
                                    }}
                                >
                                    <span style={{ fontSize: 32, fontWeight: 800 }}>{formatPrice(sub.price, sub.currency)}</span>
                                    <span style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>
                                        / {sub.type === 'monthly' ? 'mo' : sub.type === 'yearly' ? 'yr' : sub.type}
                                    </span>
                                    {sub.discountPercentage > 0 && (
                                        <span
                                            style={{
                                                background: 'rgba(0,200,83,0.12)',
                                                color: '#4ade80',
                                                padding: '2px 8px',
                                                borderRadius: 12,
                                                fontSize: 11,
                                                fontWeight: 700,
                                            }}
                                        >
                                            -{sub.discountPercentage}%
                                        </span>
                                    )}
                                </div>
                                {sub.originalPrice > 0 && sub.originalPrice !== sub.price && (
                                    <div
                                        style={{
                                            textDecoration: 'line-through',
                                            color: 'var(--muted-foreground)',
                                            fontSize: 13,
                                            marginTop: 2,
                                        }}
                                    >
                                        {formatPrice(sub.originalPrice, sub.currency)}
                                    </div>
                                )}

                                <p style={{ color: 'var(--muted-foreground)', fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>
                                    {sub.description || 'No description'}
                                </p>

                                {/* Features */}
                                {(sub.features || []).length > 0 && (
                                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {sub.features.slice(0, 4).map((f, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    fontSize: 13,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: '50%',
                                                        background: f.enabled ? '#4ade80' : '#94a3b8',
                                                    }}
                                                />
                                                <span>{f.name}</span>
                                                {f.limit && (
                                                    <span style={{ color: 'var(--muted-foreground)' }}>
                                                        ({f.limit} {f.unit})
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                        {sub.features.length > 4 && (
                                            <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                                                +{sub.features.length - 4} more
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                    <button className="btn-secondary" style={{ flex: 1, padding: '8px' }} onClick={() => openEdit(sub)}>
                                        <Edit3 size={14} /> Edit
                                    </button>
                                    <button
                                        className={sub.status === 'active' ? 'btn-danger' : 'btn-success'}
                                        style={{ padding: '8px 12px' }}
                                        onClick={() => handleToggle(sub)}
                                    >
                                        {sub.status === 'active' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                    </button>
                                    <button className="btn-danger" style={{ padding: '8px 12px' }} onClick={() => handleDelete(sub._id)}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {subscriptions.length === 0 && (
                        <div
                            style={{
                                gridColumn: '1 / -1',
                                padding: 60,
                                textAlign: 'center',
                                color: 'var(--muted-foreground)',
                            }}
                            className="glass-card"
                        >
                            <CreditCard size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                            <p>No subscription plans yet. Create your first plan!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700 }}>
                                {editId ? 'Edit Subscription' : 'Create Subscription'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--muted-foreground)',
                                    cursor: 'pointer',
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>
                                    Internal Name
                                </label>
                                <input
                                    className="form-input"
                                    value={form.name || ''}
                                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                    placeholder="e.g. career_starter_in"
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>
                                    Display Name
                                </label>
                                <input
                                    className="form-input"
                                    value={form.displayName || ''}
                                    onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                                    placeholder="e.g. Career Starter"
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>
                                Description
                            </label>
                            <textarea
                                className="form-input"
                                value={form.description || ''}
                                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                placeholder="Plan description..."
                                style={{ minHeight: 60 }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>
                                    Price (Paisa)
                                </label>
                                <input
                                    className="form-input"
                                    type="number"
                                    value={form.price || 0}
                                    onChange={(e) => setForm((p) => ({ ...p, price: +e.target.value }))}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>
                                    Currency
                                </label>
                                <select
                                    className="form-input form-select"
                                    value={form.currency || 'INR'}
                                    onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                                >
                                    <option value="INR">INR</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>
                                    Type
                                </label>
                                <select
                                    className="form-input form-select"
                                    value={form.type || 'monthly'}
                                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                    <option value="lifetime">Lifetime</option>
                                    <option value="trial">Trial</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>
                                    Duration (days)
                                </label>
                                <input
                                    className="form-input"
                                    type="number"
                                    value={form.duration || 0}
                                    onChange={(e) => setForm((p) => ({ ...p, duration: +e.target.value }))}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>
                                    Country
                                </label>
                                <input
                                    className="form-input"
                                    value={form.country || ''}
                                    onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                                    placeholder="IN"
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>
                                    Order
                                </label>
                                <input
                                    className="form-input"
                                    type="number"
                                    value={form.order || 0}
                                    onChange={(e) => setForm((p) => ({ ...p, order: +e.target.value }))}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>
                                    Discount %
                                </label>
                                <input
                                    className="form-input"
                                    type="number"
                                    value={form.discountPercentage || 0}
                                    onChange={(e) => setForm((p) => ({ ...p, discountPercentage: +e.target.value }))}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>
                                    Original Price (Paisa)
                                </label>
                                <input
                                    className="form-input"
                                    type="number"
                                    value={form.originalPrice || 0}
                                    onChange={(e) => setForm((p) => ({ ...p, originalPrice: +e.target.value }))}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>
                                    Razorpay Plan ID
                                </label>
                                <input
                                    className="form-input"
                                    value={form.razorpayPlanId || ''}
                                    onChange={(e) => setForm((p) => ({ ...p, razorpayPlanId: e.target.value }))}
                                    placeholder="plan_xxxxx"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                                <input
                                    type="checkbox"
                                    checked={form.popularBadge || false}
                                    onChange={(e) => setForm((p) => ({ ...p, popularBadge: e.target.checked }))}
                                    style={{ accentColor: '#6c63ff', width: 16, height: 16 }}
                                />
                                Mark as Popular
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)' }}>Color:</label>
                                <input
                                    type="color"
                                    value={form.colorScheme || '#6c63ff'}
                                    onChange={(e) => setForm((p) => ({ ...p, colorScheme: e.target.value }))}
                                    style={{ width: 30, height: 30, border: 'none', background: 'transparent', cursor: 'pointer' }}
                                />
                            </div>
                        </div>

                        {/* Tags */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>
                                Tags
                            </label>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                                {(form.tags || []).map((t, i) => (
                                    <span
                                        key={i}
                                        className="badge badge-purple"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => removeTag(i)}
                                    >
                                        {t} <X size={10} />
                                    </span>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                    className="form-input"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    placeholder="Add a tag"
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                    style={{ flex: 1 }}
                                />
                                <button className="btn-secondary" onClick={addTag} style={{ padding: '8px 14px' }}>
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Features */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>
                                Features
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                                {(form.features || []).map((f, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '8px 12px',
                                            background: 'rgba(30,41,59,0.4)',
                                            borderRadius: 8,
                                            fontSize: 13,
                                        }}
                                    >
                                        <span>
                                            {f.name}
                                            {f.limit ? ` (${f.limit} ${f.unit || ''})` : ''}
                                        </span>
                                        <button
                                            onClick={() => removeFeature(i)}
                                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8 }}>
                                <input
                                    className="form-input"
                                    value={featureForm.name}
                                    onChange={(e) => setFeatureForm((p) => ({ ...p, name: e.target.value }))}
                                    placeholder="Feature name"
                                />
                                <input
                                    className="form-input"
                                    type="number"
                                    value={featureForm.limit}
                                    onChange={(e) => setFeatureForm((p) => ({ ...p, limit: +e.target.value }))}
                                    placeholder="Limit"
                                />
                                <input
                                    className="form-input"
                                    value={featureForm.unit}
                                    onChange={(e) => setFeatureForm((p) => ({ ...p, unit: e.target.value }))}
                                    placeholder="Unit"
                                />
                                <button className="btn-secondary" onClick={addFeature} style={{ padding: '8px 14px' }}>
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Save */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleSave} disabled={saving}>
                                <Save size={16} /> {saving ? 'Saving...' : editId ? 'Update Plan' : 'Create Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
