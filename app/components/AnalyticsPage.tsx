'use client';
import React, { useEffect, useState } from 'react';
import {
    BarChart3,
    TrendingUp,
    Eye,
    Clock,
    RefreshCw,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';
import { analyticsApi } from '../lib/api';

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div
            style={{
                background: 'rgba(17, 25, 40, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: '12px 16px',
                fontSize: 13,
            }}
        >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
            {payload.map((p: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                    <span style={{ color: 'var(--muted-foreground)' }}>{p.name}:</span>
                    <span style={{ fontWeight: 600 }}>{p.value}</span>
                </div>
            ))}
        </div>
    );
}

export default function AnalyticsPage() {
    const [summary, setSummary] = useState<any>(null);
    const [pageViews, setPageViews] = useState<any[]>([]);
    const [popularPages, setPopularPages] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [summaryData, pvData, ppData, sessData] = await Promise.all([
                analyticsApi.getSummary(),
                analyticsApi.getPageViews(100),
                analyticsApi.getPopularPages(10),
                analyticsApi.getRecentSessions(50),
            ]);
            setSummary(summaryData);
            setPageViews(pvData);
            setPopularPages(ppData);
            setSessions(sessData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Build hourly pageview distribution
    const hourlyData = React.useMemo(() => {
        const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, views: 0 }));
        pageViews.forEach((pv: any) => {
            const h = new Date(pv.timestamp).getHours();
            hours[h].views += 0.5;
        });
        hours.forEach(h => {
            h.views = Math.ceil(h.views);
        });
        return hours;
    }, [pageViews]);

    // Build daily sessions
    const dailySessions = React.useMemo(() => {
        const map: Record<string, number> = {};
        sessions.forEach((s: any) => {
            const d = new Date(s.startTime).toISOString().split('T')[0];
            map[d] = (map[d] || 0) + 1;
        });
        return Object.entries(map)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, count]) => ({
                date: new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
                sessions: count,
            }));
    }, [sessions]);

    if (loading) {
        return (
            <div style={{ padding: 32 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 100 }} />
                    ))}
                </div>
                <div className="skeleton" style={{ height: 340, marginTop: 24 }} />
            </div>
        );
    }

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
                        <BarChart3
                            size={28}
                            style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle', color: '#6c63ff' }}
                        />
                        Analytics
                    </h1>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: 14, marginTop: 4 }}>
                        Website traffic and engagement metrics
                    </p>
                </div>
                <button className="btn-secondary" onClick={fetchData}>
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 16,
                    marginBottom: 24,
                }}
            >
                <div className="glass-card stat-card purple animate-fadeIn" style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 500, marginBottom: 6 }}>
                        Total Visitors
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{summary?.totalVisitors?.toLocaleString() || 0}</div>
                </div>
                <div
                    className="glass-card stat-card teal animate-fadeIn"
                    style={{ padding: '16px 20px', animationDelay: '50ms' }}
                >
                    <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 500, marginBottom: 6 }}>
                        Total Sessions
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{summary?.totalSessions?.toLocaleString() || 0}</div>
                </div>
                <div
                    className="glass-card stat-card amber animate-fadeIn"
                    style={{ padding: '16px 20px', animationDelay: '100ms' }}
                >
                    <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 500, marginBottom: 6 }}>
                        Total Page Views
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{Math.ceil((summary?.totalPageViews || 0) / 2).toLocaleString()}</div>
                </div>
                <div
                    className="glass-card stat-card green animate-fadeIn"
                    style={{ padding: '16px 20px', animationDelay: '150ms' }}
                >
                    <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 500, marginBottom: 6 }}>
                        Active Sessions
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{summary?.activeSessions || 0}</div>
                </div>
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                {/* Sessions over time */}
                <div className="glass-card animate-fadeIn" style={{ padding: 24, animationDelay: '200ms' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Sessions Over Time</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={dailySessions}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="sessions"
                                stroke="#6c63ff"
                                strokeWidth={2}
                                dot={{ r: 4, fill: '#6c63ff' }}
                                name="Sessions"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Hourly Distribution */}
                <div className="glass-card animate-fadeIn" style={{ padding: 24, animationDelay: '250ms' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Hourly Page Views</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={hourlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis
                                dataKey="hour"
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                interval={2}
                            />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="views" fill="#00d4aa" radius={[4, 4, 0, 0]} barSize={14} name="Views" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Popular Pages */}
            <div className="glass-card animate-fadeIn" style={{ padding: 24, animationDelay: '300ms' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
                    <Eye size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                    Most Visited Pages
                </h3>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Page</th>
                            <th>Title</th>
                            <th style={{ textAlign: 'right' }}>Views</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(popularPages || []).map((page: any, i: number) => (
                            <tr key={i}>
                                <td style={{ fontWeight: 600, color: '#6c63ff' }}>{i + 1}</td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{page.path}</td>
                                <td style={{ color: 'var(--muted-foreground)' }}>{page.title || '—'}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <span className="badge badge-purple">{Math.ceil((page.count || 0) / 2)}</span>
                                </td>
                            </tr>
                        ))}
                        {(!popularPages || popularPages.length === 0) && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted-foreground)' }}>
                                    No page view data available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
