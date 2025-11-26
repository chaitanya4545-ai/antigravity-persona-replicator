import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

const api = {
    // Auth
    login: async (email, password) => {
        const { data } = await apiClient.post('/auth/login', { email, password });
        return data;
    },

    signup: async (email, password, name) => {
        const { data } = await apiClient.post('/auth/signup', { email, password, name });
        return data;
    },

    getCurrentUser: async () => {
        const { data } = await apiClient.get('/auth/me');
        return data;
    },

    // Personas
    getPersona: async () => {
        const { data } = await apiClient.get('/personas/me');
        return data;
    },

    uploadSamples: async (files, onProgress) => {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));

        const { data } = await apiClient.post('/personas/ingest', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                if (onProgress) onProgress(percentCompleted);
            },
        });
        return data;
    },

    retrainPersona: async () => {
        const { data } = await apiClient.post('/personas/retrain');
        return data;
    },

    // Messages
    getInbox: async () => {
        const { data } = await apiClient.get('/messages/inbox');
        return data;
    },

    generateReply: async (messageId, mode, toneShift, riskTolerance) => {
        const { data } = await apiClient.post(`/messages/${messageId}/generate`, {
            mode,
            toneShift,
            riskTolerance,
        });
        return data;
    },

    sendMessage: async (messageId, content) => {
        const { data } = await apiClient.post(`/messages/${messageId}/send`, { content });
        return data;
    },

    // Activity
    getActivity: async () => {
        const { data } = await apiClient.get('/activity');
        return data;
    },

    getMetrics: async () => {
        const { data } = await apiClient.get('/metrics');
        return data;
    },

    // Chat
    sendChatMessage: async (message) => {
        const { data } = await apiClient.post('/chat/message', { message });
        return data;
    },

    getChatHistory: async (limit = 50) => {
        const { data } = await apiClient.get(`/chat/history?limit=${limit}`);
        return data;
    },

    clearChatHistory: async () => {
        const { data } = await apiClient.delete('/chat/clear');
        return data;
    },
};

export default api;
