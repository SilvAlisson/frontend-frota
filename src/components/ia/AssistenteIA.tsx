import React, { useState, useRef, useEffect, useCallback, useMemo, useId } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, X, Send, Loader2, RotateCcw, ChevronDown, AlertCircle, Copy, ThumbsUp, ThumbsDown, Check, CarFront } from 'lucide-react';
import { useIAStream, type MensagemChat } from '../../hooks/useIA'; // 👈 Atualizado para o novo hook
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

const ROLES_PERMITIDOS = ['ADMIN', 'RH', 'COORDENADOR', 'ENCARREGADO'];

// --- UTILITÁRIOS ---
const getLoadingMessages = (pergunta: string) => {
  const p = pergunta.toLowerCase();
  if (p.match(/defeito|manuten|quebra|peça|oficina|pneu|óleo/)) return ['Buscando histórico de OS...', 'Analisando defeitos...', 'Calculando custos mecânicos...', 'Sintetizando...'];
  if (p.match(/abastecimento|combust|litro|km|gasto|diesel|gasolina/)) return ['Analisando abastecimentos...', 'Calculando KM/L...', 'Cruzando rotas...', 'Consolidando gastos...'];
  if (p.match(/treinamento|venc|documento|cnh|sst|operador/)) return ['Acessando matriz de documentos...', 'Verificando validades...', 'Analisando SST...', 'Sintetizando status...'];
  return ['Analisando banco de dados...', 'Cruzando métricas...', 'Inspecionando transações...', 'Estruturando resposta...'];
};

// --- COMPONENTES VISUAIS (WIDGETS) ---
const WidgetVeiculo = ({ placa }: { placa: string }) => {
  const navigate = useNavigate();
  return (
    <div 
      onClick={() => navigate(`/veiculos/${placa}`)}
      className="mt-3 mb-3 p-3.5 bg-surface-hover border border-border/80 rounded-xl flex items-center gap-4 shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]"
    >
      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
        <CarFront className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm text-text-main uppercase tracking-wider">{placa}</h4>
        <p className="text-[11px] text-text-muted truncate">Clique para abrir o dossiê completo</p>
      </div>
      <div className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shrink-0 pr-1">
        Abrir &rarr;
      </div>
    </div>
  );
};

