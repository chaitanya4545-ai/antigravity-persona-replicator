import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function PersonaManagement({ onPersonaChange }) {
    const [personas, setPersonas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPersona, setEditingPersona] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#4f46e5'
    });

    const colorOptions = [
        { name: 'Indigo', value: '#4f46e5' },
        { name: 'Purple', value: '#9333ea' },
        { name: 'Pink', value: '#ec4899' },
        { name: 'Red', value: '#ef4444' },
        { name: 'Orange', value: '#f97316' },
        { name: 'Yellow', value: '#eab308' },
        { name: 'Green', value: '#22c55e' },
        { name: 'Teal', value: '#14b8a6' },
        { name: 'Blue', value: '#3b82f6' },
        { name: 'Slate', value: '#64748b' },
    ];

    useEffect(() => {
        loadPersonas();
    }, []);

    const loadPersonas = async () => {
        try {
            const data = await api.getAllPersonas();
            setPersonas(data);
        } catch (error) {
            toast.error('Failed to load personas');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Persona name is required');
            return;
        }

        try {
            await api.createPersona(formData.name, formData.description, formData.color);
            toast.success('Persona created successfully!');
            setShowCreateModal(false);
            setFormData({ name: '', description: '', color: '#4f46e5' });
            loadPersonas();
        } catch (error) {
            toast.error('Failed to create persona');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        if (!editingPersona) return;

        try {
            await api.updatePersona(editingPersona.id, formData);
            toast.success('Persona updated successfully!');
            setEditingPersona(null);
            setFormData({ name: '', description: '', color: '#4f46e5' });
            loadPersonas();
        } catch (error) {
            toast.error('Failed to update persona');
        }
    };

    const handleDelete = async (persona) => {
        if (!confirm(`Are you sure you want to delete "${persona.name}"?`)) {
            return;
        }

        try {
            await api.deletePersona(persona.id);
            toast.success('Persona deleted successfully!');
            loadPersonas();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to delete persona');
        }
    };

    const handleActivate = async (persona) => {
        try {
            await api.activatePersona(persona.id);
            toast.success(`Activated ${persona.name}`);
            loadPersonas();
            onPersonaChange(persona);
        } catch (error) {
            toast.error('Failed to activate persona');
        }
    };

    const openEditModal = (persona) => {
        setEditingPersona(persona);
        setFormData({
            name: persona.name,
            description: persona.description || '',
            color: persona.color || '#4f46e5'
        });
    };

    const closeModal = () => {
        setShowCreateModal(false);
        setEditingPersona(null);
        setFormData({ name: '', description: '', color: '#4f46e5' });
    };

    if (loading) {
        return <div className="text-center py-8">Loading personas...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Manage Personas</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Create and manage multiple AI personas with different personalities
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary"
                >
                    + Create Persona
                </button>
            </div>

            {/* Personas List */}
            <div className="grid gap-4">
                {personas.map((persona) => (
                    <div
                        key={persona.id}
                        className={`card ${persona.is_active ? 'ring-2 ring-indigo-500' : ''}`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                                <div
                                    className="w-12 h-12 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: persona.color }}
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                            {persona.name}
                                        </h3>
                                        {persona.is_active && (
                                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium rounded">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    {persona.description && (
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                            {persona.description}
                                        </p>
                                    )}
                                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                                        Created {new Date(persona.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {!persona.is_active && (
                                    <button
                                        onClick={() => handleActivate(persona)}
                                        className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800 text-sm font-medium"
                                    >
                                        Set Active
                                    </button>
                                )}
                                <button
                                    onClick={() => openEditModal(persona)}
                                    className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-sm font-medium"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(persona)}
                                    className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 text-sm font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {personas.length === 0 && (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                        <div className="text-6xl mb-4">👤</div>
                        <p className="text-lg font-medium">No personas yet</p>
                        <p className="text-sm mt-2">Create your first persona to get started</p>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {(showCreateModal || editingPersona) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                            {editingPersona ? 'Edit Persona' : 'Create New Persona'}
                        </h3>

                        <form onSubmit={editingPersona ? handleUpdate : handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Work Persona, Creative Writer"
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="e.g., Professional writing style for work emails"
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white resize-none"
                                    rows="3"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Color
                                </label>
                                <div className="grid grid-cols-5 gap-2">
                                    {colorOptions.map((color) => (
                                        <button
                                            key={color.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color: color.value })}
                                            className={`w-full h-10 rounded-lg transition-all ${formData.color === color.value
                                                    ? 'ring-2 ring-offset-2 ring-indigo-500'
                                                    : 'hover:scale-110'
                                                }`}
                                            style={{ backgroundColor: color.value }}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 btn-primary"
                                >
                                    {editingPersona ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
