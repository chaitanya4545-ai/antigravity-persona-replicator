import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

export default function ChatInterface({ persona }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [chatMode, setChatMode] = useState('twin'); // 'twin' or 'assistant'
    const messagesEndRef = useRef(null);

    useEffect(() => {
        loadHistory();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadHistory = async () => {
        try {
            const history = await api.getChatHistory();
            setMessages(history);
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');

        // Add user message immediately
        setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);

        setLoading(true);
        try {
            let response;

            if (chatMode === 'twin') {
                // Use persona-based response
                response = await api.sendChatMessage(userMessage);
            } else {
                // Use general AI assistant (ChatGPT-like)
                response = await api.sendAssistantMessage(userMessage);
            }

            // Add AI response
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.message,
                confidence: response.confidence,
                mode: chatMode,
                timestamp: new Date()
            }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const clearHistory = async () => {
        if (!confirm('Clear all chat history?')) return;

        try {
            await api.clearChatHistory();
            setMessages([]);
        } catch (error) {
            console.error('Failed to clear history:', error);
        }
    };

    return (
        <div className="card h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Chat Interface</h2>
                    <p className="text-sm text-slate-600">
                        {chatMode === 'twin' ? 'Chatting with your AI Twin' : 'AI Assistant Mode'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Mode Toggle */}
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={() => setChatMode('twin')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${chatMode === 'twin'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-800'
                                }`}
                        >
                            👤 AI Twin
                        </button>
                        <button
                            onClick={() => setChatMode('assistant')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${chatMode === 'assistant'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-800'
                                }`}
                        >
                            🤖 AI Assistant
                        </button>
                    </div>

                    <button
                        onClick={clearHistory}
                        className="text-sm text-slate-500 hover:text-slate-700"
                    >
                        Clear History
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 min-h-[400px] max-h-[600px]">
                {messages.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <p>Start a conversation!</p>
                        <p className="text-sm mt-2">
                            {chatMode === 'twin'
                                ? 'Test how your AI twin would respond'
                                : 'Ask me anything like ChatGPT'}
                        </p>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg px-4 py-3 ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white'
                                        : msg.mode === 'assistant'
                                            ? 'bg-emerald-100 text-slate-800 border border-emerald-200'
                                            : 'bg-slate-100 text-slate-800'
                                    }`}
                            >
                                {msg.role === 'assistant' && msg.mode && (
                                    <div className="text-xs mb-1 opacity-70">
                                        {msg.mode === 'twin' ? '👤 AI Twin' : '🤖 AI Assistant'}
                                    </div>
                                )}
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                {msg.confidence && (
                                    <p className="text-xs mt-2 opacity-70">
                                        Confidence: {msg.confidence}%
                                    </p>
                                )}
                                <p className="text-xs mt-1 opacity-60">
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-100 rounded-lg px-4 py-3">
                            <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={chatMode === 'twin' ? 'Ask your AI twin...' : 'Ask me anything...'}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows="2"
                    disabled={loading}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
