'use client';
import React, { useEffect, useState } from 'react';
import { Users, Globe, Monitor, Smartphone, Tablet, Clock, Eye, RefreshCw } from 'lucide-react';
import { analyticsApi } from '../lib/api';

function getDeviceIcon(device?: string) {
    switch (device?.toLowerCase()) {
        case 'mobile':
            return <Smartphone size={14} />;
        case 'tablet':
            return <Tablet size={14} />;
        default:
            return <Monitor size={14} />;
    }
}

function timeAgo(date: string) {
    const now = new Date();
    const past = new Date(date);
    const diff = (now.getTime() - past.getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function VisitorsPage() {
    const [visitors, setVisitors] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'visitors' | 'sessions'>('visitors');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [v, s] = await Promise.all([
                analyticsApi.getVisitors(),
                analyticsApi.getSessions(100),
            ]);
            setVisitors(v);
            setSessions(s);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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
                        <Users
                            size={28}
                            style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle', color: '#6c63ff' }}
                        />
                        Visitors
                    </h1>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: 14, marginTop: 4 }}>
                        People visiting your platform
                    </p>
                </div>
                <button className="btn-secondary" onClick={fetchData}>
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                <button
                    className={`tab-btn ${tab === 'visitors' ? 'active' : ''}`}
                    onClick={() => setTab('visitors')}
                >
                    <Users size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                    Visitors ({visitors.length})
                </button>
                <button
                    className={`tab-btn ${tab === 'sessions' ? 'active' : ''}`}
                    onClick={() => setTab('sessions')}
                >
                    <Clock size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                    Sessions ({sessions.length})
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 60 }} />
                    ))}
                </div>
            ) : tab === 'visitors' ? (
                <div className="glass-card animate-fadeIn" style={{ overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Visitor / User</th>
                                <th>Device</th>
                                <th>Country</th>
                                <th>Sessions</th>
                                <th>Page Views</th>
                                <th>First Visit</th>
                                <th>Last Visit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visitors.map((v: any) => (
                                <tr key={v._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            {v.user ? (
                                                <>
                                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(108,99,255,0.1)', color: '#6c63ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                                                        {v.user.name?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{v.user.name}</div>
                                                        <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{v.user.email}</div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(148,163,184,0.1)', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Users size={14} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 13 }}>Guest</div>
                                                        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)' }}>{v.visitorId?.slice(0, 10)}...</div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {getDeviceIcon(v.device)}
                                            <span style={{ textTransform: 'capitalize' }}>{v.device || 'desktop'}</span>
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Globe size={14} color="var(--muted-foreground)" />
                                            {v.country || '—'}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{v.totalSessions || 0}</td>
                                    <td style={{ fontWeight: 600 }}>{Math.ceil((v.totalPageViews || 0) / 2)}</td>
                                    <td style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>
                                        {v.firstVisit ? new Date(v.firstVisit).toLocaleDateString() : '—'}
                                    </td>
                                    <td>
                                        <span className="badge badge-active">{v.lastVisit ? timeAgo(v.lastVisit) : '—'}</span>
                                    </td>
                                </tr>
                            ))}
                            {visitors.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: 40 }}>
                                        No visitors recorded yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="glass-card animate-fadeIn" style={{ overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>User / Session</th>
                                <th>Device</th>
                                <th>Landing Page</th>
                                <th>Pages</th>
                                <th>Status</th>
                                <th>Started</th>
                                <th>Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map((s: any) => {
                                const dur = s.endTime
                                    ? Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000)
                                    : null;
                                return (
                                    <tr key={s._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                {s.user ? (
                                                    <>
                                                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(108,99,255,0.1)', color: '#6c63ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                                                            {s.user.name?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: 13 }}>{s.user.name}</div>
                                                            <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{s.user.email}</div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(148,163,184,0.1)', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Eye size={14} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: 13 }}>Guest</div>
                                                            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)' }}>{s.sessionId?.slice(0, 10)}...</div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {getDeviceIcon(s.device)}
                                                <span style={{ textTransform: 'capitalize' }}>{s.device || 'desktop'}</span>
                                            </span>
                                        </td>
                                        <td
                                            style={{
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: 12,
                                                maxWidth: 200,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {s.landingPage || '—'}
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{Math.ceil((s.pageCount || 0) / 2)}</td>
                                        <td>
                                            <span className={`badge ${s.isActive ? 'badge-active' : 'badge-inactive'}`}>
                                                {s.isActive ? '● Live' : '○ Ended'}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>
                                            {s.startTime ? timeAgo(s.startTime) : '—'}
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{dur !== null ? `${dur}m` : '—'}</td>
                                    </tr>
                                );
                            })}
                            {sessions.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: 40 }}>
                                        No sessions recorded yet
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
