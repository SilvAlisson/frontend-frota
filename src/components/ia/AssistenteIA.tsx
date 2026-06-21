import { useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, Send, Loader2, RotateCcw, ChevronDown } from 'lucide-react';
import { useConsultaIA, type MensagemChat } from '../../hooks/useIA';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

const SUGESTOES = [
  'Qual veículo teve mais custo esse mês?',
  'Quais documentos estão vencendo?',
  'Resumo da frota atual',
  'Quem são os operadores mais eficientes?',
  'Há defeitos graves em aberto?',
  'Status dos treinamentos de SST',
];

const getLoadingMessages = (pergunta: string) => {
  const p = pergunta.toLowerCase();
  if (p.match(/defeito|manuten|quebra|peça|oficina|pneu|óleo/)) {
    return [
      'Buscando histórico de ordens de serviço...',
      'Analisando registros de defeitos reportados...',
      'Cruzando peças trocadas e mecânicas...',
      'Calculando custos de oficina...',
      'Sintetizando histórico do veículo...',
      'Polindo os últimos detalhes...'
    ];
  }
  if (p.match(/abastecimento|combust|litro|km|gasto|diesel|gasolina/)) {
    return [
      'Analisando histórico de abastecimentos...',
      'Calculando médias de KM/L...',
      'Cruzando rotas, jornadas e litragem...',
      'Verificando custos totais na bomba...',
      'Consolidando gastos do veículo...',
      'Polindo os últimos detalhes...'
    ];
  }
  if (p.match(/treinamento|venc|documento|cnh|sst|operador/)) {
    return [
      'Acessando matriz de documentos...',
      'Verificando validades e alertas do RH...',
      'Analisando certificados de treinamentos...',
      'Cruzando dados de Saúde e Segurança...',
      'Consolidando status dos colaboradores...',
      'Polindo os últimos detalhes...'
    ];
  }
  return [
    'Analisando o banco de dados da frota...',
    'Cruzando métricas e registros operacionais...',
    'Inspecionando transações recentes...',
    'Estruturando a melhor resposta...',
    'Polindo os últimos detalhes...',
    'Quase pronto...'
  ];
};

// Renderiza markdown simples (negrito, bullets, quebras de linha)
function MdText({ texto }: { texto: string }) {
  const linhas = texto.split('\n');
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {linhas.map((linha, i) => {
        if (!linha.trim()) return <br key={i} />;
        const isBullet = linha.trim().startsWith('* ') || linha.trim().startsWith('- ') || linha.trim().startsWith('• ');
        const texto = isBullet ? linha.trim().slice(2) : linha;
        const partes = texto.split(/(\*\*[^*]+\*\*)/g);
        const renderizado = partes.map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j} className="font-bold">{p.slice(2, -2)}</strong>
            : <span key={j}>{p}</span>
        );
        if (isBullet) return (
          <div key={i} className="flex gap-2 items-start">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <span>{renderizado}</span>
          </div>
        );
        return <p key={i}>{renderizado}</p>;
      })}
    </div>
  );
}

