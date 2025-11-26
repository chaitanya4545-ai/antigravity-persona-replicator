import React, { useState } from 'react';
import api from '../services/api';

export default function PersonaIngestion({ persona, onPersonaUpdate }) {
    const [uploads, setUploads] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [retraining, setRetraining] = useState(false);

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        setUploadProgress(0);

        try {
            const result = await api.uploadSamples(files, setUploadProgress);
            setUploads((prev) => [...result.samples, ...prev]);

            // Show success message
            showNotification('success', `Successfully uploaded ${files.length} file(s)!`);

            // Refresh persona data
            const updatedPersona = await api.getPersona();
            onPersonaUpdate(updatedPersona);
        } catch (error) {
            console.error('Upload error:', error);
            showNotification('error', 'Upload failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleRetrain = async () => {
        if (!confirm('Retrain your persona? This may take a few minutes.')) return;

        setRetraining(true);
        try {
            const result = await api.retrainPersona();
            onPersonaUpdate(result.persona);
            showNotification('success', 'Persona retrained successfully! Your AI twin has learned from your samples.');
        } catch (error) {
            console.error('Retrain error:', error);
            showNotification('error', 'Retrain failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setRetraining(false);
        }
    };

    const showNotification = (type, message) => {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg text-white z-50 transition-all ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
            }`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    };

    return (
        <div className="card">
            <h2 className="text-xl font-bold mb-4 text-slate-800">Persona Ingestion</h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Upload writing & voice samples
                    </label>
                    <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        disabled={uploading}
                        accept=".txt,.docx,.pdf,.mp3,.wav,.m4a,.eml"
                        className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100
              disabled:opacity-50"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                        Accepted: emails (.eml), documents (.txt, .docx, .pdf), audio (.mp3, .wav, .m4a)
                    </p>
                </div>

                {uploading && (
                    <div className="bg-indigo-50 rounded-lg p-3">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-indigo-700 font-medium">Uploading...</span>
                            <span className="text-indigo-600">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-indigo-200 rounded-full h-2">
                            <div
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="mt-4">
                    <h3 className="font-semibold text-slate-800 mb-2">Uploaded Samples</h3>
                    <div className="bg-slate-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                        {uploads.length === 0 && (
                            <p className="text-sm text-slate-400">No files uploaded yet</p>
                        )}
                        <ul className="space-y-2">
                            {uploads.map((upload, i) => (
                                <li key={i} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-700 truncate">{upload.name}</span>
                                    <span className="text-xs text-slate-400 ml-2">
                                        {upload.size ? `${Math.round(upload.size / 1024)} KB` : ''}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100">
                    <h3 className="font-semibold text-slate-800 mb-3">Persona Snapshot</h3>
                    {persona ? (
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-600">Tone:</span>
                                <span className="font-semibold text-slate-800">
                                    {persona.metadata?.tone || 'Direct, professional'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Risk Level:</span>
                                <span className="font-semibold text-slate-800">
                                    {persona.metadata?.riskLevel || 'Medium'}
                                </span>
                            </div>
                            <div className="mt-2">
                                <span className="text-slate-600">Common phrases:</span>
                                <p className="text-slate-700 italic mt-1">
                                    {persona.metadata?.commonPhrases?.join(', ') || '"Let\'s sync up", "Moving forward"'}
                                </p>
                            </div>
                            <div className="mt-2 text-xs text-slate-500">
                                Last trained: {persona.updatedAt ? new Date(persona.updatedAt).toLocaleDateString() : 'Never'}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">Upload samples to create your persona</p>
                    )}
                </div>

                <button
                    onClick={handleRetrain}
                    disabled={retraining || uploads.length === 0}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {retraining ? 'Retraining...' : 'Retrain Twin'}
                </button>
            </div>
        </div>
    );
}
