import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { type MensagemChat } from '../../hooks/useIA';
import { MdText } from './MdText';
import { cn } from '../../lib/utils';

const BlinkingDots = () => {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const int = setInterval(() => setDots(p => p.length >= 3 ? '' : p + '.'), 400);
    return () => clearInterval(int);
  }, []);
  return <span className="inline-block w-4 text-left font-bold tracking-widest">{dots}</span>;
};

interface ChatBubbleProps {
  msg: MensagemChat;
  userNome: string;
  loadingText?: string;
  onFeedback: (msgId: string, avaliacao: 'positivo' | 'negativo') => void;
}

export const ChatBubble = React.memo(({ msg, userNome, loadingText, onFeedback }: ChatBubbleProps) => {
  const isKia = msg.tipo === 'kia';
  const isError = msg.conteudo.includes('Desculpe, não consegui');
  const [copiado, setCopiado] = useState(false);
  const [feedback, setFeedback] = useState<'neutro'|'positivo'|'negativo'>('neutro');

  if (isKia && !msg.conteudo && msg.isStreaming) {
    return (
      <div className="flex gap-3 items-start animate-in fade-in zoom-in-95">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-sm shrink-0">
          <Sparkles className="w-4 h-4 text-white animate-pulse" />
        </div>
        <div className="px-4 py-3.5 bg-surface border border-border/60 rounded-2xl rounded-tl-sm shadow-sm">
          <div className="flex items-center gap-1.5 text-text-muted text-sm font-medium">
            <span className="text-primary font-bold">{loadingText || 'Analisando'}</span>
            <BlinkingDots />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2", !isKia && "flex-row-reverse")}>
      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-transform", isKia ? "bg-gradient-to-br from-primary to-violet-600 text-white shadow-sm" : "bg-surface-hover border border-border/60 text-text-secondary", msg.isStreaming && isKia && "animate-pulse")}>
        {isKia ? <Sparkles className="w-4 h-4" /> : userNome.charAt(0).toUpperCase()}
      </div>
      <div className={cn("max-w-[85%] px-4 py-3 rounded-2xl relative group flex flex-col gap-1", isKia ? cn("bg-surface border border-border/60 text-text-main shadow-sm rounded-tl-sm", isError && "border-red-500/30 bg-red-500/5") : "bg-primary text-white rounded-tr-sm shadow-md")}>
        {isKia ? (
          <div><MdText texto={msg.conteudo} comWidgets />{msg.isStreaming && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 align-middle" />}</div>
        ) : <div className="text-sm whitespace-pre-wrap">{msg.conteudo}</div>}
        
        {!msg.isStreaming && (
          <div className={cn("flex items-center justify-between mt-1", isKia ? "flex-row" : "flex-row-reverse")}>
            <span className={cn("text-[10px] opacity-60 font-medium", isKia ? "text-text-muted" : "text-white")}>
              {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isKia && !isError && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { navigator.clipboard.writeText(msg.conteudo.replace(/\[WIDGET:[A-Z]+:[^\]]+\]/g, '')); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }} className="p-1.5 text-text-muted hover:text-primary transition-colors">
                  {copiado ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => { if(feedback==='neutro') { setFeedback('positivo'); onFeedback(msg.id, 'positivo'); } }} className={cn("p-1.5 rounded-md transition-colors", feedback === 'positivo' ? "text-emerald-500 bg-emerald-500/15" : "text-text-muted hover:text-emerald-500")}>
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { if(feedback==='neutro') { setFeedback('negativo'); onFeedback(msg.id, 'negativo'); } }} className={cn("p-1.5 rounded-md transition-colors", feedback === 'negativo' ? "text-red-500 bg-red-500/15" : "text-text-muted hover:text-red-500")}>
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