export function AssistenteIA() {
  const { user } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [pergunta, setPergunta] = useState('');
  const [perguntaProcessando, setPerguntaProcessando] = useState('');
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  const { mutate: consultar, isPending } = useConsultaIA();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPending) {
      setLoadingMsgIdx(0);
      const msgsLength = getLoadingMessages(perguntaProcessando).length;
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % msgsLength);
      }, 3500); // Transição mais rápida
    }
    return () => clearInterval(interval);
  }, [isPending, perguntaProcessando]);

  // Só aparece para ADMIN, RH e COORDENADOR
  const ROLES_PERMITIDOS = ['ADMIN', 'RH', 'COORDENADOR'];
  if (!user || !ROLES_PERMITIDOS.includes(user.role)) return null;

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  };

  useEffect(() => {
    if (aberto) {
      inputRef.current?.focus();
      scrollToBottom();
    }
  }, [aberto]);

  useEffect(() => {
    scrollToBottom();
  }, [mensagens]);

  const enviar = (texto?: string) => {
    const q = (texto ?? pergunta).trim();
    if (!q || isPending) return;

    const historicoFormatado = mensagens.map(m => ({
      role: m.tipo === 'usuario' ? 'user' : 'model',
      text: m.conteudo
    }));

    setPerguntaProcessando(q);
    const novaMsg: MensagemChat = { id: crypto.randomUUID(), tipo: 'usuario', conteudo: q, timestamp: new Date() };
    setMensagens(prev => [...prev, novaMsg]);
    setPergunta('');

    consultar({ pergunta: q, historico: historicoFormatado }, {
      onSuccess: (resposta) => {
        const respostaMsg: MensagemChat = {
          id: crypto.randomUUID(),
          tipo: 'kia',
          conteudo: resposta,
          timestamp: new Date(),
        };
        setMensagens(prev => [...prev, respostaMsg]);
      },
      onError: () => {
        setMensagens(prev => [...prev, {
          id: crypto.randomUUID(),
          tipo: 'kia',
          conteudo: 'Desculpe, não consegui processar sua consulta no momento. Tente novamente.',
          timestamp: new Date(),
        }]);
      }
    });
  };

  return (
    <>
      {/* Botão flutuante da Kia */}
      <button
        onClick={() => setAberto(prev => !prev)}
        className={cn(
          "group relative flex items-center gap-2.5 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-300 shadow-float w-full",
          "bg-gradient-to-r from-primary to-violet-600 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
          aberto && "opacity-90"
        )}
        aria-label="Abrir assistente Kia"
      >
        <div className="relative">
          <Sparkles className="w-5 h-5 shrink-0" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse border border-white/50" />
        </div>
        <span className="flex-1 text-left tracking-tight">Kia — IA da Frota</span>
        <ChevronDown className={cn("w-4 h-4 opacity-60 transition-transform duration-300", aberto && "rotate-180")} />
      </button>

      {/* Painel de Chat */}
      {aberto && createPortal(
        <div className="fixed bottom-0 right-0 z-[99999] sm:bottom-6 sm:right-6 w-full sm:w-[420px] h-[95svh] sm:h-[620px] flex flex-col bg-surface border border-border/60 sm:rounded-3xl shadow-float overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">

          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-primary/10 to-violet-600/10 border-b border-border/60 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-text-main text-sm tracking-tight">Kia — Inteligência Artificial</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Online · Dados em tempo real</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {mensagens.length > 0 && (
                <button onClick={() => setMensagens([])} className="p-2 text-text-muted hover:text-text-main hover:bg-surface-hover rounded-xl transition-colors" title="Limpar conversa">
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setAberto(false)} className="p-2 text-text-muted hover:text-text-main hover:bg-surface-hover rounded-xl transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Área de mensagens */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {mensagens.length === 0 ? (
              <div className="space-y-4 py-2">
                <div className="bg-gradient-to-br from-primary/5 to-violet-600/5 border border-primary/10 rounded-2xl p-4">
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Olá, <strong className="text-text-main">{user.nome.split(' ')[0]}</strong>! Sou a <strong className="text-primary">Kia</strong>, assistente de inteligência artificial do Frota KLIN. Posso analisar dados reais da sua frota, operadores, custos, SST e documentos.
                  </p>
                  <p className="text-xs text-text-muted mt-2 font-medium">Experimente uma das sugestões abaixo ou escreva sua pergunta:</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SUGESTOES.map((s) => (
                    <button
                      key={s}
                      onClick={() => enviar(s)}
                      className="text-xs px-3 py-2 bg-surface-hover border border-border/60 hover:border-primary/40 hover:bg-primary/5 hover:text-primary rounded-xl transition-all duration-200 text-text-secondary font-medium text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              mensagens.map((msg) => (
                <div key={msg.id} className={cn("flex gap-3 items-start", msg.tipo === 'usuario' && "flex-row-reverse")}>
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0",
                    msg.tipo === 'kia'
                      ? "bg-gradient-to-br from-primary to-violet-600 text-white shadow-sm"
                      : "bg-surface-hover border border-border/60 text-text-secondary"
                  )}>
                    {msg.tipo === 'kia' ? <Sparkles className="w-4 h-4" /> : user.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className={cn(
                    "max-w-[82%] px-4 py-3 rounded-2xl",
                    msg.tipo === 'kia'
                      ? "bg-surface border border-border/60 text-text-main shadow-sm rounded-tl-sm"
                      : "bg-primary text-white rounded-tr-sm"
                  )}>
                    {msg.tipo === 'kia' ? (
                      <MdText texto={msg.conteudo} />
                    ) : (
                      <p className="text-sm">{msg.conteudo}</p>
                    )}
                    <span className={cn("text-[10px] mt-2 block", msg.tipo === 'kia' ? "text-text-muted" : "text-white/60")}>
                      {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}

            {isPending && (
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-sm shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="px-4 py-3 bg-surface border border-border/60 rounded-2xl rounded-tl-sm shadow-sm">
                  <div className="flex items-center gap-2 text-text-muted text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="animate-pulse">{getLoadingMessages(perguntaProcessando)[loadingMsgIdx] || 'Analisando...'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border/60 bg-surface shrink-0">
            <div className="flex gap-2 items-center bg-surface-hover border border-border/60 rounded-2xl px-4 py-2 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <input
                id={inputId}
                ref={inputRef}
                type="text"
                value={pergunta}
                onChange={(e) => setPergunta(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && enviar()}
                placeholder="Pergunte sobre a frota..."
                disabled={isPending}
                className="flex-1 bg-transparent text-sm text-text-main placeholder:text-text-muted/60 outline-none disabled:opacity-50 min-w-0"
              />
              <button
                onClick={() => enviar()}
                disabled={!pergunta.trim() || isPending}
                className="w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-hover transition-colors shrink-0"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-text-muted text-center mt-2 font-medium">Respostas baseadas nos dados reais do sistema</p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
