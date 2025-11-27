import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import MarkdownMessage from './MarkdownMessage';
import SearchBar from './SearchBar';
import api from '../services/api';
import { downloadFile } from '../utils/download';

export default function ChatInterface({ persona }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [chatMode, setChatMode] = useState('twin'); // 'twin' or 'assistant'
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        loadHistory();
    }, []);

    // Only auto-scroll if user is near bottom
    useEffect(() => {
        if (shouldAutoScroll) {
            scrollToBottom();
        }
    }, [messages, searchResults, shouldAutoScroll]);

    // Detect if user is scrolling manually
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShouldAutoScroll(isNearBottom);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    // Keyboard shortcut for search (Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('[data-search-input]');
                searchInput?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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

    const handleSearch = async (query) => {
        setSearching(true);
        try {
            const data = await api.searchMessages(query);
            setSearchResults(data.results);
            setSearchQuery(query);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setSearching(false);
        }
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleExportJSON = async () => {
        try {
            const blob = await api.exportChatJSON();
            const filename = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
            downloadFile(blob, filename);
            toast.success('Chat history exported as JSON!');
        } catch (error) {
            toast.error('Export failed');
        }
    };

    const handleExportCSV = async () => {
        try {
            const blob = await api.exportChatCSV();
            const filename = `chat-history-${new Date().toISOString().split('T')[0]}.csv`;
            downloadFile(blob, filename);
            toast.success('Chat history exported as CSV!');
        } catch (error) {
            toast.error('Export failed');
        }
    };

    const highlightText = (text, query) => {
        if (!query) return text;

        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <mark key={i} className="bg-yellow-200 dark:bg-yellow-600">{part}</mark>
            ) : (
                part
            )
        );
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

    const displayMessages = searchQuery ? searchResults : messages;

    return (
        <div className="flex flex-col h-[600px] bg-white dark:bg-slate-800 rounded-xl shadow-lg">
            {/* Mode Toggle */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex gap-2 mb-4">
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

                {/* Search Bar */}
                <SearchBar
                    onSearch={handleSearch}
                    onClear={handleClearSearch}
                    resultsCount={searchQuery ? searchResults.length : null}
                    loading={searching}
                />

                {/* Export Buttons */}
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={handleExportJSON}
                        className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
                    >
                        📥 Export JSON
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
                    >
                        📊 Export CSV
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {searchQuery && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-indigo-700 dark:text-indigo-300">
                                Showing {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                            </p>
                            <button
                                onClick={handleClearSearch}
                                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                                Clear search
                            </button>
                        </div>
                    </div>
                )}

                {displayMessages.length === 0 && !searchQuery && (
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

                {displayMessages.length === 0 && searchQuery && (
                    <div className="text-center text-slate-400 dark:text-slate-500 mt-8">
                        <div className="text-6xl mb-4">🔍</div>
                        <p className="text-lg font-medium">No results found</p>
                        <p className="text-sm mt-2">Try a different search term</p>
                    </div>
                )}

                {displayMessages.map((msg, i) => (
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
                                searchQuery ? (
                                    <div className="prose dark:prose-invert max-w-none">
                                        {highlightText(msg.content, searchQuery)}
                                    </div>
                                ) : (
                                    <MarkdownMessage content={msg.content} />
                                )
                            ) : (
                                <p className="whitespace-pre-wrap">
                                    {searchQuery ? highlightText(msg.content, searchQuery) : msg.content}
                                </p>
                            )}
                            <div className={`text-xs mt-2 ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'
                                }`}>
                                {msg.created_at ? new Date(msg.created_at).toLocaleString() :
                                    msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ''}
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
                    Press Enter to send, Shift+Enter for new line • Ctrl+K to search
                </p>
            </div>
        </div>
    );
}
