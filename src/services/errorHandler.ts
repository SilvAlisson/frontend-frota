/**
 * O-01: Serviço centralizado de tratamento de erros de API.
 * Elimina a duplicação de `handleApiError` em 5+ hooks.
 * Baseado em: clean-code (DRY), 007 (fail-secure messaging).
 */
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import type { CustomAxiosError } from '../services/api'; // Ajuste o caminho se necessário

/**
 * Trata erros de API de forma padronizada e amigável.
 * Mostra Toast de erro para o usuário e loga tecnicamente no console.
 *
 * @param error - Erro capturado (unknown)
 * @param mensagemPadrao - Mensagem de fallback em português
 */
export const handleApiError = (error: unknown, mensagemPadrao: string): void => {
  console.error(`[API Error] ${mensagemPadrao}:`, error);

  if ((error as CustomAxiosError)?._toastHandled) {
    return;
  }

  if (isAxiosError(error)) {
    // Erro com resposta do servidor (4xx, 5xx)
    const mensagemServidor =
      error.response?.data?.error || error.response?.data?.message;
    if (mensagemServidor && typeof mensagemServidor === 'string') {
      toast.error(mensagemServidor);
      return;
    }

    // Sem conexão de rede
    if (error.code === 'ERR_NETWORK') {
      toast.error('Sem conexão de rede. Verifique sua internet e tente novamente.');
      return;
    }
  }

  // Fallback genérico
  toast.error(mensagemPadrao);
};

/**
 * 🕵️ Extrator de Contexto Rico (Device & Environment)
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