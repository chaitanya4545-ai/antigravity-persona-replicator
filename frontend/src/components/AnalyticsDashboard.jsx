import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function AnalyticsDashboard() {
    const [overview, setOverview] = useState(null);
    const [personaUsage, setPersonaUsage] = useState([]);
    const [threadActivity, setThreadActivity] = useState([]);
    const [messagesOverTime, setMessagesOverTime] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState(7);

    useEffect(() => {
        loadAnalytics();
    }, [timeRange]);

    const loadAnalytics = async () => {
        try {
            const [overviewData, personaData, threadData, messagesData] = await Promise.all([
                api.getOverviewMetrics(),
                api.getPersonaUsage(),
                api.getThreadActivity(),
                api.getMessagesOverTime(timeRange)
            ]);

            setOverview(overviewData);
            setPersonaUsage(personaData);
            setThreadActivity(threadData);
            setMessagesOverTime(messagesData);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading analytics...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Analytics Dashboard</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Track your usage and activity patterns
                </p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    icon="💬"
                    label="Total Messages"
                    value={overview?.total_messages || 0}
                    color="indigo"
                />
                <StatCard
                    icon="👥"
                    label="Personas"
                    value={overview?.total_personas || 0}
                    color="purple"
                />
                <StatCard
                    icon="📋"
                    label="Threads"
                    value={overview?.total_threads || 0}
                    color="pink"
                />
            </div>

            {/* Time Range Selector */}
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Time Range:</span>
                <div className="flex gap-2">
                    {[7, 30, 90].map((days) => (
                        <button
                            key={days}
                            onClick={() => setTimeRange(days)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${timeRange === days
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                        >
                            {days}d
                        </button>
                    ))}
                </div>
            </div>

            {/* Messages Over Time */}
            <div className="card">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
                    Messages Over Time (Last {timeRange} days)
                </h3>
                {messagesOverTime.length > 0 ? (
                    <div className="space-y-2">
                        {messagesOverTime.map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-sm text-slate-600 dark:text-slate-400 w-24">
                                    {new Date(item.date).toLocaleDateString()}
                                </span>
                                <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-6 relative">
                                    <div
                                        className="bg-indigo-600 h-6 rounded-full flex items-center justify-end pr-2"
                                        style={{ width: `${Math.min((item.count / Math.max(...messagesOverTime.map(m => m.count))) * 100, 100)}%` }}
                                    >
                                        <span className="text-xs text-white font-medium">{item.count}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No data available</p>
                )}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Persona Usage */}
                <div className="card">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
                        Persona Usage
                    </h3>
                    {personaUsage.length > 0 ? (
                        <div className="space-y-3">
                            {personaUsage.map((persona, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div
                                        className="w-4 h-4 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: persona.color || '#4f46e5' }}
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                                {persona.name}
                                            </span>
                                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                                {persona.message_count} msgs
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full"
                                                style={{
                                                    width: `${Math.min((persona.message_count / Math.max(...personaUsage.map(p => p.message_count))) * 100, 100)}%`,
                                                    backgroundColor: persona.color || '#4f46e5'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">No data available</p>
                    )}
                </div>

                {/* Thread Activity */}
                <div className="card">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
                        Top Threads
                    </h3>
                    {threadActivity.length > 0 ? (
                        <div className="space-y-3">
                            {threadActivity.map((thread, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                                            {thread.title}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            {thread.last_message_at
                                                ? `Last: ${new Date(thread.last_message_at).toLocaleDateString()}`
                                                : 'No messages'}
                                        </p>
                                    </div>
                                    <div className="ml-3 flex-shrink-0">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                                            {thread.message_count || 0}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">No data available</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }) {
    const colorClasses = {
        indigo: 'from-indigo-500 to-indigo-600',
        purple: 'from-purple-500 to-purple-600',
        pink: 'from-pink-500 to-pink-600',
    };

    return (
        <div className={`card bg-gradient-to-br ${colorClasses[color]} text-white`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm opacity-90">{label}</p>
                    <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
                </div>
                <div className="text-4xl opacity-80">{icon}</div>
            </div>
        </div>
    );
}
