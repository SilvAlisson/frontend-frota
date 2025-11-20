import axios from 'axios';
import { RENDER_API_BASE_URL } from '../config';

// Cria a instância do Axios com a URL base
export const api = axios.create({
  baseURL: RENDER_API_BASE_URL,
});

// Interceptor de Requisição
// Antes de cada pedido sair do frontend, este código corre automaticamente.
api.interceptors.request.use((config) => {
  // Tenta recuperar o token salvo no navegador
  const token = localStorage.getItem('authToken');
  
  // Se existir um token, adiciona-o ao cabeçalho Authorization
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor de Resposta (Opcional, mas recomendado)
// Útil para lidar com sessões expiradas globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Se a API retornar 401 (Não Autorizado), significa que o token é inválido ou expirou
    if (error.response && error.response.status === 401) {
      // Podemos limpar o localStorage e forçar logout, se desejado
      // localStorage.clear();
      // window.location.href = '/login'; // Redirecionamento forçado (opcional)
    }
    return Promise.reject(error);
  }
);