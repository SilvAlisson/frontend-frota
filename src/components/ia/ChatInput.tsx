import React, { useRef, useEffect } from 'react';
import { Send, Square, AlertCircle } from 'lucide-react';

interface ChatInputProps {
  isPending: boolean;
  onSend: (pergunta: string) => void;
  onAbort: () => void;
}

export const ChatInput = React.memo(({ isPending, onSend, onAbort }: ChatInputProps) => {
  const [texto, setTexto] = React.useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (!isPending) inputRef.current?.focus(); }, [isPending]);

  const handleSend = () => {
    if (!texto.trim() || isPending) return;
    onSend(texto);
    setTexto('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <footer className="p-4 border-t border-border/60 bg-surface shrink-0">
      <div className="relative flex items-end gap-2 bg-surface-hover border border-border/80 rounded-2xl p-1.5 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-inner">
        <textarea
          ref={inputRef}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder="Descreva o que precisa analisar..."
          disabled={isPending}
          rows={1}
          className="flex-1 max-h-[120px] bg-transparent text-sm text-text-main placeholder:text-text-muted outline-none disabled:opacity-50 resize-none py-2.5 px-3 scrollbar-thin"
        />
        
        {/* Renderiza Stop se carregando, ou Send se não. */}
        {isPending ? (
          <button onClick={onAbort} className="w-10 h-10 mb-0.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl flex items-center justify-center transition-all shrink-0">
            <Square className="w-4 h-4 fill-current" />
          </button>
        ) : (
          <button onClick={handleSend} disabled={!texto.trim()} className="w-10 h-10 mb-0.5 bg-primary text-white rounded-xl flex items-center justify-center disabled:opacity-40 disabled:hover:scale-100 hover:scale-105 transition-all shrink-0">
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        )}
      </div>
      <div className="flex items-center justify-center gap-1 mt-2.5">
        <AlertCircle className="w-3 h-3 text-text-muted/60" />
        <p className="text-[10px] text-text-muted/80 text-center font-medium">A Kia baseia-se em dados confidenciais do seu sistema.</p>
      </div>
    </footer>
  );
});
ChatInput.displayName = 'ChatInput';