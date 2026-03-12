'use client';
import React, { useEffect, useState } from 'react';
import {
    Tag, Plus, Edit3, Trash2, ToggleLeft, ToggleRight,
    RefreshCw, X, BarChart2, Users, DollarSign, Copy, CheckCheck,
    Hash, AlertTriangle, Zap, TrendingUp, Gift,
    ShieldCheck, Clock, ChevronRight, Eye, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { discountsApi } from '../lib/api';

interface Coupon {
    _id: string; code: string; type: 'discount' | 'referral';
    discountType: 'percentage' | 'fixed'; discountValue: number;
    maxDiscountAmount?: number; minOrderAmount?: number; maxUses?: number;
    usedCount: number; isActive: boolean; expiresAt?: string;
    referrerId?: { _id: string; name: string; email: string };
    createdBy?: { name: string; email: string }; description?: string;
}
interface CouponStats {
    coupon: Coupon;
    stats: { totalUses: number; totalDiscountGranted: number; totalRevenue: number; averageDiscount: number };
    usages: { userId: { name: string; email: string }; discountAmount: number; finalAmount: number; subscriptionName: string; usedAt: string }[];
}
interface Analytics {
    totalCoupons: number; activeCoupons: number; totalUsages: number;
    totalDiscountGranted: number; totalRevenue: number;
    topCoupons: { _id: string; uses: number; totalDiscount: number; coupon: Coupon }[];
}
interface FormState {
    code: string; type: 'discount' | 'referral'; discountType: 'percentage' | 'fixed';
    discountValue: number; maxDiscountAmount: string; minOrderAmount: string;
    maxUses: string; isActive: boolean; expiresAt: string;
    referrerId: string; referrerRewardAmount: number; description: string;
}

const EMPTY: FormState = {
    code: '', type: 'discount', discountType: 'percentage', discountValue: 10,
    maxDiscountAmount: '', minOrderAmount: '', maxUses: '', isActive: true,
    expiresAt: '', referrerId: '', referrerRewardAmount: 0, description: '',
};

const fmt = (p: number) => `\u20b9${(p / 100).toLocaleString('en-IN')}`;
const expired = (c: Coupon) => !!c.expiresAt && new Date(c.expiresAt) < new Date();

const LBL = ({ t }: { t: string }) => (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted-foreground)', marginBottom: 6 }}>{t}</label>
);

