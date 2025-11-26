import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import PersonaIngestion from './components/PersonaIngestion';
import InboxManager from './components/InboxManager';
import ActivityPanel from './components/ActivityPanel';
import ChatInterface from './components/ChatInterface';
import ShortcutsHelp from './components/ShortcutsHelp';
import OnboardingTour from './components/OnboardingTour';
import PersonaSelector from './components/PersonaSelector';
import PersonaManagement from './components/PersonaManagement';
import { useDarkMode } from './hooks/useDarkMode';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useOnboarding } from './hooks/useOnboarding';
import api from './services/api';

export default function App() {
    const [user, setUser] = useState(null);
    const [persona, setPersona] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('chat');
    const [showShortcuts, setShowShortcuts] = useState(false);

    // Dark mode
    const { isDark, toggle: toggleDarkMode } = useDarkMode();

    // Onboarding tour
    const { run, stepIndex, handleJoyrideCallback, restartTour } = useOnboarding();

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

    const handlePersonaChange = (newPersona) => {
        setPersona(newPersona);
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
        return <LoginScreen onLogin={handleLogin} onSignup={handleSignup} isDark={isDark} />;
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 dark:bg-slate-950 text-white p-4 flex flex-col">
                {/* Logo */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Antigravity
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">Persona Replicator</p>
                </div>

                {/* Persona Selector */}
                <div className="mb-6" data-tour="persona-selector">
                    <PersonaSelector
                        activePersona={persona}
                        onPersonaChange={handlePersonaChange}
                    />
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-2">
                    <NavItem
                        data-tour="chat"
                        icon="💬"
                        label="Chat with Twin"
                        active={activeView === 'chat'}
                        onClick={() => setActiveView('chat')}
                    />
                    <NavItem
                        data-tour="train"
                        icon="🎓"
                        label="Train Persona"
                        active={activeView === 'train'}
                        onClick={() => setActiveView('train')}
                    />
                    <NavItem
                        data-tour="personas"
                        icon="👥"
                        label="Manage Personas"
                        active={activeView === 'personas'}
                        onClick={() => setActiveView('personas')}
                    />
                    <NavItem
                        data-tour="inbox"
                        icon="📧"
                        label="Inbox Manager"
                        active={activeView === 'inbox'}
                        onClick={() => setActiveView('inbox')}
                    />
                    <NavItem
                        data-tour="activity"
                        icon="📊"
                        label="Activity"
                        active={activeView === 'activity'}
                        onClick={() => setActiveView('activity')}
                    />
                </nav>

                {/* Settings */}
                <div className="border-t border-slate-800 pt-4 space-y-2">
                    <button
                        onClick={toggleDarkMode}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
                    >
                        <span>{isDark ? '☀️' : '🌙'}</span>
                        <span className="text-sm">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                    <button
                        onClick={() => setShowShortcuts(true)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
                    >
                        <span>⌨️</span>
                        <span className="text-sm">Shortcuts</span>
                    </button>
                    <button
                        onClick={restartTour}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
                    >
                        <span>🎯</span>
                        <span className="text-sm">Restart Tour</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-left text-red-400"
                    >
                        <span>🚪</span>
                        <span className="text-sm">Logout</span>
                    </button>
                </div>

                {/* User Info */}
                <div className="mt-4 pt-4 border-t border-slate-800">
                    <p className="text-sm text-slate-400 truncate">{user.email}</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8">
                <div className="max-w-6xl mx-auto">
                    {activeView === 'chat' && <ChatInterface persona={persona} />}
                    {activeView === 'train' && (
                        <PersonaIngestion persona={persona} onPersonaUpdate={setPersona} />
                    )}
                    {activeView === 'personas' && (
                        <PersonaManagement onPersonaChange={handlePersonaChange} />
                    )}
                    {activeView === 'inbox' && <InboxManager />}
                    {activeView === 'activity' && <ActivityPanel />}
                </div>
            </main>

            {/* Toast Notifications */}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: isDark ? '#1f2937' : '#fff',
                        color: isDark ? '#f3f4f6' : '#1f2937',
                    },
                    success: {
                        iconTheme: {
                            primary: '#10b981',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />

            {/* Onboarding Tour */}
            <OnboardingTour
                run={run}
                stepIndex={stepIndex}
                callback={handleJoyrideCallback}
            />

            {/* Shortcuts Help Modal */}
            <ShortcutsHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
        </div>
    );
}

function NavItem({ icon, label, active, onClick, ...props }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${active
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
            {...props}
        >
            <span className="text-xl">{icon}</span>
            <span className="text-sm font-medium">{label}</span>
        </button>
    );
}

function LoginScreen({ onLogin, onSignup, isDark }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isLogin) {
            onLogin(email, password);
        } else {
            onSignup(email, password, name);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Antigravity</h1>
                    <p className="text-indigo-300">Your AI Persona Replicator</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                                    required={!isLogin}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                        >
                            {isLogin ? 'Login' : 'Sign Up'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
