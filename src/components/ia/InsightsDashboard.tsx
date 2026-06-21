import { useState } from 'react';
import { Sparkles, Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useInsightsKPIs } from '../../hooks/useIA';

interface InsightsDashboardProps {
  kpis: Record<string, unknown>;
  mes: number;
  ano: number;
}

// Renderiza markdown simples
function MdText({ texto }: { texto: string }) {
  const linhas = texto.split('\n');
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {linhas.map((linha, i) => {
        if (!linha.trim()) return null;
        const isBullet = linha.trim().startsWith('* ') || linha.trim().startsWith('- ') || linha.trim().startsWith('• ');
        const conteudo = isBullet ? linha.trim().slice(2) : linha;
        const partes = conteudo.split(/(\*\*[^*]+\*\*)/g);
        const renderizado = partes.map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j} className="font-bold text-text-main">{p.slice(2, -2)}</strong>
            : <span key={j}>{p}</span>
        );
        if (isBullet) return (
          <div key={i} className="flex gap-2 items-start">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <span className="text-text-secondary">{renderizado}</span>
          </div>
        );
        return <p key={i} className="text-text-secondary">{renderizado}</p>;
      })}
    </div>
  );
}

export function InsightsDashboard({ kpis, mes, ano }: InsightsDashboardProps) {
  const [insights, setInsights] = useState<string | null>(null);
  const [expandido, setExpandido] = useState(true);
  const { mutate: gerarInsights, isPending } = useInsightsKPIs();

  const handleGerar = () => {
    gerarInsights({ kpis, mes, ano }, {
      onSuccess: (texto) => {
        setInsights(texto);
        setExpandido(true);
      }
    });
  };

  return (
    <div className="bg-gradient-to-br from-primary/5 to-violet-600/5 border border-primary/15 rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-sm shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-black text-text-main tracking-tight">Análise Inteligente · Kia</h3>
          <p className="text-[11px] text-text-muted font-medium">Insights gerados com IA a partir dos KPIs do período</p>
        </div>
        <div className="flex items-center gap-2">
          {!insights && !isPending && (
            <button
              onClick={handleGerar}
              className="flex items-center gap-2 px-3 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-all hover:shadow-md active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Gerar Análise
            </button>
          )}
          {insights && (
            <>
              <button
                onClick={handleGerar}
                disabled={isPending}
                className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                title="Regenerar análise"
              >
                <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setExpandido(e => !e)}
                className="p-2 text-text-muted hover:text-text-main hover:bg-surface-hover rounded-xl transition-colors"
              >
                {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      {isPending && (
        <div className="px-5 pb-5 flex items-center gap-3 text-text-muted">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm font-medium">Analisando KPIs e histórico comparativo...</span>
        </div>
      )}

      {insights && expandido && (
        <div className="px-5 pb-5 pt-1 border-t border-primary/10">
          <MdText texto={insights} />
        </div>
      )}
    </div>
  );
}
