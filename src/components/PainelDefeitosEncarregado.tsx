import { useState, useMemo } from 'react';
import { AlertCircle, CheckCircle, Clock, Navigation, Wrench, X, ZoomIn, Info, Zap, Droplets, Cog, CarFront, BarChart2 } from 'lucide-react';
import { GraficoDonutDefeitos } from './ui/GraficosFlota';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Modal } from './ui/Modal';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDefeitos } from '../hooks/useDefeitos';
import type { DefeitoVeiculo } from '../hooks/useDefeitos';
import { handleApiError } from '../services/errorHandler';
import { cn } from '../lib/utils';

// Constantes de estilo e ícones
const ICONS: Record<string, any> = { PNEU: Cog, FREIO: AlertCircle, MOTOR: Wrench, ILUMINACAO: Zap, CARROCERIA: CarFront, OLEO: Droplets, OUTRO: Info };
const CRITICOS = ['FREIO', 'MOTOR'];

export function PainelDefeitosEncarregado() {
  const { defeitos, isLoading, resolverDefeito } = useDefeitos();

  // Imagem "Zoom" e modal
  const [fotoExpandida, setFotoExpandida] = useState<string | null>(null);
  const [zoomNivel, setZoomNivel] = useState(1);

  // Resolução de Defeito
  const [defeitoResolvendo, setDefeitoResolvendo] = useState<DefeitoVeiculo | null>(null);
  const [resolucaoTexto, setResolucaoTexto] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const ativos = defeitos.filter(d => ['ABERTO', 'EM_ANALISE'].includes(d.status));

  if (isLoading) {
    return <div className="p-8 text-center text-text-muted animate-pulse font-mono tracking-widest text-xs uppercase">Rastreando anomalias ativas...</div>;
  }

  if (ativos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-success/5 rounded-3xl border-2 border-dashed border-success/20 text-text-muted transition-all duration-700 animate-in fade-in">
        <CheckCircle className="w-20 h-20 text-success/40 mb-5 animate-pulse" />
        <h3 className="text-2xl font-black uppercase tracking-tight text-text-main text-success-600">Sistemas Limpos</h3>
        <p className="text-success/70 font-medium">Nenhum veículo aguardando reparo nas bases reportadas.</p>
      </div>
    );
  }

  const handleConfirmarReparo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!defeitoResolvendo) return;

    setIsResolving(true);
    try {
      await resolverDefeito.mutateAsync({
        id: defeitoResolvendo.id,
        resolucao: resolucaoTexto
      });
      setDefeitoResolvendo(null);
      setResolucaoTexto('');
    } catch (err) {
      handleApiError(err, 'Erro ao confirmar reparo.');
    } finally {
      setIsResolving(false);
    }
  };

  // Dados do Donut Chart — distribuição por categoria
  const dadosDonut = useMemo(() => {
    const categorias: Record<string, { count: number; color: string }> = {
      FREIO: { count: 0, color: '#ef4444' },
      MOTOR: { count: 0, color: '#f97316' },
      PNEU: { count: 0, color: '#eab308' },
      OLEO: { count: 0, color: '#38bdf8' },
      ILUMINACAO: { count: 0, color: '#a78bfa' },
      CARROCERIA: { count: 0, color: '#34d399' },
      OUTRO: { count: 0, color: '#94a3b8' },
    };
    ativos.forEach(d => {
      const cat = d.categoria in categorias ? d.categoria : 'OUTRO';
      categorias[cat].count++;
    });
    return Object.entries(categorias)
      .filter(([, v]) => v.count > 0)
      .map(([name, v]) => ({ name, value: v.count, color: v.color }));
  }, [ativos]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ─── PAINEL ANALÍTICO DE TOPO ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* HUD Warning */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface border-l-4 border-l-error p-5 rounded-r-2xl shadow-sm sm:col-span-1">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-error/10 text-error rounded-full flex items-center justify-center animate-pulse">
              <AlertCircle className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h2 className="text-base font-black text-text-main uppercase tracking-widest">Atenção Prioritária</h2>
              <p className="text-xs font-bold text-text-muted mt-1">{ativos.length} ocorrência(s) aguardam despacho técnico.</p>
            </div>
          </div>
        </div>

        {/* Donut Chart de Distribuição */}
        <div className="bg-surface border border-border/60 rounded-[2rem] p-5 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-4 h-4 text-text-muted" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Distribuição por Categoria</span>
          </div>
          <GraficoDonutDefeitos dados={dadosDonut} total={ativos.length} />
          {/* Legenda Compacta */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
            {dadosDonut.map(d => (
              <span key={d.name} className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-text-muted">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                {d.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ativos.map((defeito) => {
          const Icon = ICONS[defeito.categoria] || Wrench;
          const isCritical = CRITICOS.includes(defeito.categoria);

          return (
            <div key={defeito.id} className={cn(
              "bg-surface border hover:shadow-xl transition-all duration-500 rounded-3xl overflow-hidden flex flex-col group relative opacity-100",
              isCritical ? "border-error/50 hover:border-error shadow-[0_4px_15px_rgba(239,68,68,0.1)]" : "border-border/60 hover:border-warning/50"
            )}>
              {/* Status Ping inteligente */}
              <div className="absolute top-0 right-0 p-5">
                <span className="relative flex h-3 w-3">
                  <span className={cn(
                    "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                    isCritical ? "bg-error" : "bg-warning"
                  )}></span>
                  <span className={cn(
                    "relative inline-flex rounded-full h-3 w-3 shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                    isCritical ? "bg-error" : "bg-warning"
                  )}></span>
                </span>
              </div>

              {/* Bloco Gestão Visível */}
              <div className="p-6 pb-5 relative overflow-hidden">
                <div className={cn(
                  "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none opacity-50",
                  isCritical ? "bg-error" : "bg-warning"
                )} />
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center mb-5 border shadow-inner relative z-10",
                  isCritical ? "bg-error/10 text-error border-error/20" : "bg-warning/10 text-warning-700 border-warning/20"
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-text-main tracking-tighter uppercase leading-none overflow-hidden text-ellipsis relative z-10">
                  {defeito.categoria}
                </h3>

                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center gap-2 p-1.5 pr-4 bg-surface-hover/80 rounded-xl border border-border/40 shrink-0">
                    <span className="w-6 h-6 bg-background rounded-lg flex justify-center items-center text-[8px] font-black uppercase text-text-muted">ID</span>
                    <span className="text-sm font-black font-mono text-primary uppercase">{defeito.veiculo.placa}</span>
                  </div>
                </div>
              </div>

              {/* Visualizador Deep Glass da Evidência Fotográfica */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => { setFotoExpandida(defeito.fotoUrl); setZoomNivel(1); }}
                className="w-full h-40 bg-black relative overflow-hidden group/img mt-0 cursor-pointer shadow-inner"
              >
                <img src={defeito.fotoUrl} alt="Evidência" className="w-full h-full object-cover opacity-70 group-hover/img:opacity-100 group-hover/img:scale-110 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex items-end p-4">
                  <span className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                    <ZoomIn className="w-4 h-4" /> Ampliar para Perícia Evidencial
                  </span>
                </div>
              </div>

              {/* Sumário Tático de Resolução */}
              <div className="p-6 pt-5 flex-1 flex flex-col justify-between gap-6 bg-gradient-to-b from-surface to-surface-hover/30">
                <div className="space-y-4">
                  <div className="relative">
                    <span className="text-[9px] font-black uppercase text-text-muted mb-1 block tracking-widest">Informação do Motorista</span>
                    <p className={cn(
                      "text-xs font-bold text-text-main/90 border-l-[3px] pl-3 italic",
                      isCritical ? "border-error/60" : "border-warning/60"
                    )}>
                      "{defeito.descricao || 'Detalhes omitidos na transmissão. Checar visualmente.'}"
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-text-muted uppercase tracking-wider backdrop-blur bg-background/50 px-2 py-1 rounded-lg">
                      <Navigation className="w-3 h-3 text-primary" /> {defeito.operador.nome}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest text-warning/90">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDistanceToNow(new Date(defeito.createdAt), { addSuffix: true, locale: ptBR })}
                    </div>
                  </div>
                </div>

                <Button
                  variant="success"
                  onClick={() => setDefeitoResolvendo(defeito)}
                  className="w-full h-12 font-black uppercase tracking-widest rounded-xl shadow-[0_4px_14px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_20px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 transition-all text-[11px]"
                >
                  Validar & Dar Baixa no Reparo
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔮 Visualizador Cinemático de Perícia Fotográfica */}
      {fotoExpandida && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-3xl p-4 sm:p-8 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">

          {/* Top Navigation Bar HUD */}
          <div className="absolute top-0 left-0 w-full flex justify-between items-center p-6 bg-gradient-to-b from-black/80 to-transparent z-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-error/20 flex items-center justify-center rounded-lg border border-error/30 text-error">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-white font-black uppercase text-sm tracking-widest block">Perícia Ocular</span>
                <span className="text-error font-medium text-[10px] uppercase tracking-wider block">Sistema Analítico UI</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                className="bg-white/10 hover:bg-white/20 text-white rounded-xl h-12 w-12"
                onClick={() => setZoomNivel(prev => prev < 4 ? prev + 0.5 : prev)}
              >
                <ZoomIn className="w-5 h-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="bg-white/10 hover:bg-white/20 text-white rounded-xl h-12 w-12"
                onClick={() => { setFotoExpandida(null); setZoomNivel(1); }}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Imagem Viewer */}
          <div className="w-full max-w-5xl h-full flex items-center justify-center overflow-auto rounded-3xl mt-16 sm:mt-0 cursor-move">
            <img
              src={fotoExpandida}
              alt="Zoom Avançado"
              style={{ transform: `scale(${zoomNivel})`, transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
              className="max-h-[85vh] max-w-full object-contain pointer-events-auto rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] filter brightness-110 contrast-125"
              onDoubleClick={() => setZoomNivel(prev => prev > 1 ? 1 : 2.5)}
              title="Clique duplo para Zoom Rápido"
              draggable={false}
            />
          </div>

          {/* Dica Floating Bar */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/60 border border-white/10 text-white font-bold text-[10px] uppercase tracking-widest px-6 py-3 rounded-full flex gap-3 backdrop-blur shadow-2xl items-center pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
            Toque nos botões acima ou duplo-clique na foto para Inspecionar
          </div>
        </div>
      )}

      {/* Modal Confirmar Reparo Pro-Max */}
      <Modal
        isOpen={!!defeitoResolvendo}
        onClose={() => { setDefeitoResolvendo(null); setResolucaoTexto(''); }}
        title="Baixa Tática de Reparo"
        className="border border-success/30"
      >
        <form onSubmit={handleConfirmarReparo} className="space-y-6 pt-2">

          <div className="bg-success/10 border border-success/20 p-4 rounded-xl text-success-700 flex flex-col">
            <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4" /> Protocolo de Certificação
            </span>
            <p className="text-sm font-medium leading-relaxed opacity-90">
              Você confirma que o reparo do veículo <strong className="font-black font-mono tracking-tight text-success uppercase">{defeitoResolvendo?.veiculo.placa}</strong> foi resolvido?
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-text-main uppercase tracking-widest flex gap-2">Insira as Observações de Saída</label>
            <Textarea
              placeholder="Exemplo técnico: Suspensão refeita, custo atribuído: R$ 850..."
              value={resolucaoTexto}
              onChange={(e) => setResolucaoTexto(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-border/40">
            <Button type="button" variant="outline" onClick={() => setDefeitoResolvendo(null)} className="flex-1 h-14 uppercase tracking-widest font-black" disabled={isResolving}>
              Cancelar solicitação
            </Button>
            <Button type="submit" variant="success" isLoading={isResolving} className="flex-[2] h-14 uppercase tracking-widest font-black shadow-[0_5px_15px_rgba(16,185,129,0.3)] hover:scale-[1.02]">
              Homologar Resolução
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
