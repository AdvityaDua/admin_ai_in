'use client';
import React, { useEffect, useState } from 'react';
import {
    Tag, Plus, Edit3, Trash2, ToggleLeft, ToggleRight,
    RefreshCw, X, BarChart2, Users, DollarSign, Copy, CheckCheck, Eye,
    Percent, Hash, Calendar, AlertTriangle, Zap, TrendingUp, Gift,
    ShieldCheck, Clock, ChevronRight, Sparkles
} from 'lucide-react';
import { discountsApi } from '../lib/api';

interface Coupon {
    _id: string;
    code: string;
    type: 'discount' | 'referral';
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    maxDiscountAmount?: number;
    minOrderAmount?: number;
    maxUses?: number;
    usedCount: number;
    isActive: boolean;
    expiresAt?: string;
    referrerId?: { _id: string; name: string; email: string };
    createdBy?: { name: string; email: string };
    description?: string;
}

interface CouponStats {
    coupon: Coupon;
    stats: { totalUses: number; totalDiscountGranted: number; totalRevenue: number; averageDiscount: number };
    usages: { userId: { name: string; email: string }; discountAmount: number; finalAmount: number; subscriptionName: string; usedAt: string }[];
}

interface Analytics {
    totalCoupons: number;
    activeCoupons: number;
    totalUsages: number;
    totalDiscountGranted: number;
    totalRevenue: number;
    topCoupons: { _id: string; uses: number; totalDiscount: number; coupon: Coupon }[];
}

interface FormState {
    code: string;
    type: 'discount' | 'referral';
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    maxDiscountAmount: string;
    minOrderAmount: string;
    maxUses: string;
    isActive: boolean;
    expiresAt: string;
    referrerId: string;
    referrerRewardAmount: number;
    description: string;
}

const emptyForm: FormState = {
    code: '',
    type: 'discount',
    discountType: 'percentage',
    discountValue: 10,
    maxDiscountAmount: '',
    minOrderAmount: '',
    maxUses: '',
    isActive: true,
    expiresAt: '',
    referrerId: '',
    referrerRewardAmount: 0,
    description: '',
};

const inputStyle: React.CSSProperties = {
    background: 'var(--input-bg)',
    borderColor: 'var(--card-border)',
    color: 'var(--text-primary)',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">{label}</label>
            {children}
        </div>
    );
}

