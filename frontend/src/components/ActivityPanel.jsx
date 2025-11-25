import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function ActivityPanel() {
    const [activity, setActivity] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [blacklist, setBlacklist] = useState('');

    useEffect(() => {
        loadActivity();
        loadMetrics();
    }, []);

    const loadActivity = async () => {
        try {
            const data = await api.getActivity();
            setActivity(data);
        } catch (error) {
            console.error('Failed to load activity:', error);
        }
    };

    const loadMetrics = async () => {
        try {
            const data = await api.getMetrics();
            setMetrics(data);
        } catch (error) {
            console.error('Failed to load metrics:', error);
        }
    };

    return (
        <div className="card">
            <h2 className="text-xl font-bold mb-4 text-slate-800">Activity & Safety</h2>

            {/* Recent Activity */}
            <div className="mb-6">
                <h3 className="font-semibold text-slate-800 mb-3">Recent Actions</h3>
                <div className="bg-slate-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {activity.length === 0 ? (
                        <p className="text-sm text-slate-400">No recent activity</p>
                    ) : (
                        <ul className="space-y-2 text-sm">
                            {activity.map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-indigo-600 mt-0.5">•</span>
                                    <div className="flex-1">
                                        <div className="text-slate-700">{item.action}</div>
                                        <div className="text-xs text-slate-500">{item.timestamp}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Model Health */}
            <div className="mb-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-100">
                <h3 className="font-semibold text-slate-800 mb-3">Model Health</h3>
                {metrics ? (
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-600">Tokens used:</span>
                            <span className="font-semibold text-slate-800">
                                {metrics.tokensUsed?.toLocaleString() || '0'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Approval rate:</span>
                            <span className="font-semibold text-emerald-700">
                                {metrics.approvalRate || '0'}%
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Messages sent:</span>
                            <span className="font-semibold text-slate-800">
                                {metrics.messagesSent || '0'}
                            </span>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">Loading metrics...</p>
                )}
            </div>

            {/* Blacklist/Whitelist */}
            <div>
                <h3 className="font-semibold text-slate-800 mb-2">Safety Controls</h3>
                <p className="text-xs text-slate-500 mb-2">
                    Block phrases, domains, or set approval rules
                </p>
                <textarea
                    value={blacklist}
                    onChange={(e) => setBlacklist(e.target.value)}
                    placeholder="e.g., never use phrase: 'as per my last email'"
                    className="w-full h-24 p-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button className="w-full mt-2 btn-secondary text-sm">
                    Save Rules
                </button>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-2 gap-2">
                <div className="bg-indigo-50 rounded-lg p-3 text-center border border-indigo-100">
                    <div className="text-2xl font-bold text-indigo-600">
                        {metrics?.confidence || '0'}%
                    </div>
                    <div className="text-xs text-slate-600 mt-1">Avg. Confidence</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-100">
                    <div className="text-2xl font-bold text-purple-600">
                        {metrics?.responseTime || '0'}s
                    </div>
                    <div className="text-xs text-slate-600 mt-1">Avg. Response</div>
                </div>
            </div>
        </div>
    );
}
