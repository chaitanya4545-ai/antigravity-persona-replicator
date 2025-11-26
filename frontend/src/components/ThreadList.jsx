import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function ThreadList({ activeThread, onThreadChange }) {
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newThreadTitle, setNewThreadTitle] = useState('');
    const [newThreadDescription, setNewThreadDescription] = useState('');

    useEffect(() => {
        loadThreads();
    }, []);

    const loadThreads = async () => {
        try {
            const data = await api.getThreads();
            setThreads(data);

            // If no active thread, select the first one
            if (!activeThread && data.length > 0) {
                onThreadChange(data[0]);
            }
        } catch (error) {
            console.error('Failed to load threads:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateThread = async (e) => {
        e.preventDefault();

        if (!newThreadTitle.trim()) {
            toast.error('Thread title is required');
            return;
        }

        try {
            const newThread = await api.createThread(newThreadTitle, newThreadDescription, null);
            toast.success('Thread created!');
            setShowCreateModal(false);
            setNewThreadTitle('');
            setNewThreadDescription('');
            loadThreads();
            onThreadChange(newThread);
        } catch (error) {
            toast.error('Failed to create thread');
        }
    };

    const handleDeleteThread = async (thread, e) => {
        e.stopPropagation();

        if (!confirm(`Delete "${thread.title}"?`)) {
            return;
        }

        try {
            await api.deleteThread(thread.id);
            toast.success('Thread deleted');
            loadThreads();

            // If deleted thread was active, switch to first available
            if (activeThread?.id === thread.id && threads.length > 1) {
                const nextThread = threads.find(t => t.id !== thread.id);
                onThreadChange(nextThread);
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to delete thread');
        }
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'No messages';

        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return <div className="p-4 text-slate-400">Loading threads...</div>;
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-800">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase">Threads</h3>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="text-indigo-400 hover:text-indigo-300 text-xl"
                        title="New Thread"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Thread List */}
            <div className="flex-1 overflow-y-auto">
                {threads.map((thread) => (
                    <button
                        key={thread.id}
                        onClick={() => onThreadChange(thread)}
                        className={`w-full text-left p-3 border-b border-slate-800 hover:bg-slate-800 transition-colors ${activeThread?.id === thread.id ? 'bg-slate-800' : ''
                            }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    {thread.persona_color && (
                                        <div
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: thread.persona_color }}
                                        />
                                    )}
                                    <p className="font-medium text-white truncate">{thread.title}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-slate-500">
                                        {thread.message_count || 0} messages
                                    </span>
                                    <span className="text-xs text-slate-500">•</span>
                                    <span className="text-xs text-slate-500">
                                        {formatTimestamp(thread.last_message_at)}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={(e) => handleDeleteThread(thread, e)}
                                className="ml-2 text-slate-500 hover:text-red-400 text-sm"
                            >
                                ×
                            </button>
                        </div>
                    </button>
                ))}

                {threads.length === 0 && (
                    <div className="p-4 text-center text-slate-500">
                        <p className="text-sm">No threads yet</p>
                        <p className="text-xs mt-1">Create one to get started</p>
                    </div>
                )}
            </div>

            {/* Create Thread Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-white mb-4">New Thread</h3>

                        <form onSubmit={handleCreateThread} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={newThreadTitle}
                                    onChange={(e) => setNewThreadTitle(e.target.value)}
                                    placeholder="e.g., Project Alpha, Marketing Ideas"
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={newThreadDescription}
                                    onChange={(e) => setNewThreadDescription(e.target.value)}
                                    placeholder="Optional description"
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white resize-none"
                                    rows="3"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setNewThreadTitle('');
                                        setNewThreadDescription('');
                                    }}
                                    className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
