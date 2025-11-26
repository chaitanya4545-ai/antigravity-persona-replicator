import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function PersonaSelector({ activePersona, onPersonaChange }) {
    const [personas, setPersonas] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        loadPersonas();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadPersonas = async () => {
        try {
            const data = await api.getAllPersonas();
            setPersonas(data);
        } catch (error) {
            console.error('Failed to load personas:', error);
        }
    };

    const handleSwitch = async (persona) => {
        try {
            await api.activatePersona(persona.id);
            onPersonaChange(persona);
            setShowDropdown(false);
            toast.success(`Switched to ${persona.name}`);
        } catch (error) {
            toast.error('Failed to switch persona');
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full flex items-center justify-between p-3 bg-slate-800 dark:bg-slate-900 hover:bg-slate-700 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: activePersona?.color || '#4f46e5' }}
                    />
                    <div className="text-left">
                        <p className="font-medium text-white">{activePersona?.name || 'Select Persona'}</p>
                        {activePersona?.description && (
                            <p className="text-xs text-slate-400 truncate max-w-[150px]">
                                {activePersona.description}
                            </p>
                        )}
                    </div>
                </div>
                <span className="text-slate-400">{showDropdown ? '▲' : '▼'}</span>
            </button>

            {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 dark:bg-slate-900 rounded-lg shadow-xl z-50 border border-slate-700 dark:border-slate-600 max-h-[300px] overflow-y-auto">
                    {personas.length === 0 ? (
                        <div className="p-4 text-center text-slate-400">
                            No personas found
                        </div>
                    ) : (
                        personas.map((persona) => (
                            <button
                                key={persona.id}
                                onClick={() => handleSwitch(persona)}
                                className={`w-full flex items-center gap-3 p-3 hover:bg-slate-700 dark:hover:bg-slate-800 transition-colors ${persona.id === activePersona?.id ? 'bg-slate-700 dark:bg-slate-800' : ''
                                    }`}
                            >
                                <div
                                    className="w-4 h-4 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: persona.color }}
                                />
                                <div className="text-left flex-1">
                                    <p className="font-medium text-white">{persona.name}</p>
                                    {persona.description && (
                                        <p className="text-xs text-slate-400">{persona.description}</p>
                                    )}
                                </div>
                                {persona.id === activePersona?.id && (
                                    <span className="text-green-400">✓</span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
