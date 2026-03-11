'use client';
import React, { useEffect, useState } from 'react';
import { CreditCard, RefreshCw, CheckCircle2, XCircle, Search, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { paymentsApi } from '../lib/api';

interface Payment {
    _id: string;
    description: string;
    amount: number;
    currency: string;
    status: string;
    method: string;
    userId?: { _id: string; name: string; email: string };
    createdAt: string;
}

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortField, setSortField] = useState<'createdAt' | 'amount'>('createdAt');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await paymentsApi.getAll(100, 0); // fetching up to 100 for proper client-side filtering
            setPayments(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleSort = (field: typeof sortField) => {
        if (sortField === field) {
            setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const filtered = payments.filter(p => {
        const matchesSearch =
            p.description?.toLowerCase().includes(search.toLowerCase()) ||
            p.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.userId?.email?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        let cmp = 0;
        if (sortField === 'createdAt') {
            cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else if (sortField === 'amount') {
            cmp = a.amount - b.amount;
        }
        return sortDir === 'asc' ? cmp : -cmp;
    });

    const getStatusBadge = (status: string) => {
        if (status === 'paid') return <span className="badge badge-green">Paid</span>;
        if (status === 'failed') return <span className="badge badge-red">Failed</span>;
        if (status === 'created') return <span className="badge badge-amber">Pending</span>;
        return <span className="badge badge-inactive">{status}</span>;
    };

    return (
        <div style={{ padding: '24px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }} className="animate-fadeIn">
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800 }}>
                        <CreditCard size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle', color: '#6c63ff' }} />
                        Payments
                    </h1>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: 14, marginTop: 4 }}>
                        View all transactions and payment history
                    </p>
                </div>
                <button className="btn-secondary" onClick={fetchData}>
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                    <input
                        className="form-input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by user, email, or description..."
                        style={{ paddingLeft: 36, width: '100%' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    {[
                        { value: 'all', label: 'All' },
                        { value: 'paid', label: 'Paid' },
                        { value: 'created', label: 'Pending' },
                        { value: 'failed', label: 'Failed' },
                    ].map((f) => (
                        <button
                            key={f.value}
                            className={`tab-btn ${statusFilter === f.value ? 'active' : ''}`}
                            onClick={() => setStatusFilter(f.value)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 64 }} />
                    ))}
                </div>
            ) : (
                <div className="glass-card animate-fadeIn" style={{ overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Description</th>
                                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('amount')}>
                                    Amount {sortField === 'amount' && (sortDir === 'asc' ? <ChevronUp size={12} style={{ display: 'inline' }} /> : <ChevronDown size={12} style={{ display: 'inline' }} />)}
                                </th>
                                <th>Method</th>
                                <th>Status</th>
                                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('createdAt')}>
                                    Date {sortField === 'createdAt' && (sortDir === 'asc' ? <ChevronUp size={12} style={{ display: 'inline' }} /> : <ChevronDown size={12} style={{ display: 'inline' }} />)}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => (
                                <tr key={p._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: 10,
                                                background: 'linear-gradient(135deg, #6c63ff, #00d4aa)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 14, fontWeight: 700, color: 'white'
                                            }}>
                                                {(p.userId?.name || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.userId?.name || 'Unknown User'}</div>
                                                <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{p.userId?.email || 'No email provided'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: 13 }}>{p.description || '—'}</td>
                                    <td style={{ fontWeight: 700, fontSize: 14, color: p.status === 'paid' ? '#4ade80' : 'var(--foreground)' }}>
                                        {p.currency === 'USD' ? '$' : '₹'}{(p.amount / 100).toLocaleString('en-IN')}
                                    </td>
                                    <td>
                                        <span className="badge" style={{ background: 'rgba(108,99,255,0.1)', color: '#a5b4fc', textTransform: 'capitalize' }}>
                                            {p.method || 'Unknown'}
                                        </span>
                                    </td>
                                    <td>{getStatusBadge(p.status)}</td>
                                    <td>
                                        <div>
                                            <div style={{ fontSize: 13 }}>{new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                            <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{new Date(p.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: 40 }}>
                                        No payments found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