export default function DiscountsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>({ ...EMPTY });
    const [saving, setSaving] = useState(false);
    const [statsModal, setStatsModal] = useState<CouponStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'discount' | 'referral'>('all');

    const load = async () => {
        setLoading(true);
        try {
            const [cd, ad] = await Promise.all([discountsApi.getAll(), discountsApi.getAnalytics()]);
            setCoupons(cd); setAnalytics(ad);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const openCreate = () => { setForm({ ...EMPTY }); setEditId(null); setShowModal(true); };
    const openEdit = (c: Coupon) => {
        setForm({
            code: c.code, type: c.type, discountType: c.discountType, discountValue: c.discountValue,
            maxDiscountAmount: c.maxDiscountAmount ? String(c.maxDiscountAmount / 100) : '',
            minOrderAmount: c.minOrderAmount ? String(c.minOrderAmount / 100) : '',
            maxUses: c.maxUses != null ? String(c.maxUses) : '', isActive: c.isActive,
            expiresAt: c.expiresAt ? c.expiresAt.substring(0, 10) : '',
            referrerId: (c.referrerId as any)?._id || '', referrerRewardAmount: 0, description: c.description || '',
        });
        setEditId(c._id); setShowModal(true);
    };
    const openStats = async (id: string) => {
        setLoadingStats(true); setStatsModal(null);
        try { setStatsModal(await discountsApi.getStats(id)); } catch (e) { console.error(e); } finally { setLoadingStats(false); }
    };
    const save = async () => {
        setSaving(true);
        try {
            const p: any = { code: form.code.toUpperCase(), type: form.type, discountType: form.discountType, discountValue: Number(form.discountValue), isActive: form.isActive };
            if (form.description) p.description = form.description;
            if (form.maxDiscountAmount) p.maxDiscountAmount = Math.round(Number(form.maxDiscountAmount) * 100);
            if (form.minOrderAmount) p.minOrderAmount = Math.round(Number(form.minOrderAmount) * 100);
            if (form.maxUses) p.maxUses = Number(form.maxUses);
            if (form.expiresAt) p.expiresAt = form.expiresAt;
            if (form.referrerId) p.referrerId = form.referrerId;
            editId ? await discountsApi.update(editId, p) : await discountsApi.create(p);
            setShowModal(false); await load();
        } catch (e: any) { alert(e.message || 'Failed'); } finally { setSaving(false); }
    };
    const toggle = async (id: string) => { try { await discountsApi.toggle(id); await load(); } catch (e) { console.error(e); } };
    const del = async (id: string) => {
        if (!confirm('Delete this coupon?')) return;
        try { await discountsApi.delete(id); await load(); } catch (e: any) { alert(e.message); }
    };
    const copy = (code: string) => { navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(null), 2000); };

    const list = coupons.filter(c => filter === 'all' || c.type === filter);

    return (
        <div style={{ padding: '28px 24px 32px', width: '100%', boxSizing: 'border-box' }}>

            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-6 animate-fadeIn">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                        <Tag size={22} color="white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white m-0 tracking-tight">Discounts & Referrals</h1>
                        <p className="text-xs text-muted-foreground mt-1">Manage promo codes, referral links & usage analytics</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="btn-secondary p-2.5 rounded-xl hover:bg-white/10 transition-colors" onClick={load}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="btn-primary px-5 py-2.5 rounded-xl font-bold flex items-center gap-2" onClick={openCreate}>
                        <Plus size={18} /> New Coupon
                    </button>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            {analytics && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
                    {([
                        { label: 'Total Coupons', value: analytics.totalCoupons, sub: `${analytics.activeCoupons} active`, color: 'purple', icon: <Tag size={18} /> },
                        { label: 'Total Uses', value: analytics.totalUsages, sub: 'across all codes', color: 'blue', icon: <Users size={18} /> },
                        { label: 'Discount Given', value: fmt(analytics.totalDiscountGranted), sub: 'total savings', color: 'rose', icon: <DollarSign size={18} /> },
                        { label: 'Revenue', value: fmt(analytics.totalRevenue), sub: 'paid with coupons', color: 'teal', icon: <TrendingUp size={18} /> },
                        { label: 'Active Codes', value: analytics.activeCoupons, sub: `of ${analytics.totalCoupons} total`, color: 'green', icon: <Zap size={18} /> },
                    ] as { label: string; value: string | number; sub: string; color: string; icon: React.ReactNode }[]).map(s => (
                        <div key={s.label} className={`glass-card stat-card ${s.color} p-5 flex flex-col gap-1`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{s.label}</span>
                                <span className="text-muted-foreground opacity-60">{s.icon}</span>
                            </div>
                            <div className="text-2xl font-black text-white">{s.value}</div>
                            <div className="text-[11px] font-bold text-muted-foreground mt-1">{s.sub}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Filter Tabs ── */}
            <div className="flex items-center justify-between mb-4 mt-8">
                <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                    {(['all', 'discount', 'referral'] as const).map(t => (
                        <button
                            key={t}
                            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${filter === t
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                            onClick={() => setFilter(t)}
                        >
                            {t === 'all' ? 'All Codes' : t === 'discount' ? 'Promo Codes' : 'Referrals'}
                        </button>
                    ))}
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-500 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                    {list.length} {list.length === 1 ? 'Entry' : 'Entries'}
                </span>
            </div>

            {/* ── Cards Grid ── */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-3xl bg-white/5 animate-pulse border border-white/5" />)}
                </div>
            ) : list.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white/[0.02] rounded-[2.5rem] border border-dashed border-white/10">
                    <div className="w-20 h-20 rounded-3xl bg-blue-600/10 flex items-center justify-center mb-6 border border-blue-500/20 shadow-2xl">
                        <Tag className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">Inventory Depleted</h3>
                    <p className="text-gray-500 font-bold mb-8">No active promotion or referral codes detected.</p>
                    <button
                        className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all active:scale-95 shadow-xl shadow-blue-500/20"
                        onClick={openCreate}
                    >
                        <Plus size={20} strokeWidth={3} />
                        Initialize Coupon
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn transition-all">
                    {list.map(c => {
                        const exp = expired(c);
                        const pct = c.maxUses ? Math.min(100, Math.round((c.usedCount / c.maxUses) * 100)) : 0;
                        const isRef = c.type === 'referral';
                        const accentColor = isRef ? 'text-emerald-500' : 'text-blue-500';
                        const accentBg = isRef ? 'bg-emerald-500/10' : 'bg-blue-500/10';
                        const accentBorder = isRef ? 'border-emerald-500/20' : 'border-blue-500/20';
                        const barColor = pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500';

                        return (
                            <div
                                key={c._id}
                                className={`group relative flex flex-col bg-white/[0.03] rounded-[2rem] border transition-all duration-300 hover:bg-white/[0.05] hover:border-white/20 hover:-translate-y-1 ${(!c.isActive || exp) ? 'border-white/5 opacity-60' : 'border-white/10'
                                    }`}
                            >
                                {/* card stripe */}
                                <div className={`h-1.5 w-full rounded-t-full ${isRef ? 'bg-emerald-500' : 'bg-blue-600'}`} />

                                <div className="p-6 md:p-8 flex flex-col h-full">
                                    {/* code + status */}
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className={`text-xl font-black tracking-[0.15em] uppercase truncate ${isRef ? 'text-emerald-400' : 'text-blue-400'}`}>
                                                    {c.code}
                                                </span>
                                                <button
                                                    onClick={() => copy(c.code)}
                                                    className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all active:scale-90 shrink-0"
                                                >
                                                    {copied === c.code ? <CheckCheck size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${accentColor} ${accentBg} ${accentBorder}`}>
                                                    {isRef ? <Gift size={10} /> : <Sparkles size={10} />}
                                                    {c.type}
                                                </div>
                                                {!c.isActive && (
                                                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                                        Suspended
                                                    </div>
                                                )}
                                                {exp && (
                                                    <div className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1">
                                                        <AlertTriangle size={10} /> Depleted
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className={`p-4 rounded-2xl flex flex-col items-center justify-center min-w-[70px] shadow-lg ${accentBg} border ${accentBorder}`}>
                                            <span className={`text-2xl font-black leading-none ${accentColor}`}>
                                                {c.discountType === 'percentage' ? `${c.discountValue}%` : fmt(c.discountValue)}
                                            </span>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 mt-1.5">
                                                {c.discountType === 'percentage' ? 'Reduction' : 'Flat Off'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* info */}
                                    <div className="flex-1">
                                        {c.description && (
                                            <p className="text-xs font-bold text-gray-400 leading-relaxed mb-4 line-clamp-2 h-8">
                                                {c.description}
                                            </p>
                                        )}
                                        {c.referrerId && (
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 mb-4 group/ref hover:border-white/10 transition-colors">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                                                    <Users size={14} className="text-emerald-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Oracle Account</p>
                                                    <p className="text-xs font-black text-white truncate truncate">{c.referrerId.name}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* usage metrics */}
                                        <div className="space-y-3 mb-6">
                                            {c.maxUses ? (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                        <span className="text-gray-500">Allocation</span>
                                                        <span className="text-white">{c.usedCount} <span className="text-gray-600">/</span> {c.maxUses}</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${pct}%` }}
                                                            className={`h-full rounded-full ${barColor} shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                                    <Hash size={14} className="text-gray-500" />
                                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                                        {c.usedCount} <span className="text-gray-600 font-bold ml-1">Executions &middot; Perpetual</span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* sub metrics */}
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-6 opacity-60">
                                            {c.minOrderAmount && (
                                                <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    <ShieldCheck size={12} className="text-blue-500" />
                                                    Min {fmt(c.minOrderAmount)}
                                                </div>
                                            )}
                                            {c.maxDiscountAmount && (
                                                <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    <Tag size={12} className="text-blue-500" />
                                                    Cap {fmt(c.maxDiscountAmount)}
                                                </div>
                                            )}
                                            {c.expiresAt && (
                                                <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${exp ? 'text-red-500' : 'text-gray-400'}`}>
                                                    <Clock size={12} />
                                                    {new Date(c.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* actions */}
                                    <div className="flex items-center justify-between pt-5 border-t border-white/5 mt-auto">
                                        <button
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${c.isActive
                                                ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                                                : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
                                                }`}
                                            onClick={() => toggle(c._id)}
                                        >
                                            {c.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                            {c.isActive ? 'Live' : 'Paused'}
                                        </button>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openStats(c._id)}
                                                className="p-2.5 rounded-xl bg-white/5 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 transition-all border border-transparent hover:border-blue-400/20 active:scale-90"
                                            >
                                                <BarChart2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => openEdit(c)}
                                                className="p-2.5 rounded-xl bg-white/5 text-gray-500 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all border border-transparent hover:border-emerald-400/20 active:scale-90"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                onClick={() => del(c._id)}
                                                className="p-2.5 rounded-xl bg-white/5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-400/20 active:scale-90"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ══ Create / Edit Modal ══ */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-[#030712] rounded-[2.5rem] shadow-[0_0_100px_rgba(37,99,235,0.1)] border border-white/5 overflow-hidden"
                        >
                            {/* header */}
                            <div className="px-8 py-8 border-b border-white/5 bg-white/[0.01]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                                            <Tag size={22} color="white" strokeWidth={3} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-white tracking-tight">{editId ? 'Modify Strategy' : 'Initialize Promotion'}</h2>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 italic">{editId ? 'Re-calibrating parameters' : 'New campaign deployment'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <LBL t="Reference Code *" />
                                        <input
                                            className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm font-black uppercase tracking-[0.2em] text-blue-400 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-700"
                                            value={form.code}
                                            onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                            placeholder="E.G. ALPHA20"
                                            disabled={!!editId}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <LBL t="Protocol Type" />
                                        <select
                                            className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm font-black text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                                            value={form.type}
                                            onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                                        >
                                            <option value="discount">Direct Promotion</option>
                                            <option value="referral">Referral Link</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <LBL t="Reduction Unit" />
                                        <select
                                            className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm font-black text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                                            value={form.discountType}
                                            onChange={e => setForm(f => ({ ...f, discountType: e.target.value as any }))}
                                        >
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Flat (₹)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <LBL t={form.discountType === 'percentage' ? 'Quantifier (%)' : 'Quantifier (₹)'} />
                                        <input
                                            type="number"
                                            className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm font-black text-white focus:outline-none focus:border-blue-500/50 transition-all"
                                            value={form.discountValue}
                                            onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <LBL t="Max Ceiling (₹)" />
                                        <input
                                            type="number"
                                            className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm font-black text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-700"
                                            value={form.maxDiscountAmount}
                                            onChange={e => setForm(f => ({ ...f, maxDiscountAmount: e.target.value }))}
                                            placeholder="None"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <LBL t="Min Threshold (₹)" />
                                        <input
                                            type="number"
                                            className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm font-black text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-700"
                                            value={form.minOrderAmount}
                                            onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                                            placeholder="None"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <LBL t="Execution Limit" />
                                        <input
                                            type="number"
                                            className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm font-black text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-700"
                                            value={form.maxUses}
                                            onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                                            placeholder="Infinite"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <LBL t="Expiration Date" />
                                        <input
                                            type="date"
                                            className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm font-black text-white focus:outline-none focus:border-blue-500/50 transition-all"
                                            value={form.expiresAt}
                                            onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                {form.type === 'referral' && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-2">
                                        <LBL t="Originating User ID" />
                                        <div className="relative">
                                            <Users size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
                                            <input
                                                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-12 pr-5 py-4 text-xs font-black text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-gray-700"
                                                value={form.referrerId}
                                                onChange={e => setForm(f => ({ ...f, referrerId: e.target.value }))}
                                                placeholder="MongoDB Object ID Reference"
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                <div className="space-y-2">
                                    <LBL t="Internal Memo" />
                                    <textarea
                                        className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-gray-400 focus:outline-none focus:border-blue-500/50 transition-all min-h-[100px] placeholder:text-gray-700"
                                        value={form.description}
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        placeholder="Reasoning for this allocation..."
                                    />
                                </div>

                                <div className="flex items-center justify-between p-6 rounded-[1.5rem] bg-white/[0.01] border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-3 h-3 rounded-full ${form.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-700'}`} />
                                        <div>
                                            <p className="text-sm font-black text-white">Live Status</p>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Allow immediate execution</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                                        className={`w-14 h-8 rounded-full transition-all relative ${form.isActive ? 'bg-emerald-500' : 'bg-white/10'}`}
                                    >
                                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-xl transition-all ${form.isActive ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 bg-white/[0.01] border-t border-white/5 flex gap-4">
                                <button
                                    className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/5"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="flex-[2] py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-3"
                                    onClick={save}
                                    disabled={saving || !form.code || !form.discountValue}
                                >
                                    {saving ? <><RefreshCw size={18} className="animate-spin" /> Syncing…</> : <>{editId ? 'Commit Changes' : 'Launch Protocol'} <ChevronRight size={18} /></>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ══ Stats Modal ══ */}
            <AnimatePresence>
                {(loadingStats || statsModal) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setStatsModal(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, x: 20 }}
                            animate={{ scale: 1, opacity: 1, x: 0 }}
                            exit={{ scale: 0.9, opacity: 0, x: 20 }}
                            className="relative w-full max-w-2xl bg-[#030712] rounded-[2.5rem] shadow-[0_0_100px_rgba(0,212,170,0.1)] border border-white/5 overflow-hidden"
                        >
                            {/* header */}
                            <div className="px-8 py-8 border-b border-white/5 bg-white/[0.01]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                            <BarChart2 size={22} color="white" strokeWidth={3} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-white tracking-tight">Performance Analytics</h2>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 italic">Metrics & conversion protocol</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setStatsModal(null)}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {loadingStats && !statsModal ? (
                                <div className="p-24 flex flex-col items-center gap-6">
                                    <RefreshCw size={40} className="animate-spin text-emerald-500" />
                                    <p className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">Aggregating Data…</p>
                                </div>
                            ) : statsModal ? (
                                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                    {/* code identity card */}
                                    <div className="flex items-center gap-6 p-6 rounded-[2rem] bg-white/[0.02] border border-white/5">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 ${statsModal.coupon.type === 'referral' ? 'bg-emerald-500/10' : 'bg-blue-500/10'}`}>
                                            {statsModal.coupon.type === 'referral' ? <Gift size={28} className="text-emerald-500" /> : <Tag size={28} className="text-blue-500" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-2xl font-black text-white tracking-[0.1em] uppercase">{statsModal.coupon.code}</h3>
                                                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-gray-500 uppercase tracking-widest">{statsModal.coupon.type}</span>
                                            </div>
                                            <p className="text-sm font-bold text-gray-500 mt-1 italic line-clamp-1">{statsModal.coupon.description || 'Global allocation code'}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-3xl font-black text-white leading-none">
                                                {statsModal.coupon.discountType === 'percentage' ? `${statsModal.coupon.discountValue}%` : fmt(statsModal.coupon.discountValue)}
                                            </p>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">{statsModal.coupon.discountType === 'percentage' ? 'Ratio' : 'Total'}</p>
                                        </div>
                                    </div>

                                    {/* stats grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: 'Uses', value: statsModal.stats.totalUses, icon: <Users size={16} />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                            { label: 'Slashed', value: fmt(statsModal.stats.totalDiscountGranted), icon: <DollarSign size={16} />, color: 'text-red-500', bg: 'bg-red-500/10' },
                                            { label: 'Revenue', value: fmt(statsModal.stats.totalRevenue), icon: <TrendingUp size={16} />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                            { label: 'Avg Slash', value: fmt(statsModal.stats.averageDiscount), icon: <Zap size={16} />, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                                        ].map(s => (
                                            <div key={s.label} className={`flex flex-col items-center justify-center p-5 rounded-2xl border border-white/5 transition-all hover:bg-white/5 ${s.bg}`}>
                                                <span className={`${s.color} mb-3`}>{s.icon}</span>
                                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">{s.label}</p>
                                                <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* usage history */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3">
                                                <Clock size={16} className="text-gray-500" /> Redemption Log
                                            </h3>
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                                {statsModal.usages.length} Total Hits
                                            </span>
                                        </div>

                                        {statsModal.usages.length === 0 ? (
                                            <div className="py-16 flex flex-col items-center border border-dashed border-white/10 rounded-[1.5rem] bg-white/[0.01]">
                                                <Eye size={32} className="text-gray-700 mb-4" />
                                                <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">No transaction data</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                {statsModal.usages.map((u, i) => (
                                                    <div key={i} className="flex items-center gap-5 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs font-black text-white shrink-0 group-hover:scale-105 transition-transform">
                                                            {(u.userId?.name || '?')[0].toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[13px] font-black text-white truncate">{u.userId?.name || 'Anonymous'}</p>
                                                            <p className="text-[11px] font-bold text-gray-500 truncate mt-0.5">{u.userId?.email}</p>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className="text-sm font-black text-red-400">&minus;{fmt(u.discountAmount)}</p>
                                                            <p className="text-[10px] font-bold text-gray-500 mt-1 italic uppercase tracking-widest">on {fmt(u.finalAmount)}</p>
                                                        </div>
                                                        <div className="text-right shrink-0 pl-4 border-l border-white/5 min-w-[70px]">
                                                            <p className="text-[11px] font-black text-white">{new Date(u.usedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                                            <p className="text-[8px] font-black text-gray-600 uppercase tracking-tighter mt-1">Settled</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
