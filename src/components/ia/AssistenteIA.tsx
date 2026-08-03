import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, X, RotateCcw, ChevronDown } from 'lucide-react';
import { useIAStream, useIAFeedback } from '../../hooks/useIA';
import { useChatHistory } from '../../hooks/useChatHistory';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useAuth } from '../../contexts/AuthContext';
import { ChatBubble } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { cn } from '../../lib/utils';
import { logger } from '../../lib/logger';

const ROLES = ['ADMIN', 'RH', 'COORDENADOR', 'ENCARREGADO'];

const MAX_CONTEXTO_MSG = 10;
const ATRASO_REDIRECIONAMENTO_MS = 1500;

export function AssistenteIA() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [aberto, setAberto] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { mensagens, setMensagens, limparConversa } = useChatHistory();
  const { consultarStream, isPending } = useIAStream();
  const { mutateAsync: enviarFeedback } = useIAFeedback();
  
  useScrollLock(aberto, true);

  // Auto-scroll otimizado
  useEffect(() => {
    if (aberto && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [mensagens, aberto]);

  const onEnviar = useCallback(async (pergunta: string) => {
    if (!pergunta.trim() || isPending) return;
    
    abortControllerRef.current = new AbortController();
    const q = pergunta.trim();
    
    setMensagens(p => [...p, { id: crypto.randomUUID(), tipo: 'usuario', conteudo: q, timestamp: new Date() }]);

    // Formata o histórico exatamente como a API espera e limpa mensagens vazias/incompletas
    const historicoFormatado = mensagens
      .slice(-MAX_CONTEXTO_MSG)
      .filter(m => !m.isStreaming && m.conteudo.trim().length > 0)
      .map(m => ({ role: m.tipo === 'usuario' ? 'user' : 'model', text: m.conteudo }));

    await consultarStream(
      { 
        pergunta: q, 
        contextoSistema: `Rota: ${location.pathname}`, 
        historico: historicoFormatado, 
        signal: abortControllerRef.current.signal 
      },
      {
        onStart: (id) => setMensagens(p => [...p, { id, tipo: 'kia', conteudo: '', timestamp: new Date(), isStreaming: true }]),
        onChunk: (id, ck) => setMensagens(p => p.map(m => m.id === id ? { ...m, conteudo: m.conteudo + ck } : m)),
        onFinish: (id) => {
          setMensagens(p => p.map(m => {
            if (m.id !== id) return m;
            const route = m.conteudo.match(/\[NAVIGATE:([^\]]+)\]/i);
            if (route) setTimeout(() => { navigate(route[1].trim()); setAberto(false); }, ATRASO_REDIRECIONAMENTO_MS);
            return { ...m, isStreaming: false, conteudo: m.conteudo.replace(/\[NAVIGATE:.*?\]/i, '').trim() || 'Redirecionando...' };
          }));
        },
        onError: () => setMensagens(p => p.map(m => m.isStreaming ? { ...m, isStreaming: false, conteudo: 'Erro de conexão ou requisição cancelada.' } : m))
      }
    );
  }, [isPending, mensagens, consultarStream, location.pathname, navigate, setMensagens]);

  const onAbort = () => abortControllerRef.current?.abort();

  const handleFeedback = useCallback((msgId: string, avaliacao: 'positivo'|'negativo') => {
    const idx = mensagens.findIndex(m => m.id === msgId);
    if (idx > 0) enviarFeedback({ mensagemId: msgId, pergunta: mensagens[idx-1].conteudo, respostaIA: mensagens[idx].conteudo, avaliacao }).catch(e => logger.apiError(e));
  }, [mensagens, enviarFeedback]);

  if (!user || !ROLES.includes(user.role)) return null;

  return (
    <>
      <button onClick={() => setAberto(!aberto)} className="group flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-primary to-violet-600 text-white shadow-float w-full active:scale-95 transition-all z-50">
        <Sparkles className="w-5 h-5" /><span className="flex-1 text-left font-bold text-sm">Kia — IA da Frota</span><ChevronDown className={cn("w-4 h-4 transition-transform", aberto && "rotate-180")} />
      </button>

      {aberto && createPortal(
        <div className="fixed inset-0 z-[999999] pointer-events-none flex justify-end items-end sm:p-6">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm sm:hidden pointer-events-auto animate-in fade-in" onClick={() => setAberto(false)} />
          <div className="w-full h-[92dvh] sm:w-[420px] sm:h-[620px] bg-surface sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-6">
            
            <header className="flex items-center justify-between p-4 bg-primary/5 border-b border-border/60">
              <div className="flex items-center gap-3"><Sparkles className="w-5 h-5 text-primary" /><h3 className="font-bold text-sm">Kia Assistente</h3></div>
              <div className="flex gap-1">
                {mensagens.length > 0 && <button onClick={limparConversa} className="p-2 hover:bg-surface-hover rounded-xl"><RotateCcw className="w-4 h-4" /></button>}
                <button onClick={() => setAberto(false)} className="p-2 hover:bg-surface-hover rounded-xl"><X className="w-5 h-5" /></button>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
              {mensagens.map(msg => (
                <ChatBubble key={msg.id} msg={msg} userNome={user.nome} onFeedback={handleFeedback} loadingText="Analisando DB" />
              ))}
            </div>

            <ChatInput isPending={isPending} onSend={onEnviar} onAbort={onAbort} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}