import axios from 'axios';

// URL do Backend (Node.js) e não do Banco de Dados
export const api = axios.create({
    baseURL: 'http://localhost:3333/api',
});

// Interceptor para adicionar o Token automaticamente
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor para tratar sessão expirada
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn("Sessão expirada ou token inválido.");
        }
        return Promise.reject(error);
    }
);