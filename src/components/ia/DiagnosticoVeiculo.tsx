import { useState } from 'react';
import { Sparkles, Loader2, Wrench, RefreshCw } from 'lucide-react';
import { useAnaliseVeiculo } from '../../hooks/useIA';

interface DiagnosticoVeiculoProps {
  veiculoId: string;
}

// Renderiza markdown simples
function MdText({ texto }: { texto: string }) {
  const linhas = texto.split('\n');
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {linhas.map((linha, i) => {
        if (!linha.trim()) return <div key={i} className="h-1" />;
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

export function DiagnosticoVeiculo({ veiculoId }: DiagnosticoVeiculoProps) {
  const [diagnostico, setDiagnostico] = useState<string | null>(null);
  const { mutate: analisar, isPending } = useAnaliseVeiculo();

  const handleAnalisar = () => {
    analisar(veiculoId, {
      onSuccess: (data) => setDiagnostico(data.diagnostico),
    });
  };

  return (
    <div className="bg-surface border border-border/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-primary/5 to-violet-600/5 border-b border-border/60">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-sm shrink-0">
          <Wrench className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-black text-text-main tracking-tight flex items-center gap-2">
            Diagnóstico Preditivo
            <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-primary to-violet-600 text-[9px] text-white uppercase tracking-widest flex items-center gap-1 shadow-sm">
              <Sparkles className="w-2.5 h-2.5" /> IA
            </span>
          </h3>
          <p className="text-[11px] text-text-muted font-medium mt-0.5">Análise de consumo, manutenção e defeitos recorrentes</p>
        </div>
        <div className="flex items-center gap-2">
          {!diagnostico && !isPending && (
            <button
              onClick={handleAnalisar}
              className="flex items-center gap-2 px-3 py-2 bg-surface-hover hover:bg-primary/10 hover:text-primary text-text-secondary text-xs font-bold rounded-xl transition-all border border-border/60 hover:border-primary/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Analisar Veículo
            </button>
          )}
          {diagnostico && (
            <button
              onClick={handleAnalisar}
              disabled={isPending}
              className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
              title="Regenerar análise"
            >
              <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-5">
        {isPending ? (
          <div className="flex flex-col items-center justify-center py-6 gap-3 text-text-muted">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm font-bold text-text-secondary">Processando histórico técnico...</p>
            <p className="text-[11px] text-center max-w-[250px]">Cruzando dados de defeitos, OS e consumo dos últimos 60 dias.</p>
          </div>
        ) : diagnostico ? (
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
            <MdText texto={diagnostico} />
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-text-secondary font-medium">Nenhum diagnóstico gerado ainda.</p>
            <p className="text-xs text-text-muted mt-1">Gere uma análise para identificar tendências de falhas neste veículo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
