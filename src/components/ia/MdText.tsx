import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CarFront } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ============================================================================
// 🚗 WIDGET: Cartão de veículo clicável — renderizado inline no chat
// ============================================================================
const WidgetVeiculo = ({ placa }: { placa: string }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/admin/veiculos/${placa}`)}
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

// ============================================================================
// 📝 MDTEXT: Renderizador de Markdown com suporte a tabelas
// ============================================================================

interface MdTextProps {
  texto: string;
  /** Se true, renderiza widgets interativos de veículo. Padrão: false */
  comWidgets?: boolean;
}

export const MdText = React.memo(({ texto, comWidgets = false }: MdTextProps) => {
  // Separa o texto em blocos: partes normais e widgets [WIDGET:VEICULO:PLACA]
  const blocos = comWidgets
    ? texto.split(/(\[WIDGET:VEICULO:[^\]]+\])/g)
    : [texto];

  return (
    <div className="text-sm leading-relaxed word-break">
      {blocos.map((bloco, idx) => {
        // Renderiza widgets de veículo
        if (comWidgets && bloco.startsWith('[WIDGET:VEICULO:')) {
          const placa = bloco.replace('[WIDGET:VEICULO:', '').replace(']', '');
          return <WidgetVeiculo key={`widget-${idx}`} placa={placa} />;
        }

        if (!bloco.trim()) return null;

        // Renderiza o markdown
        return (
          <ReactMarkdown
            key={`md-${idx}`}
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
              h1: ({node, ...props}) => <h1 className="font-black text-text-main text-lg pt-4 pb-2 border-b border-border/40" {...props} />,
              h2: ({node, ...props}) => <h2 className="font-black text-text-main text-base pt-3 pb-1" {...props} />,
              h3: ({node, ...props}) => <h3 className="font-black text-text-main text-sm pt-2 pb-0.5" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
              li: ({node, ...props}) => <li className="pl-1" {...props} />,
              strong: ({node, ...props}) => <strong className="font-bold text-text-main" {...props} />,
              table: ({node, ...props}) => (
                <div className="w-full overflow-x-auto my-3 rounded-lg border border-border/60">
                  <table className="w-full text-left border-collapse text-sm" {...props} />
                </div>
              ),
              thead: ({node, ...props}) => <thead className="bg-surface-hover/80 text-text-main font-semibold" {...props} />,
              th: ({node, ...props}) => <th className="px-3 py-2.5 border-b border-border/60 whitespace-nowrap" {...props} />,
              td: ({node, ...props}) => <td className="px-3 py-2.5 border-b border-border/40 whitespace-nowrap text-text-secondary" {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-primary/50 pl-3 italic text-text-muted my-2" {...props} />,
            }}
          >
            {bloco}
          </ReactMarkdown>
        );
      })}
    </div>
  );
});

MdText.displayName = 'MdText';
