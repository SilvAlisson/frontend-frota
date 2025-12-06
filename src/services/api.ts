import axios from 'axios';
import { RENDER_API_BASE_URL } from '../config';

// Cria a instância do Axios com a URL base
export const api = axios.create({
  baseURL: RENDER_API_BASE_URL,
});

// Interceptor de Requisição
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor de Resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Se a API retornar 401 (Não Autorizado)
    if (error.response && error.response.status === 401) {
      
      // Limpa os dados locais
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');


      if (window.location.pathname !== '/login') {
          window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);