import React, { useState, useEffect } from 'react';
import PersonaIngestion from './components/PersonaIngestion';
import InboxManager from './components/InboxManager';
import ActivityPanel from './components/ActivityPanel';
import api from './services/api';

export default function App() {
    const [user, setUser] = useState(null);
    const [persona, setPersona] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in
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

            // Load persona if exists
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50">
            <div className="max-w-7xl mx-auto p-6">
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Antigravity // Twin
                        </h1>
                        <p className="text-sm text-slate-600 mt-1">
                            AI-powered persona replicator for seamless communication
                        </p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <div className="text-sm text-slate-700">
                            Welcome, <span className="font-semibold">{user.name || user.email}</span>
                        </div>
                        <button onClick={handleLogout} className="btn-secondary">
                            Logout
                        </button>
                    </div>
                </header>

                <main className="grid grid-cols-12 gap-6">
                    {/* Left: Persona Ingestion */}
                    <section className="col-span-4">
                        <PersonaIngestion persona={persona} onPersonaUpdate={setPersona} />
                    </section>

                    {/* Center: Inbox & Reply Generation */}
                    <section className="col-span-5">
                        <InboxManager persona={persona} />
                    </section>

                    {/* Right: Activity & Safety */}
                    <aside className="col-span-3">
                        <ActivityPanel />
                    </aside>
                </main>

                <footer className="mt-8 text-center text-xs text-slate-500">
                    v1.0 — Email-first MVP • Powered by AI
                </footer>
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