// --- COMPONENTES FILHOS ---
const MdText = React.memo(({ texto }: { texto: string }) => {
  // Primeiro, separamos o texto por Widgets Visuais
  const blocos = texto.split(/(\[WIDGET:VEICULO:[^\]]+\])/g);

  return (
    <div className="space-y-1.5 text-sm leading-relaxed whitespace-pre-wrap word-break relative">
      {blocos.map((bloco, idx) => {
        // Se for um Widget, renderizamos o Cartão
        if (bloco.startsWith('[WIDGET:VEICULO:')) {
          const placa = bloco.replace('[WIDGET:VEICULO:', '').replace(']', '');
          return <WidgetVeiculo key={`widget-${idx}`} placa={placa} />;
        }
        if (!bloco.trim()) return null;

        // Processamento padrão de Markdown (Negrito e Bullets)
        const linhas = bloco.split('\n');
        return (
          <React.Fragment key={`text-block-${idx}`}>
            {linhas.map((linha, i) => {
              if (!linha.trim()) return <br key={`br-${i}`} className="select-none" />;
              const isBullet = linha.trim().startsWith('* ') || linha.trim().startsWith('- ') || linha.trim().startsWith('• ');
              const cleanLinha = isBullet ? linha.trim().slice(2) : linha;
              
              const partes = cleanLinha.split(/(\*\*[^*]+\*\*)/g);
              const renderizado = partes.map((p, j) =>
                p.startsWith('**') && p.endsWith('**') ? (
                  <strong key={j} className="font-bold text-text-main">{p.slice(2, -2)}</strong>
                ) : (
                  <span key={j}>{p}</span>
                )
              );

              if (isBullet) {
                return (
                  <div key={`line-${i}`} className="flex gap-2 items-start pl-1">
                    <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-primary/80 shrink-0" aria-hidden="true" />
                    <span>{renderizado}</span>
                  </div>
                );
              }
              return <div key={`line-${i}`}>{renderizado}</div>;
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
});
MdText.displayName = 'MdText';

/**
 * ChatBubble: Agora com Cursor de Digitação em tempo real
 */
const ChatBubble = React.memo(({ msg, userNome }: { msg: MensagemChat; userNome: string }) => {
  const isKia = msg.tipo === 'kia';
  const isError = msg.conteudo.includes('Desculpe, não consegui');
  const [copiado, setCopiado] = useState(false);

  const copiarTexto = () => {
    // Remove as tags de Widget antes de copiar
    const textoLimpo = msg.conteudo.replace(/\[WIDGET:[A-Z]+:[^\]]+\]/g, '');
    navigator.clipboard.writeText(textoLimpo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className={cn("flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2 duration-300", !isKia && "flex-row-reverse")}>
      <div className={cn(
        "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-transform",
        isKia 
          ? "bg-gradient-to-br from-primary to-violet-600 text-white shadow-sm" 
          : "bg-surface-hover border border-border/60 text-text-secondary",
        msg.isStreaming && isKia && "animate-pulse" // Animação de pulso enquanto digita
      )}>
        {isKia ? <Sparkles className="w-4 h-4" /> : userNome.charAt(0).toUpperCase()}
      </div>

      <div className={cn(
        "max-w-[85%] px-4 py-3 rounded-2xl relative group flex flex-col gap-1",
        isKia 
          ? cn("bg-surface border border-border/60 text-text-main shadow-sm rounded-tl-sm", isError && "border-red-500/30 bg-red-500/5") 
          : "bg-primary text-white rounded-tr-sm shadow-md"
      )}>
        {/* Adiciona o texto e o cursor piscante se estiver no modo Streaming */}
        {isKia ? (
          <div>
            <MdText texto={msg.conteudo} />
            {msg.isStreaming && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 align-middle" />}
          </div>
        ) : (
          <div className="text-sm whitespace-pre-wrap">{msg.conteudo}</div>
        )}
        
        {/* Footer da Bolha só aparece quando a IA termina de digitar */}
        {!msg.isStreaming && (
          <div className={cn("flex items-center justify-between mt-1", isKia ? "flex-row" : "flex-row-reverse")}>
            <span className={cn("text-[10px] opacity-60 font-medium", isKia ? "text-text-muted" : "text-white")}>
              {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>

            {isKia && !isError && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={copiarTexto} className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="Copiar resposta">
                  {copiado ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button className="p-1.5 text-text-muted hover:text-emerald-500 hover:bg-emerald-500/10 rounded-md transition-colors" title="Resposta útil">
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors" title="Resposta incorreta">
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
ChatBubble.displayName = 'ChatBubble';

// --- COMPONENTE PRINCIPAL ---
export function AssistenteIA() {
  const { user } = useAuth();
  const location = useLocation();
  
  const [aberto, setAberto] = useState(false);
  const [pergunta, setPergunta] = useState('');
  const [perguntaProcessando, setPerguntaProcessando] = useState('');
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const btnTriggerRef = useRef<HTMLButtonElement>(null);
  const formId = useId();

  // 👈 Usando a nova função de Streaming
  const { consultarStream, isPending } = useIAStream();

  const hasAccess = user && ROLES_PERMITIDOS.includes(user.role);

  const sugestoesDinamicas = useMemo(() => {
    if (!user) return [];
    if (user.role === 'RH') {
      return ['Quais documentos estão vencendo?', 'Status dos treinamentos de SST', 'Quais operadores têm mais infrações?'];
    }
    if (user.role === 'ENCARREGADO') {
      return ['Há defeitos graves em aberto?', 'Quais veículos estão na oficina?', 'Resumo do plano preventivo'];
    }
    return [
      'Qual veículo teve mais custo esse mês?',
      'Resumo da frota atual',
      'Quem são os operadores mais eficientes?',
      'Há defeitos graves em aberto?',
    ];
  }, [user?.role]);

  const [mensagens, setMensagens] = useState<MensagemChat[]>(() => {
    try {
      const historicoSalvo = localStorage.getItem('kia_historico');
      if (historicoSalvo) {
        const parsed = JSON.parse(historicoSalvo);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      }
    } catch (e) {
      console.error('Erro ao ler histórico da IA', e);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('kia_historico', JSON.stringify(mensagens));
  }, [mensagens]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (aberto) scrollToBottom();
  }, [mensagens, aberto, scrollToBottom]);

  useEffect(() => {
    if (aberto) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setAberto(false);
          btnTriggerRef.current?.focus();
        }
      };
      window.addEventListener('keydown', handleEsc);
      
      return () => {
        document.body.style.overflow = '';
        clearTimeout(timer);
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [aberto]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPending) {
      setLoadingMsgIdx(0);
      const msgs = getLoadingMessages(perguntaProcessando);
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % msgs.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPending, perguntaProcessando]);

  // 👈 NOVA Lógica de Envio (Streaming)
  const enviar = useCallback(async (texto?: string) => {
    const q = (texto ?? pergunta).trim();
    if (!q || isPending) return;

    if (inputRef.current) inputRef.current.style.height = 'auto';

    const historicoFormatado = mensagens.map(m => ({
      role: m.tipo === 'usuario' ? 'user' : 'model',
      text: m.conteudo
    }));

    setPerguntaProcessando(q);
    const novaMsg: MensagemChat = { id: crypto.randomUUID(), tipo: 'usuario', conteudo: q, timestamp: new Date() };
    setMensagens(prev => [...prev, novaMsg]);
    setPergunta('');

    await consultarStream({
      pergunta: q,
      contextoSistema: `O utilizador está atualmente na rota: ${location.pathname}`,
      historico: historicoFormatado
    }, {
      // Inicia o balão da KIA vazio e com a flag isStreaming = true
      onStart: (msgId) => {
        setMensagens(prev => [...prev, { id: msgId, tipo: 'kia', conteudo: '', timestamp: new Date(), isStreaming: true }]);
      },
      // Vai concatenando o texto letra a letra
      onChunk: (msgId, chunk) => {
        setMensagens(prev => prev.map(m => m.id === msgId ? { ...m, conteudo: m.conteudo + chunk } : m));
      },
      // Desliga o modo digitação
      onFinish: (msgId) => {
        setMensagens(prev => prev.map(m => m.id === msgId ? { ...m, isStreaming: false } : m));
      },
      // Em caso de erro
      onError: () => {
        setMensagens(prev => [...prev, { id: crypto.randomUUID(), tipo: 'kia', conteudo: 'Desculpe, não consegui processar sua consulta no momento. A conexão com o banco de dados falhou.', timestamp: new Date() }]);
      }
    });
  }, [pergunta, mensagens, isPending, consultarStream, location.pathname]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPergunta(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  if (!hasAccess) return null;

  const limparConversa = () => {
    setMensagens([]);
    localStorage.removeItem('kia_historico');
  };

  return (
    <>
      <button
        ref={btnTriggerRef}
        onClick={() => setAberto(prev => !prev)}
        aria-expanded={aberto}
        aria-controls="kia-chat-panel"
        className={cn(
          "group relative flex items-center gap-2.5 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-300 shadow-float w-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "bg-gradient-to-r from-primary to-violet-600 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
          aberto && "opacity-90 scale-[0.98]"
        )}
      >
        <div className="relative">
          <Sparkles className="w-5 h-5 shrink-0" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse border border-white/30" />
        </div>
        <span className="flex-1 text-left tracking-tight">Kia — IA da Frota</span>
        <ChevronDown className={cn("w-4 h-4 opacity-70 transition-transform duration-300", aberto && "rotate-180")} />
      </button>

      {aberto && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[999998] bg-black/60 backdrop-blur-sm sm:hidden pointer-events-auto transition-opacity animate-in fade-in"
            onClick={() => setAberto(false)}
            aria-hidden="true"
          />

          <div 
            id="kia-chat-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kia-title"
            className="fixed bottom-0 left-0 right-0 sm:left-auto z-[999999] sm:bottom-6 sm:right-6 w-full sm:w-[420px] h-[92dvh] sm:h-[620px] flex flex-col bg-surface border-t sm:border border-border/60 rounded-t-[2rem] sm:rounded-3xl shadow-[0_-10px_50px_rgba(0,0,0,0.5)] sm:shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-300 pointer-events-auto isolate"
          >
            <header className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-primary/10 via-violet-600/5 to-transparent border-b border-border/60 shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/5 pointer-events-none" />
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-md shrink-0 relative z-10">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0 relative z-10">
                <h3 id="kia-title" className="font-black text-text-main text-sm tracking-tight truncate">
                  Kia — Inteligência Artificial
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider truncate">Online · Assistente</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 relative z-10">
                {mensagens.length > 0 && (
                  <button 
                    onClick={limparConversa} 
                    className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors focus-visible:ring-2 outline-none ring-primary"
                    title="Limpar conversa"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => setAberto(false)} 
                  className="p-2 text-text-muted hover:text-text-main hover:bg-surface-hover rounded-xl transition-colors focus-visible:ring-2 outline-none ring-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* 👈 CORREÇÃO PRINCIPAL DO SCROLL: min-h-0 */}
            <div 
              className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-5 space-y-5 scrollbar-thin overscroll-contain"
              aria-live="polite"
            >
              {mensagens.length === 0 ? (
                <div className="space-y-5 py-2 animate-in fade-in zoom-in-95 duration-500">
                  <div className="bg-gradient-to-br from-primary/5 to-violet-600/5 border border-primary/10 rounded-2xl p-5 shadow-sm">
                    <p className="text-sm text-text-secondary leading-relaxed">
                      Olá, <strong className="text-text-main font-bold">{user.nome.split(' ')[0]}</strong>! Sou a <strong className="text-primary font-bold">Kia</strong>.
                    </p>
                    <p className="text-xs text-text-muted mt-3 font-medium uppercase tracking-wider">Sugestões de análise para o seu perfil:</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sugestoesDinamicas.map((s) => (
                      <button
                        key={s}
                        onClick={() => enviar(s)}
                        className="text-xs px-3.5 py-2.5 bg-surface border border-border/80 hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:-translate-y-0.5 rounded-xl transition-all duration-200 text-text-secondary font-medium text-left shadow-sm active:scale-95"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                mensagens.map((msg) => (
                  <ChatBubble key={msg.id} msg={msg} userNome={user.nome} />
                ))
              )}

              {/* Loader customizado enquanto a IA está a processar antes de cuspir o stream */}
              {isPending && mensagens[mensagens.length - 1]?.tipo === 'usuario' && (
                <div className="flex gap-3 items-start animate-in fade-in zoom-in-95">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-sm shrink-0">
                    <Sparkles className="w-4 h-4 text-white animate-pulse" />
                  </div>
                  <div className="px-4 py-3.5 bg-surface border border-border/60 rounded-2xl rounded-tl-sm shadow-sm">
                    <div className="flex items-center gap-2.5 text-text-muted text-sm font-medium">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="animate-pulse">{getLoadingMessages(perguntaProcessando)[loadingMsgIdx]}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} className="h-px w-full shrink-0" />
            </div>

            <footer className="p-4 border-t border-border/60 bg-surface shrink-0">
              <div className="relative flex items-end gap-2 bg-surface-hover border border-border/80 rounded-2xl p-1.5 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-inner">
                <textarea
                  id={formId}
                  ref={inputRef}
                  value={pergunta}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Descreva o que precisa analisar..."
                  disabled={isPending}
                  rows={1}
                  className="flex-1 max-h-[120px] bg-transparent text-sm text-text-main placeholder:text-text-muted outline-none disabled:opacity-50 resize-none py-2.5 px-3 scrollbar-thin"
                />
                <button
                  onClick={() => enviar()}
                  disabled={!pergunta.trim() || isPending}
                  className="w-10 h-10 mb-0.5 bg-primary text-white rounded-xl flex items-center justify-center disabled:opacity-40 disabled:hover:scale-100 hover:bg-primary-hover hover:scale-105 active:scale-95 transition-all shrink-0 shadow-sm"
                  aria-label="Enviar mensagem"
                >
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                </button>
              </div>
              <div className="flex items-center justify-center gap-1 mt-2.5">
                <AlertCircle className="w-3 h-3 text-text-muted/60" />
                <p className="text-[10px] text-text-muted/80 text-center font-medium">
                  A Kia baseia-se em dados confidenciais do seu sistema.
                </p>
              </div>
            </footer>
          </div>
        </>,
        document.body
      )}
    </>
  );
}