import React, { useState, useEffect, useRef } from 'react';
import MarkdownMessage from './MarkdownMessage';
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

    return (
        <div className="flex flex-col h-[600px] bg-white dark:bg-slate-800 rounded-xl shadow-lg">
            {/* Mode Toggle */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex gap-2">
                    <button
                        onClick={() => setChatMode('twin')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${chatMode === 'twin'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                    >
                        👤 AI Twin {persona ? `(${persona.name || 'Your Persona'})` : ''}
                    </button>
                    <button
                        onClick={() => setChatMode('assistant')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${chatMode === 'assistant'
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                    >
                        🤖 AI Assistant
                    </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    {chatMode === 'twin'
                        ? 'Chat with your AI twin - trained on your writing style'
                        : 'Chat with a general AI assistant - like ChatGPT'}
                </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-slate-400 dark:text-slate-500 mt-8">
                        <div className="text-6xl mb-4">💬</div>
                        <p className="text-lg font-medium">Start a conversation</p>
                        <p className="text-sm mt-2">
                            {chatMode === 'twin'
                                ? 'Your AI twin will respond in your style'
                                : 'Ask anything - I\'m here to help!'}
                        </p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg px-4 py-3 ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100'
                                }`}
                        >
                            {msg.role === 'assistant' ? (
                                <MarkdownMessage content={msg.content} />
                            ) : (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            )}
                            <div className={`text-xs mt-2 ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'
                                }`}>
                                {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-100 dark:bg-slate-700 rounded-lg px-4 py-3">
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
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={chatMode === 'twin' ? 'Message your AI twin...' : 'Ask me anything...'}
                        className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white resize-none"
                        rows="2"
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        Send
                    </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}
