import axios from 'axios';
import { toast } from 'sonner';

/**
 * Trata o erro e retorna uma mensagem amigável.
 * Opcionalmente dispara logo o toast.
 */
export const handleApiError = (error: unknown, customMessage = 'Ocorreu um erro inesperado.') => {
    let message = customMessage;

    if (axios.isAxiosError(error)) {
        // 1. Tenta pegar a mensagem específica enviada pelo backend
        if (error.response?.data?.error) {
            message = error.response.data.error;
        }
        // 2. Fallbacks para códigos HTTP comuns
        else if (error.response?.status === 401) {
            message = 'Sessão expirada. Por favor faça login novamente.';
        } else if (error.response?.status === 403) {
            message = 'Você não tem permissão para realizar esta ação.';
        } else if (error.response?.status === 404) {
            message = 'Recurso não encontrado no servidor.';
        } else if (error.response?.status === 500) {
            message = 'Erro interno do servidor. Tente mais tarde.';
        } else if (error.code === 'ERR_NETWORK') {
            message = 'Falha na conexão. Verifique sua internet.';
        }
    } else if (error instanceof Error) {
        message = error.message;
    }

    // Dispara o toast de erro automaticamente
    toast.error('Erro', {
        description: message,
    });

    // Retorna a mensagem caso o componente precise dela para outro fim
    return message;
};