export default function DiscountsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [statsModal, setStatsModal] = useState<CouponStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<'all' | 'discount' | 'referral'>('all');

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [couponsData, analyticsData] = await Promise.all([
                discountsApi.getAll(),
                discountsApi.getAnalytics(),
            ]);
            setCoupons(couponsData);
            setAnalytics(analyticsData);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const openCreate = () => { setForm({ ...emptyForm }); setEditId(null); setShowModal(true); };

    const openEdit = (c: Coupon) => {
        setForm({
            code: c.code, type: c.type, discountType: c.discountType,
            discountValue: c.discountValue,
            maxDiscountAmount: c.maxDiscountAmount ? String(c.maxDiscountAmount / 100) : '',
            minOrderAmount: c.minOrderAmount ? String(c.minOrderAmount / 100) : '',
            maxUses: c.maxUses != null ? String(c.maxUses) : '',
            isActive: c.isActive,
            expiresAt: c.expiresAt ? c.expiresAt.substring(0, 10) : '',
            referrerId: (c.referrerId as any)?._id || '',
            referrerRewardAmount: 0,
            description: c.description || '',
        });
        setEditId(c._id);
        setShowModal(true);
    };

    const openStats = async (id: string) => {
        setLoadingStats(true);
        setStatsModal(null);
        try { const data = await discountsApi.getStats(id); setStatsModal(data); }
        catch (e) { console.error(e); }
        finally { setLoadingStats(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload: any = {
                code: form.code.toUpperCase(), type: form.type,
                discountType: form.discountType, discountValue: Number(form.discountValue),
                isActive: form.isActive, description: form.description || undefined,
            };
            if (form.maxDiscountAmount) payload.maxDiscountAmount = Math.round(Number(form.maxDiscountAmount) * 100);
            if (form.minOrderAmount) payload.minOrderAmount = Math.round(Number(form.minOrderAmount) * 100);
            if (form.maxUses) payload.maxUses = Number(form.maxUses);
            if (form.expiresAt) payload.expiresAt = form.expiresAt;
            if (form.referrerId) payload.referrerId = form.referrerId;
            if (form.referrerRewardAmount) payload.referrerRewardAmount = form.referrerRewardAmount;
            editId ? await discountsApi.update(editId, payload) : await discountsApi.create(payload);
            setShowModal(false);
            await fetchAll();
        } catch (e: any) { alert(e.message || 'Failed to save coupon'); }
        finally { setSaving(false); }
    };

    const handleToggle = async (id: string) => {
        try { await discountsApi.toggle(id); await fetchAll(); } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this coupon? This cannot be undone.')) return;
        try { await discountsApi.delete(id); await fetchAll(); } catch (e: any) { alert(e.message); }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const filtered = coupons.filter(c => typeFilter === 'all' || c.type === typeFilter);
    const fmtMoney = (p: number) => `₹${(p / 100).toLocaleString('en-IN')}`;

    const isExpired = (c: Coupon) => !!c.expiresAt && new Date(c.expiresAt) < new Date();
    const usagePct = (c: Coupon) => c.maxUses ? Math.min(100, Math.round((c.usedCount / c.maxUses) * 100)) : 0;

    return (
        <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
            {/* Hero Header */}
            <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)' }}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="relative px-8 py-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                                    <Tag size={20} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-white tracking-tight">Discounts & Referrals</h1>
                                    <p className="text-purple-200 text-xs font-medium mt-0.5">Manage promo codes, referral links & usage analytics</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchAll}
                                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur"
                            >
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            </button>
                            <button
                                onClick={openCreate}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-purple-700 text-sm font-black hover:bg-purple-50 transition-all shadow-lg shadow-purple-900/30"
                            >
                                <Plus size={16} /> New Coupon
                            </button>
                        </div>
                    </div>

                    {/* Inline Analytics */}
                    {analytics && (
                        <div className="grid grid-cols-5 gap-3 mt-7">
                            {[
                                { label: 'Total Coupons', value: analytics.totalCoupons, icon: <Tag size={15} />, sub: `${analytics.activeCoupons} active` },
                                { label: 'Total Uses', value: analytics.totalUsages, icon: <Users size={15} />, sub: 'across all codes' },
                                { label: 'Discount Given', value: fmtMoney(analytics.totalDiscountGranted), icon: <DollarSign size={15} />, sub: 'total savings granted' },
                                { label: 'Revenue', value: fmtMoney(analytics.totalRevenue), icon: <TrendingUp size={15} />, sub: 'paid with coupons' },
                                { label: 'Active Codes', value: analytics.activeCoupons, icon: <Zap size={15} />, sub: `of ${analytics.totalCoupons} total` },
                            ].map(s => (
                                <div key={s.label} className="rounded-2xl bg-white/10 backdrop-blur border border-white/20 px-4 py-3">
                                    <div className="flex items-center gap-1.5 text-purple-200 mb-1">
                                        {s.icon}
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{s.label}</span>
                                    </div>
                                    <p className="text-white text-xl font-black">{s.value}</p>
                                    <p className="text-purple-300 text-[10px] mt-0.5">{s.sub}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="px-8 py-7 space-y-6">
                {/* Filter Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 p-1 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                        {([
                            { key: 'all', label: 'All Codes', icon: <Tag size={13} /> },
                            { key: 'discount', label: 'Promo Codes', icon: <Percent size={13} /> },
                            { key: 'referral', label: 'Referrals', icon: <Gift size={13} /> },
                        ] as const).map(t => (
                            <button
                                key={t.key}
                                onClick={() => setTypeFilter(t.key)}
                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${typeFilter === t.key
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                                    }`}
                            >
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 font-medium">{filtered.length} coupon{filtered.length !== 1 ? 's' : ''}</p>
                </div>

                {/* Coupon Cards Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-44 rounded-2xl border animate-pulse" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }} />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed" style={{ borderColor: 'var(--card-border)' }}>
                        <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                            <Tag size={28} className="text-purple-500" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 font-bold text-lg">No coupons yet</p>
                        <p className="text-gray-400 text-sm mt-1 mb-5">Create your first discount or referral code</p>
                        <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: 'var(--accent-primary)' }}>
                            <Plus size={15} /> Create Coupon
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filtered.map(c => {
                            const expired = isExpired(c);
                            const pct = usagePct(c);
                            const isReferral = c.type === 'referral';

                            return (
                                <div
                                    key={c._id}
                                    className={`rounded-2xl border overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 ${!c.isActive || expired ? 'opacity-60' : ''}`}
                                    style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                                >
                                    {/* Card Top Strip */}
                                    <div className={`h-1.5 w-full ${isReferral ? 'bg-gradient-to-r from-blue-400 to-cyan-400' : 'bg-gradient-to-r from-purple-500 to-indigo-500'}`} />

                                    <div className="p-5">
                                        {/* Code + badges row */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`font-mono text-lg font-black tracking-widest ${isReferral ? 'text-blue-500' : 'text-purple-600 dark:text-purple-400'}`}>
                                                        {c.code}
                                                    </span>
                                                    <button
                                                        onClick={() => copyCode(c.code)}
                                                        className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                    >
                                                        {copiedCode === c.code
                                                            ? <CheckCheck size={13} className="text-green-500" />
                                                            : <Copy size={13} className="text-gray-400" />}
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${isReferral ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'}`}>
                                                        {isReferral ? <Gift size={9} /> : <Sparkles size={9} />}
                                                        {c.type}
                                                    </span>
                                                    {!c.isActive && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 uppercase">Paused</span>
                                                    )}
                                                    {expired && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-500 uppercase"><AlertTriangle size={9} /> Expired</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Big discount badge */}
                                            <div className={`text-center px-3 py-2 rounded-xl ${isReferral ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-purple-50 dark:bg-purple-900/20'}`}>
                                                <p className={`text-2xl font-black leading-none ${isReferral ? 'text-blue-600' : 'text-purple-600 dark:text-purple-400'}`}>
                                                    {c.discountType === 'percentage' ? `${c.discountValue}%` : fmtMoney(c.discountValue)}
                                                </p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">
                                                    {c.discountType === 'percentage' ? 'off' : 'flat'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        {c.description && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">{c.description}</p>
                                        )}
                                        {c.referrerId && (
                                            <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-500">
                                                <Users size={11} />
                                                <span>Referral by <span className="font-semibold text-gray-700 dark:text-gray-300">{c.referrerId.name}</span></span>
                                            </div>
                                        )}

                                        {/* Usage bar */}
                                        {c.maxUses ? (
                                            <div className="mb-3">
                                                <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 mb-1">
                                                    <span>USAGE</span>
                                                    <span>{c.usedCount} / {c.maxUses}</span>
                                                </div>
                                                <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-green-500'}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-400">
                                                <Hash size={11} />
                                                <span>{c.usedCount} uses · unlimited</span>
                                            </div>
                                        )}

                                        {/* Meta row */}
                                        <div className="flex items-center gap-3 text-[10px] text-gray-400 mb-4">
                                            {c.minOrderAmount && (
                                                <span className="flex items-center gap-1"><ShieldCheck size={10} /> Min {fmtMoney(c.minOrderAmount)}</span>
                                            )}
                                            {c.maxDiscountAmount && (
                                                <span className="flex items-center gap-1"><Tag size={10} /> Cap {fmtMoney(c.maxDiscountAmount)}</span>
                                            )}
                                            {c.expiresAt && (
                                                <span className={`flex items-center gap-1 ${expired ? 'text-red-400' : ''}`}>
                                                    <Clock size={10} /> {new Date(c.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                </span>
                                            )}
                                        </div>

                                        {/* Action row */}
                                        <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'var(--card-border)' }}>
                                            <button
                                                onClick={() => handleToggle(c._id)}
                                                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${c.isActive ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}
                                            >
                                                {c.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                                                {c.isActive ? 'Active' : 'Paused'}
                                            </button>
                                            <div className="flex items-center gap-1 ml-auto">
                                                <button onClick={() => openStats(c._id)} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors" title="View Stats">
                                                    <BarChart2 size={14} />
                                                </button>
                                                <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500 transition-colors" title="Edit">
                                                    <Edit3 size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(c._id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors" title="Delete">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ───── Create / Edit Modal ───── */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden" style={{ background: 'var(--card-bg)' }}>
                        {/* Modal Header */}
                        <div className="px-7 py-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--card-border)', background: 'linear-gradient(135deg, #7c3aed11, #4f46e508)' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center">
                                    <Tag size={16} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>{editId ? 'Edit Coupon' : 'Create New Coupon'}</h2>
                                    <p className="text-xs text-gray-400">{editId ? 'Update coupon settings' : 'Set up a new promo or referral code'}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400"><X size={18} /></button>
                        </div>

                        <div className="px-7 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
                            {/* Code + Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Coupon Code *">
                                    <input
                                        className="w-full border rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                        style={inputStyle}
                                        value={form.code}
                                        onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                        placeholder="SAVE20"
                                        disabled={!!editId}
                                    />
                                </Field>
                                <Field label="Type">
                                    <select
                                        className="w-full border rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                        style={inputStyle}
                                        value={form.type}
                                        onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                                    >
                                        <option value="discount">🏷️ Promo Discount</option>
                                        <option value="referral">🎁 Referral Code</option>
                                    </select>
                                </Field>
                            </div>

                            {/* Discount Type + Value */}
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Discount Type">
                                    <select
                                        className="w-full border rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                        style={inputStyle}
                                        value={form.discountType}
                                        onChange={e => setForm(f => ({ ...f, discountType: e.target.value as any }))}
                                    >
                                        <option value="percentage">% Percentage</option>
                                        <option value="fixed">₹ Fixed Amount</option>
                                    </select>
                                </Field>
                                <Field label={form.discountType === 'percentage' ? 'Value (%)' : 'Value (₹)'}>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                                            {form.discountType === 'percentage' ? '%' : '₹'}
                                        </span>
                                        <input
                                            type="number"
                                            className="w-full border rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                            style={inputStyle}
                                            value={form.discountValue}
                                            onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))}
                                            min={1} max={form.discountType === 'percentage' ? 100 : undefined}
                                        />
                                    </div>
                                </Field>
                            </div>

                            {/* Limits */}
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Max Discount Cap (₹)">
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                                        <input type="number" className="w-full border rounded-xl pl-8 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                            style={inputStyle} value={form.maxDiscountAmount}
                                            onChange={e => setForm(f => ({ ...f, maxDiscountAmount: e.target.value }))} placeholder="Optional" />
                                    </div>
                                </Field>
                                <Field label="Minimum Order (₹)">
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                                        <input type="number" className="w-full border rounded-xl pl-8 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                            style={inputStyle} value={form.minOrderAmount}
                                            onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} placeholder="Optional" />
                                    </div>
                                </Field>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Max Uses">
                                    <input type="number" className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                        style={inputStyle} value={form.maxUses}
                                        onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} placeholder="Unlimited" />
                                </Field>
                                <Field label="Expires At">
                                    <input type="date" className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                        style={inputStyle} value={form.expiresAt}
                                        onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
                                </Field>
                            </div>

                            {form.type === 'referral' && (
                                <Field label="Referrer User ID">
                                    <input className="w-full border rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                        style={inputStyle} value={form.referrerId}
                                        onChange={e => setForm(f => ({ ...f, referrerId: e.target.value }))} placeholder="MongoDB User ObjectId" />
                                </Field>
                            )}

                            <Field label="Description">
                                <input className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                    style={inputStyle} value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Internal note for this coupon…" />
                            </Field>

                            {/* Active toggle */}
                            <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ borderColor: 'var(--card-border)', background: 'var(--input-bg)' }}>
                                <div>
                                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Active Status</p>
                                    <p className="text-xs text-gray-400">Coupon can be used by customers immediately</p>
                                </div>
                                <button
                                    onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${form.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                >
                                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.isActive ? 'left-6' : 'left-0.5'}`} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-7 py-5 border-t flex gap-3" style={{ borderColor: 'var(--card-border)' }}>
                            <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-bold transition-colors hover:bg-gray-50 dark:hover:bg-gray-700" style={{ borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}>
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !form.code || !form.discountValue}
                                className="flex-1 py-2.5 rounded-xl text-white text-sm font-black disabled:opacity-40 transition-all hover:opacity-90 flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                            >
                                {saving ? <><RefreshCw size={14} className="animate-spin" /> Saving…</> : <>{editId ? 'Update Coupon' : 'Create Coupon'} <ChevronRight size={14} /></>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ───── Stats Modal ───── */}
            {(loadingStats || statsModal) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden" style={{ background: 'var(--card-bg)' }}>
                        <div className="px-7 py-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--card-border)', background: 'linear-gradient(135deg, #4f46e511, #2563eb08)' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                                    <BarChart2 size={16} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>Coupon Analytics</h2>
                                    <p className="text-xs text-gray-400">Detailed usage breakdown</p>
                                </div>
                            </div>
                            <button onClick={() => setStatsModal(null)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><X size={18} /></button>
                        </div>

                        <div className="p-7 max-h-[75vh] overflow-y-auto">
                            {loadingStats && !statsModal ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3">
                                    <RefreshCw size={28} className="animate-spin text-blue-400" />
                                    <p className="text-sm text-gray-400 font-medium">Loading stats…</p>
                                </div>
                            ) : statsModal ? (
                                <div className="space-y-6">
                                    {/* Coupon Identity */}
                                    <div className="flex items-center gap-4 p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, #7c3aed15, #4f46e508)', border: '1px solid #7c3aed30' }}>
                                        <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center shrink-0">
                                            <Tag size={24} className="text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-mono text-2xl font-black text-purple-600 dark:text-purple-400 tracking-widest">{statsModal.coupon.code}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{statsModal.coupon.description || 'No description'}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-3xl font-black ${statsModal.coupon.discountType === 'percentage' ? 'text-purple-600' : 'text-indigo-600'}`}>
                                                {statsModal.coupon.discountType === 'percentage' ? `${statsModal.coupon.discountValue}%` : fmtMoney(statsModal.coupon.discountValue)}
                                            </span>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">{statsModal.coupon.discountType} off</p>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-4 gap-3">
                                        {[
                                            { label: 'Total Uses', value: statsModal.stats.totalUses, icon: <Users size={16} />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                                            { label: 'Discount Given', value: fmtMoney(statsModal.stats.totalDiscountGranted), icon: <DollarSign size={16} />, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
                                            { label: 'Revenue', value: fmtMoney(statsModal.stats.totalRevenue), icon: <TrendingUp size={16} />, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                                            { label: 'Avg Discount', value: fmtMoney(statsModal.stats.averageDiscount), icon: <BarChart2 size={16} />, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                                        ].map(s => (
                                            <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
                                                <div className={`${s.color} flex justify-center mb-2`}>{s.icon}</div>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">{s.label}</p>
                                                <p className={`text-xl font-black mt-0.5 ${s.color}`}>{s.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Usage List */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Users Who Redeemed</h3>
                                            <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{statsModal.usages.length} total</span>
                                        </div>
                                        {statsModal.usages.length === 0 ? (
                                            <div className="flex flex-col items-center py-10 text-gray-400">
                                                <Eye size={28} className="mb-2 opacity-40" />
                                                <p className="text-sm font-medium">No redemptions yet</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                                {statsModal.usages.map((u, i) => (
                                                    <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl border transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40" style={{ borderColor: 'var(--card-border)' }}>
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-xs font-black shrink-0">
                                                            {(u.userId?.name || '?')[0].toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{u.userId?.name || 'Unknown User'}</p>
                                                            <p className="text-xs text-gray-400 truncate">{u.userId?.email}</p>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className="text-sm font-black text-red-500">-{fmtMoney(u.discountAmount)}</p>
                                                            <p className="text-[10px] text-gray-400">paid {fmtMoney(u.finalAmount)}</p>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className="text-[10px] text-gray-400">{new Date(u.usedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
