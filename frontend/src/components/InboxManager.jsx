import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import './InboxManager.css';

const InboxManager = () => {
    const [account, setAccount] = useState(null);
    const [emails, setEmails] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [reply, setReply] = useState(null);
    const [loading, setLoading] = useState(false);
    const [connecting, setConnecting] = useState(false);

    useEffect(() => {
        loadAccount();
    }, []);

    useEffect(() => {
        if (account) {
            loadInbox();
        }
    }, [account]);

    const loadAccount = async () => {
        try {
            const data = await api.getEmailAccount();
            setAccount(data.account);
        } catch (error) {
            console.error('Error loading account:', error);
        }
    };

    const handleConnectGmail = async () => {
        try {
            setConnecting(true);
            const { authUrl } = await api.getEmailAuthUrl();

            // Open OAuth popup
            const width = 600;
            const height = 700;
            const left = window.screen.width / 2 - width / 2;
            const top = window.screen.height / 2 - height / 2;

            const popup = window.open(
                authUrl,
                'Gmail OAuth',
                `width=${width},height=${height},left=${left},top=${top}`
            );

            // Listen for OAuth callback
            const handleMessage = async (event) => {
                if (event.data.type === 'gmail-auth-success') {
                    const { code } = event.data;
                    try {
                        await api.emailAuthCallback(code);
                        toast.success('Gmail connected successfully!');
                        loadAccount();
                        popup.close();
                    } catch (error) {
                        toast.error('Failed to connect Gmail');
                    } finally {
                        setConnecting(false);
                        window.removeEventListener('message', handleMessage);
                    }
                }
            };

            window.addEventListener('message', handleMessage);

            // Check if popup was closed
            const checkClosed = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkClosed);
                    setConnecting(false);
                    window.removeEventListener('message', handleMessage);
                }
            }, 1000);
        } catch (error) {
            console.error('Error connecting Gmail:', error);
            toast.error('Failed to initiate Gmail connection');
            setConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect your Gmail account?')) return;

        try {
            await api.disconnectEmail();
            setAccount(null);
            setEmails([]);
            setSelectedEmail(null);
            setReply(null);
            toast.success('Gmail disconnected');
        } catch (error) {
            toast.error('Failed to disconnect Gmail');
        }
    };

    const loadInbox = async () => {
        try {
            setLoading(true);
            const data = await api.getInbox();
            setEmails(data.messages || []);
        } catch (error) {
            console.error('Error loading inbox:', error);
            toast.error('Failed to load inbox');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectEmail = (email) => {
        setSelectedEmail(email);
        setReply(null);
    };

    const handleGenerateReply = async () => {
        if (!selectedEmail) return;

        try {
            setLoading(true);
            const data = await api.generateEmailReply(selectedEmail.message_id);
            setReply(data.reply);
            toast.success('Reply generated!');
        } catch (error) {
            console.error('Error generating reply:', error);
            toast.error(error.response?.data?.error || 'Failed to generate reply');
        } finally {
            setLoading(false);
        }
    };

    const handleSendReply = async () => {
        if (!reply) return;

        try {
            setLoading(true);
            await api.sendEmailReply(reply.id);
            toast.success('Reply sent!');
            setReply(null);
            setSelectedEmail(null);
            loadInbox();
        } catch (error) {
            console.error('Error sending reply:', error);
            toast.error('Failed to send reply');
        } finally {
            setLoading(false);
        }
    };

    if (!account) {
        return (
            <div className="inbox-manager">
                <div className="email-connect-prompt">
                    <h2>📧 Connect Your Gmail</h2>
                    <p>Connect your Gmail account to start using the AI-powered email assistant.</p>
                    <div className="connect-benefits">
                        <div className="benefit">
                            <span className="icon">✨</span>
                            <span>AI-generated replies using your persona</span>
                        </div>
                        <div className="benefit">
                            <span className="icon">⚡</span>
                            <span>Automatic email processing</span>
                        </div>
                        <div className="benefit">
                            <span className="icon">🔒</span>
                            <span>Secure OAuth authentication</span>
                        </div>
                    </div>
                    <button
                        className="btn-primary btn-connect"
                        onClick={handleConnectGmail}
                        disabled={connecting}
                    >
                        {connecting ? 'Connecting...' : 'Connect Gmail'}
                    </button>
                    <p className="privacy-note">
                        Your credentials are stored securely. You can disconnect anytime.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="inbox-manager">
            <div className="inbox-header">
                <div className="account-info">
                    <h2>📧 Inbox Manager</h2>
                    <p className="connected-email">
                        <span className="status-dot"></span>
                        {account.email_address}
                    </p>
                </div>
                <div className="inbox-actions">
                    <button className="btn-secondary" onClick={loadInbox} disabled={loading}>
                        {loading ? 'Refreshing...' : '🔄 Refresh'}
                    </button>
                    <button className="btn-danger" onClick={handleDisconnect}>
                        Disconnect
                    </button>
                </div>
            </div>

            <div className="inbox-content">
                <div className="email-list">
                    <h3>Unread Emails ({emails.length})</h3>
                    {loading && <div className="loading">Loading...</div>}
                    {!loading && emails.length === 0 && (
                        <div className="empty-state">
                            <p>📭 No unread emails</p>
                        </div>
                    )}
                    {emails.map((email) => (
                        <div
                            key={email.message_id}
                            className={`email-item ${selectedEmail?.message_id === email.message_id ? 'selected' : ''}`}
                            onClick={() => handleSelectEmail(email)}
                        >
                            <div className="email-from">{email.from_name || email.from_email}</div>
                            <div className="email-subject">{email.subject}</div>
                            <div className="email-snippet">{email.snippet}</div>
                            <div className="email-date">
                                {new Date(email.received_at).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>

                {selectedEmail && (
                    <div className="email-preview">
                        <div className="email-header">
                            <h3>{selectedEmail.subject}</h3>
                            <p className="email-meta">
                                From: {selectedEmail.from_email}<br />
                                Date: {new Date(selectedEmail.received_at).toLocaleString()}
                            </p>
                        </div>
                        <div className="email-body">
                            {selectedEmail.body}
                        </div>
                        {!reply && (
                            <button
                                className="btn-primary"
                                onClick={handleGenerateReply}
                                disabled={loading}
                            >
                                {loading ? 'Generating...' : '✨ Generate AI Reply'}
                            </button>
                        )}
                    </div>
                )}

                {reply && (
                    <div className="reply-draft">
                        <h3>✨ AI-Generated Reply</h3>
                        <div className="reply-confidence">
                            Confidence: {reply.confidence}% • {reply.rationale}
                        </div>
                        <div style={{ position: 'relative' }}>
                            <textarea
                                className="reply-text"
                                value={reply.text}
                                onChange={(e) => setReply({ ...reply, text: e.target.value })}
                                rows={10}
                                placeholder="Edit your reply here..."
                            />
                            <div style={{
                                position: 'absolute',
                                bottom: '8px',
                                right: '8px',
                                fontSize: '12px',
                                color: '#888',
                                background: 'rgba(255,255,255,0.9)',
                                padding: '2px 6px',
                                borderRadius: '4px'
                            }}>
                                {reply.text.length} characters
                            </div>
                        </div>
                        <div className="reply-actions">
                            <button
                                className="btn-primary"
                                onClick={handleSendReply}
                                disabled={loading || !reply.text.trim()}
                            >
                                {loading ? 'Sending...' : '📤 Send Reply'}
                            </button>
                            <button
                                className="btn-secondary"
                                onClick={() => setReply(null)}
                            >
                                🗑️ Discard
                            </button>
                            <button
                                className="btn-secondary"
                                onClick={handleGenerateReply}
                                disabled={loading}
                            >
                                🔄 Regenerate
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default InboxManager;
