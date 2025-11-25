import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function InboxManager({ persona }) {
    const [inbox, setInbox] = useState([]);
    const [selected, setSelected] = useState(null);
    const [mode, setMode] = useState('hybrid');
    const [toneShift, setToneShift] = useState(0);
    const [riskTolerance, setRiskTolerance] = useState(50);
    const [twinDraft, setTwinDraft] = useState('');
    const [generating, setGenerating] = useState(false);
    const [sending, setSending] = useState(false);
    const [candidates, setCandidates] = useState(null);

    useEffect(() => {
        loadInbox();
    }, []);

    const loadInbox = async () => {
        try {
            const messages = await api.getInbox();
            setInbox(messages);
        } catch (error) {
            console.error('Failed to load inbox:', error);
        }
    };

    const generateTwinReply = async () => {
        if (!selected) return;

        setGenerating(true);
        setCandidates(null);
        try {
            const result = await api.generateReply(selected.id, mode, toneShift, riskTolerance);
            setCandidates(result.candidates);
            // Set normal candidate as default
            const normalCandidate = result.candidates.find(c => c.label === 'Normal');
            setTwinDraft(normalCandidate?.text || result.candidates[0]?.text || '');
        } catch (error) {
            alert('Failed to generate reply: ' + error.message);
        } finally {
            setGenerating(false);
        }
    };

    const approveAndSend = async () => {
        if (!twinDraft || !selected) return;

        setSending(true);
        try {
            await api.sendMessage(selected.id, twinDraft);
            alert('Message sent successfully!');
            setTwinDraft('');
            setCandidates(null);
            loadInbox();
        } catch (error) {
            alert('Failed to send message: ' + error.message);
        } finally {
            setSending(false);
        }
    };

    const selectCandidate = (candidate) => {
        setTwinDraft(candidate.text);
    };

    return (
        <div className="card">
            <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800">Inbox — Email MVP</h2>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    {inbox.length} messages
                </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {/* Message List */}
                <div className="col-span-2">
                    <div className="bg-slate-50 rounded-lg border border-slate-200 max-h-96 overflow-y-auto">
                        {inbox.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <p>No messages yet</p>
                                <p className="text-xs mt-2">Connect your email to see messages here</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-200">
                                {inbox.map((msg) => (
                                    <li
                                        key={msg.id}
                                        onClick={() => setSelected(msg)}
                                        className={`p-4 cursor-pointer transition-colors ${selected?.id === msg.id
                                                ? 'bg-indigo-50 border-l-4 border-indigo-600'
                                                : 'hover:bg-slate-100'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="text-sm font-semibold text-slate-800">
                                                    {msg.from}
                                                </div>
                                                <div className="text-sm text-slate-600 mt-1">{msg.subject}</div>
                                                <div className="text-xs text-slate-500 mt-1 truncate">
                                                    {msg.snippet}
                                                </div>
                                            </div>
                                            <div className="text-xs text-slate-400 ml-2">{msg.received}</div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Mode Controls */}
                <div className="col-span-1">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Mode</label>
                            <div className="flex flex-col gap-2">
                                {['ghost', 'auto', 'hybrid'].map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setMode(m)}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${mode === m
                                                ? 'bg-indigo-600 text-white shadow-md'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }`}
                                    >
                                        {m.charAt(0).toUpperCase() + m.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Tone Shift: {toneShift}
                            </label>
                            <input
                                type="range"
                                min="-10"
                                max="10"
                                value={toneShift}
                                onChange={(e) => setToneShift(Number(e.target.value))}
                                className="w-full accent-indigo-600"
                            />
                            <p className="text-xs text-slate-500 mt-1">Adjust phrasing style</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Risk: {riskTolerance}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={riskTolerance}
                                onChange={(e) => setRiskTolerance(Number(e.target.value))}
                                className="w-full accent-indigo-600"
                            />
                            <p className="text-xs text-slate-500 mt-1">Higher = bolder</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Twin Reply Section */}
            <div className="mt-6 border-t border-slate-200 pt-6">
                <h3 className="font-semibold text-slate-800 mb-3">Twin Suggestion</h3>

                {selected ? (
                    <div className="bg-indigo-50 rounded-lg p-3 mb-3 border border-indigo-100">
                        <div className="text-sm">
                            <span className="font-medium text-indigo-900">Selected:</span>{' '}
                            <span className="text-indigo-700">{selected.subject}</span>
                        </div>
                        <div className="text-xs text-indigo-600 mt-1">From: {selected.from}</div>
                    </div>
                ) : (
                    <div className="bg-slate-50 rounded-lg p-4 mb-3 text-center text-slate-500 text-sm">
                        Select an email to generate a twin reply
                    </div>
                )}

                <div className="flex gap-2 mb-3">
                    <button
                        onClick={generateTwinReply}
                        disabled={!selected || generating || !persona}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {generating ? 'Generating...' : 'Generate Reply'}
                    </button>
                    <button onClick={() => setTwinDraft('')} className="btn-secondary">
                        Clear
                    </button>
                </div>

                {/* Candidate Selection */}
                {candidates && (
                    <div className="mb-3 grid grid-cols-3 gap-2">
                        {candidates.map((candidate) => (
                            <button
                                key={candidate.label}
                                onClick={() => selectCandidate(candidate)}
                                className={`p-2 rounded-lg text-xs border transition-all ${twinDraft === candidate.text
                                        ? 'bg-indigo-100 border-indigo-600 text-indigo-900'
                                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                    }`}
                            >
                                <div className="font-semibold">{candidate.label}</div>
                                <div className="text-slate-600">
                                    Confidence: {candidate.confidence}%
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                <textarea
                    value={twinDraft}
                    onChange={(e) => setTwinDraft(e.target.value)}
                    placeholder="Twin suggestion will appear here..."
                    className="w-full h-32 p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />

                <div className="flex gap-2 mt-3">
                    <button
                        onClick={approveAndSend}
                        disabled={!twinDraft || sending}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {sending ? 'Sending...' : 'Approve & Send'}
                    </button>
                    <button className="btn-secondary">Save as Template</button>
                </div>
            </div>
        </div>
    );
}
