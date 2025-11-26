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
    // Se a API retornar 401 (Não Autorizado), significa que o token é inválido ou expirou
    if (error.response && error.response.status === 401) {
      // Limpa o armazenamento local para evitar loops e remove dados obsoletos
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');

      // Força o redirecionamento para o login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);