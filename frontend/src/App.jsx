import React, { useState, useEffect } from 'react';
import PersonaIngestion from './components/PersonaIngestion';
import InboxManager from './components/InboxManager';
import ActivityPanel from './components/ActivityPanel';
import ChatInterface from './components/ChatInterface';
import ShortcutsHelp from './components/ShortcutsHelp';
import { useDarkMode } from './hooks/useDarkMode';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import api from './services/api';

export default function App() {
    const [user, setUser] = useState(null);
    const [persona, setPersona] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('chat');
    const [showShortcuts, setShowShortcuts] = useState(false);

    // Dark mode
    const { isDark, toggle: toggleDarkMode } = useDarkMode();

    // Keyboard shortcuts
    useKeyboardShortcuts({
        onToggleDarkMode: toggleDarkMode,
        onFocusChat: () => {
            setActiveView('chat');
            setTimeout(() => {
                const input = document.querySelector('input[type="text"], textarea');
                input?.focus();
            }, 100);
        },
        onShowHelp: () => setShowShortcuts(true),
        onNewChat: () => setActiveView('chat'),
        onEscape: () => setShowShortcuts(false),
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            loadUserData();
        } else {
            setLoading(false);
        }
    }, []);

    const loadUserData = async () => {
        try {
            const userData = await api.getCurrentUser();
            setUser(userData);

            const personaData = await api.getPersona();
            setPersona(personaData);
        } catch (error) {
            console.error('Failed to load user data:', error);
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (email, password) => {
        try {
            const response = await api.login(email, password);
            localStorage.setItem('token', response.token);
            setUser(response.user);
            loadUserData();
        } catch (error) {
            alert('Login failed: ' + error.message);
        }
    };

    const handleSignup = async (email, password, name) => {
        try {
            const response = await api.signup(email, password, name);
            localStorage.setItem('token', response.token);
            setUser(response.user);
            loadUserData();
        } catch (error) {
            alert('Signup failed: ' + error.message);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setPersona(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return <LoginScreen onLogin={handleLogin} onSignup={handleSignup} />;
    }

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 flex">
                {/* Sidebar */}
                <aside className="w-64 bg-gradient-to-b from-slate-900 via-indigo-900 to-slate-900 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950 text-white flex flex-col">
                    <div className="p-6">
                        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Antigravity Twin
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">AI Persona Replicator</p>
                    </div>

                    <nav className="flex-1 px-3">
                        <NavItem
                            icon="💬"
                            label="Chat with Twin"
                            active={activeView === 'chat'}
                            onClick={() => setActiveView('chat')}
                        />
                        <NavItem
                            icon="👤"
                            label="Train Persona"
                            active={activeView === 'persona'}
                            onClick={() => setActiveView('persona')}
                        />
                        <NavItem
                            icon="📧"
                            label="Email Inbox"
                            active={activeView === 'inbox'}
                            onClick={() => setActiveView('inbox')}
                        />
                        <NavItem
                            icon="🎤"
                            label="Voice Features"
                            active={activeView === 'voice'}
                            onClick={() => setActiveView('voice')}
                        />
                        <NavItem
                            icon="⚙️"
                            label="Settings"
                            active={activeView === 'settings'}
                            onClick={() => setActiveView('settings')}
                        />
                        <NavItem
                            icon="📊"
                            label="Activity"
                            active={activeView === 'activity'}
                            onClick={() => setActiveView('activity')}
                        />
                    </nav>

                    <div className="p-4 border-t border-slate-700 dark:border-slate-800 space-y-3">
                        {/* Dark Mode Toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="w-full px-4 py-2 bg-slate-800 dark:bg-slate-900 hover:bg-slate-700 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-2"
                            title="Toggle dark mode (Ctrl+D)"
                        >
                            <span className="text-xl">{isDark ? '☀️' : '🌙'}</span>
                            <span className="text-sm">{isDark ? 'Light' : 'Dark'} Mode</span>
                        </button>

                        {/* Keyboard Shortcuts Help */}
                        <button
                            onClick={() => setShowShortcuts(true)}
                            className="w-full px-4 py-2 bg-slate-800 dark:bg-slate-900 hover:bg-slate-700 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-2"
                            title="Show keyboard shortcuts (Ctrl+/)"
                        >
                            <span className="text-xl">⌨️</span>
                            <span className="text-sm">Shortcuts</span>
                        </button>

                        {/* User Info */}
                        <div className="text-xs text-slate-400 pt-2">
                            {user.name || user.email}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-6xl mx-auto p-8">
                        {activeView === 'chat' && (
                            <div>
                                <h2 className="text-3xl font-bold text-slate-800 mb-6">Chat with Your AI Twin</h2>
                                <ChatInterface persona={persona} />
                            </div>
                        )}

                        {activeView === 'persona' && (
                            <div>
                                <h2 className="text-3xl font-bold text-slate-800 mb-6">Train Your Persona</h2>
                                <PersonaIngestion persona={persona} onPersonaUpdate={setPersona} />
                            </div>
                        )}

                        {activeView === 'inbox' && (
                            <div>
                                <h2 className="text-3xl font-bold text-slate-800 mb-6">Email Inbox</h2>
                                <InboxManager persona={persona} />
                            </div>
                        )}

                        {activeView === 'voice' && (
                            <div>
                                <h2 className="text-3xl font-bold text-slate-800 mb-6">Voice Features</h2>
                                <VoiceFeatures persona={persona} />
                            </div>
                        )}

                        {activeView === 'settings' && (
                            <div>
                                <h2 className="text-3xl font-bold text-slate-800 mb-6">Settings</h2>
                                <SettingsView />
                            </div>
                        )}

                        {activeView === 'activity' && (
                            <div>
                                <h2 className="text-3xl font-bold text-slate-800 mb-6">Activity & Metrics</h2>
                                <ActivityPanel />
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Shortcuts Help Modal */}
            <ShortcutsHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
        </>
    );
}

function NavItem({ icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${active
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
        >
            <span className="text-xl">{icon}</span>
            <span className="font-medium">{label}</span>
        </button>
    );
}

function VoiceFeatures({ persona }) {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [recognition, setRecognition] = useState(null);

    useEffect(() => {
        // Initialize speech recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recog = new SpeechRecognition();
            recog.continuous = false;
            recog.interimResults = false;
            recog.lang = 'en-US';

            recog.onresult = (event) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
                handleVoiceInput(text);
            };

            recog.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsRecording(false);
            };

            recog.onend = () => {
                setIsRecording(false);
            };

            setRecognition(recog);
        }
    }, []);

    const handleVoiceInput = async (text) => {
        try {
            const response = await api.sendChatMessage(text);
            setAiResponse(response.message);
            speakText(response.message);
        } catch (error) {
            console.error('Failed to get AI response:', error);
        }
    };

    const speakText = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        }
    };

    const toggleRecording = () => {
        if (!recognition) {
            alert('Speech recognition not supported in this browser');
            return;
        }

        if (isRecording) {
            recognition.stop();
        } else {
            setTranscript('');
            setAiResponse('');
            recognition.start();
            setIsRecording(true);
        }
    };

    if (!persona) {
        return (
            <div className="card text-center py-12">
                <div className="text-6xl mb-4">🎤</div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Voice Features</h3>
                <p className="text-slate-600">Upload training samples first to create your persona</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="card">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Voice-to-Text & AI Response</h3>

                <div className="text-center mb-6">
                    <button
                        onClick={toggleRecording}
                        className={`w-32 h-32 rounded-full flex items-center justify-center text-6xl transition-all ${isRecording
                            ? 'bg-red-500 animate-pulse shadow-lg'
                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
                            }`}
                    >
                        {isRecording ? '⏹️' : '🎤'}
                    </button>
                    <p className="mt-4 text-sm text-slate-600">
                        {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
                    </p>
                </div>

                {transcript && (
                    <div className="bg-slate-100 rounded-lg p-4 mb-4">
                        <p className="text-sm text-slate-600 mb-1">You said:</p>
                        <p className="text-slate-800">{transcript}</p>
                    </div>
                )}

                {aiResponse && (
                    <div className="bg-indigo-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-indigo-600">AI Twin responded:</p>
                            <button
                                onClick={() => speakText(aiResponse)}
                                className="text-sm px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                            >
                                🔊 Play
                            </button>
                        </div>
                        <p className="text-slate-800">{aiResponse}</p>
                    </div>
                )}
            </div>

            <div className="card">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Text-to-Speech Test</h3>
                <textarea
                    placeholder="Type text to hear your AI twin speak..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                    rows="4"
                    id="tts-input"
                />
                <button
                    onClick={() => {
                        const text = document.getElementById('tts-input').value;
                        if (text) speakText(text);
                    }}
                    className="btn-primary"
                >
                    🔊 Speak Text
                </button>
            </div>
        </div>
    );
}

function SettingsView() {
    const [gmailConnected, setGmailConnected] = useState(false);
    const [autoReply, setAutoReply] = useState(false);

    return (
        <div className="space-y-6">
            <div className="card">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Gmail Integration</h3>

                {!gmailConnected ? (
                    <div>
                        <p className="text-slate-600 mb-4">
                            Connect your Gmail account to automatically sync emails and enable auto-reply.
                        </p>
                        <button
                            onClick={() => alert('Gmail OAuth setup required. Please contact support for setup instructions.')}
                            className="btn-primary"
                        >
                            📧 Connect Gmail Account
                        </button>
                        <p className="text-xs text-slate-500 mt-2">
                            Note: Requires Google Cloud OAuth setup
                        </p>
                    </div>
                ) : (
                    <div>
                        <div className="flex items-center justify-between mb-4 p-4 bg-green-50 rounded-lg">
                            <div>
                                <p className="font-semibold text-green-800">✅ Gmail Connected</p>
                                <p className="text-sm text-green-600">your.email@gmail.com</p>
                            </div>
                            <button className="text-sm text-red-600 hover:text-red-700">
                                Disconnect
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-semibold text-slate-800">Auto-Reply</p>
                                <p className="text-sm text-slate-600">Automatically reply to emails using your AI twin</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={autoReply}
                                    onChange={(e) => setAutoReply(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </div>
                )}
            </div>

            <div className="card">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Preferences</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Default Response Mode
                        </label>
                        <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option>Hybrid (Review before sending)</option>
                            <option>Ghost (Always review)</option>
                            <option>Auto (Send automatically)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Default Tone Shift
                        </label>
                        <input
                            type="range"
                            min="-10"
                            max="10"
                            defaultValue="0"
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>More Casual</span>
                            <span>Neutral</span>
                            <span>More Formal</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LoginScreen({ onLogin, onSignup }) {
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSignup) {
            onSignup(email, password, name);
        } else {
            onLogin(email, password);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center p-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-white mb-2">
                        Antigravity Twin
                    </h1>
                    <p className="text-indigo-200">Your AI-powered digital persona</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignup && (
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                placeholder="Your name"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                    >
                        {isSignup ? 'Create Account' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsSignup(!isSignup)}
                        className="text-indigo-300 hover:text-indigo-200 text-sm"
                    >
                        {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                    </button>
                </div>
            </div>
        </div>
    );
}
