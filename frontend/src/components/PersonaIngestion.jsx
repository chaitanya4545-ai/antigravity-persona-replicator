import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import api from '../services/api';
import { downloadFile } from '../utils/download';

export default function PersonaIngestion({ persona, onPersonaUpdate }) {
    const [uploads, setUploads] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [retraining, setRetraining] = useState(false);

    const handleFileDrop = async (acceptedFiles) => {
        if (acceptedFiles.length === 0) {
            toast.error('Please select valid files');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            const toastId = toast.loading('Uploading files...');
            const result = await api.uploadSamples(acceptedFiles, setUploadProgress);
            setUploads((prev) => [...result.samples, ...prev]);

            toast.success(`Successfully uploaded ${acceptedFiles.length} file(s)!`, { id: toastId });

            // Refresh persona data
            const updatedPersona = await api.getPersona();
            onPersonaUpdate(updatedPersona);
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(`Upload failed: ${error.response?.data?.error || error.message}`);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: handleFileDrop,
        accept: {
            'text/plain': ['.txt'],
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'audio/mpeg': ['.mp3'],
            'audio/wav': ['.wav'],
            'audio/x-m4a': ['.m4a'],
            'message/rfc822': ['.eml']
        },
        multiple: true,
        disabled: uploading
    });

    const handleRetrain = async () => {
        setRetraining(true);
        try {
            const toastId = toast.loading('Retraining your AI twin...');
            const result = await api.retrainPersona();
            toast.success('Persona retrained successfully!', { id: toastId });
            onPersonaUpdate(result.persona);
        } catch (error) {
            console.error('Retrain error:', error);
            toast.error(`Retrain failed: ${error.response?.data?.error || error.message}`);
        } finally {
            setRetraining(false);
        }
    };

    const handleExportPersona = async () => {
        try {
            const blob = await api.exportPersona();
            const filename = `persona-data-${new Date().toISOString().split('T')[0]}.json`;
            downloadFile(blob, filename);
            toast.success('Persona data exported!');
        } catch (error) {
            toast.error('Export failed');
        }
    };

    return (
        <div className="space-y-6">
            {/* Upload Area */}
            <div className="card">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Upload Training Samples</h3>

                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500'
                        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <input {...getInputProps()} />
                    <div className="text-6xl mb-4">📁</div>
                    {isDragActive ? (
                        <p className="text-lg font-medium text-indigo-600 dark:text-indigo-400">Drop the files here...</p>
                    ) : (
                        <>
                            <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Drag & drop files here, or click to select
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Supported: .txt, .pdf, .docx, .mp3, .wav, .m4a, .eml
                            </p>
                        </>
                    )}
                </div>

                {uploading && (
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Uploading...</span>
                            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Persona Snapshot */}
            {persona && (
                <div className="card">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Persona Snapshot</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Name:</span>
                            <span className="font-medium text-slate-800 dark:text-slate-100">{persona.name || 'Your Persona'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Samples:</span>
                            <span className="font-medium text-slate-800 dark:text-slate-100">{persona.sample_count || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Last Updated:</span>
                            <span className="font-medium text-slate-800 dark:text-slate-100">
                                {persona.updated_at ? new Date(persona.updated_at).toLocaleDateString() : 'Never'}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleRetrain}
                            disabled={retraining}
                            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {retraining ? '⏳ Retraining...' : '🔄 Retrain Twin'}
                        </button>
                        <button
                            onClick={handleExportPersona}
                            className="flex-1 py-2 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors"
                        >
                            📥 Export Data
                        </button>
                    </div>
                </div>
            )}

            {/* Upload History */}
            {uploads.length > 0 && (
                <div className="card">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Recent Uploads</h3>
                    <div className="space-y-2">
                        {uploads.slice(0, 5).map((upload, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-slate-100">{upload.filename}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {new Date(upload.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <span className="text-green-600 dark:text-green-400">✓</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
