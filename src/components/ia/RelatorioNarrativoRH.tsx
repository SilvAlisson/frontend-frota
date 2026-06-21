import { useState } from 'react';
import { FileText, Sparkles, Loader2, Download, RefreshCw } from 'lucide-react';
import { useRelatorioRH } from '../../hooks/useIA';

// Renderiza markdown (negrito, bullets, títulos)
function MdText({ texto }: { texto: string }) {
  const linhas = texto.split('\n');
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {linhas.map((linha, i) => {
        if (!linha.trim()) return <div key={i} className="h-2" />;

        // Cabeçalhos ## ou ###
        if (linha.startsWith('### ')) return (
          <h4 key={i} className="font-black text-text-main text-sm mt-4 mb-1">{linha.slice(4)}</h4>
        );
        if (linha.startsWith('## ')) return (
          <h3 key={i} className="font-black text-primary text-[13px] uppercase tracking-wider mt-5 mb-1">{linha.slice(3)}</h3>
        );
        if (linha.startsWith('# ')) return (
          <h2 key={i} className="font-black text-text-main text-base mt-4">{linha.slice(2)}</h2>
        );

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

export function RelatorioNarrativoRH() {
  const [relatorio, setRelatorio] = useState<string | null>(null);
  const { mutate: gerar, isPending } = useRelatorioRH();

  const handleGerar = () => {
    gerar(undefined, {
      onSuccess: (texto) => setRelatorio(texto),
    });
  };

  const handleDownload = () => {
    if (!relatorio) return;
    const blob = new Blob([relatorio], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Relatorio_RH_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-surface border border-border/60 rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-violet-600/5 to-primary/5 border-b border-border/60">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-primary flex items-center justify-center shadow-sm shrink-0">
          <FileText className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-black text-text-main tracking-tight">Relatório Executivo de RH</h3>
          <p className="text-[11px] text-text-muted font-medium">Gerado pela Kia · Análise de colaboradores, treinamentos e SST</p>
        </div>
        <div className="flex items-center gap-2">
          {relatorio && (
            <>
              <button
                onClick={handleDownload}
                className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                title="Baixar relatório"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleGerar}
                disabled={isPending}
                className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                title="Regenerar relatório"
              >
                <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
              </button>
            </>
          )}
          {!relatorio && !isPending && (
            <button
              onClick={handleGerar}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-violet-600 to-primary text-white text-xs font-bold rounded-xl hover:shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Gerar Relatório
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {isPending && (
        <div className="p-8 flex flex-col items-center gap-3 text-text-muted">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600/10 to-primary/10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-text-secondary">Analisando dados de RH...</p>
            <p className="text-xs text-text-muted mt-1">Treinamentos, SST, colaboradores e documentos</p>
          </div>
        </div>
      )}

      {/* Conteúdo */}
      {relatorio && !isPending && (
        <div className="p-5 max-h-[500px] overflow-y-auto scrollbar-thin">
          <MdText texto={relatorio} />
        </div>
      )}

      {/* Estado vazio */}
      {!relatorio && !isPending && (
        <div className="p-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-violet-600/10 border border-violet-600/20 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7 text-violet-600/60" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-secondary">Nenhum relatório gerado</p>
            <p className="text-xs text-text-muted mt-1">Clique em "Gerar Relatório" para criar uma análise completa de RH com dados reais do sistema.</p>
          </div>
        </div>
      )}
    </div>
  );
}
