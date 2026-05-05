import axios from 'axios';
import { toast } from 'sonner';
import type { CustomAxiosError } from '../services/api';

/**
 * Analisa um erro (da API ou Javascript) e retorna uma mensagem amigável.
 * Também dispara um toast de notificação automaticamente.
 */
export function handleApiError(error: unknown, defaultMessage = 'Ocorreu um erro inesperado.'): string {
    let message = defaultMessage;
    let description = '';

    if (axios.isAxiosError(error)) {
        const responseData = error.response?.data as { error?: string, message?: string } | undefined;

        // 1. Prioridade: Mensagem explícita enviada pelo nosso Backend
        if (responseData?.error) {
            message = responseData.error;
        }
        else if (responseData?.message) {
            message = responseData.message;
        }
        // 2. Fallbacks baseados no Status HTTP
        else if (error.response) {
            switch (error.response.status) {
                case 400:
                    message = 'Requisição inválida. Verifique os dados enviados.';
                    break;
                case 401:
                    message = 'Sessão expirada.';
                    description = 'Por favor, faça login novamente.';
                    break;
                case 403:
                    message = 'Acesso negado.';
                    description = 'Você não tem permissão para realizar esta ação.';
                    break;
                case 404:
                    message = 'Recurso não encontrado.';
                    break;
                case 422:
                    message = 'Erro de validação.';
                    description = 'Verifique os campos preenchidos.';
                    break;
                case 429:
                    message = 'Muitas requisições.';
                    description = 'Aguarde um momento e tente novamente.';
                    break;
                case 500:
                    message = 'Erro interno do servidor.';
                    description = 'A equipe técnica já foi notificada.';
                    break;
                default:
                    message = `Erro desconhecido (${error.response.status})`;
            }
        }
        // 3. Erros de Rede (Offline, DNS, Timeout)
        else if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
            message = 'Sem conexão com o servidor.';
            description = 'Verifique sua internet e tente novamente.';
        }
    }
    else if (error instanceof Error) {
        //  Uso de import.meta.env.DEV (padrão Vite) em vez de process.env
        if (import.meta.env.DEV) {
            console.error('[Non-Axios Error]', error);
        }
        // message = error.message; // Opcional
    }

    // Dispara o Toast Visual apenas se não tiver sido tratado pelo Interceptor da API
    if (!(error as CustomAxiosError)?._toastHandled) {
        toast.error(message, {
            description: description || undefined,
            duration: 5000,
        });
    }

    return message;
}

/**
 * 🕵️ PASSO 2: Extrator de Contexto Rico (Device & Environment)
 * Captura dados do dispositivo do usuário para enriquecer os logs de auditoria
 * simulando o comportamento de ferramentas como o Sentry.
 */
export const getDeviceContext = () => {
    return {
        _navegador: navigator.userAgent,
        _urlAtual: window.location.href,
        _resolucao: `${window.innerWidth}x${window.innerHeight}`,
        _idioma: navigator.language,
        _plataforma: navigator.platform,
        // Pegamos o tipo de conexão (ex: 3g, 4g, wifi) se o navegador suportar (Android/Chrome)
        _conexao: (navigator as any).connection?.effectiveType || 'Desconhecida',
        _horaLocal: new Date().toLocaleTimeString()
    };
};