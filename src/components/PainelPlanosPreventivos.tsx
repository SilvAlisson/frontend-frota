import { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle, Clock, Wrench, ShieldAlert, BarChart2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { format, differenceInDays } from 'date-fns';
import { usePlanosManutencao } from '../hooks/usePlanosManutencao';
import type { PlanoManutencao } from '../hooks/usePlanosManutencao';
import { handleApiError } from '../services/errorHandler';
import { GraficoBarraPlanos } from './ui/GraficosFlota';

export function PainelPlanosPreventivos() {
  const { planos, isLoading, registrarExecucao } = usePlanosManutencao();
  
  // Controle do modal da 'Baixa Rápida'
  const [planoAberto, setPlanoAberto] = useState<PlanoManutencao | null>(null);
  const [kmAtualConfirmacao, setKmAtualConfirmacao] = useState<string>('');
  const [obsConfirmacao, setObsConfirmacao] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calcula saúde instantânea baseando-se no tipo (Tempo vs KM) e o alvo x atual
  const planosProcessados = useMemo(() => {
    return planos.map(plano => {
      let percentualDesgaste = 0;
      let status: 'VERDE' | 'AMARELO' | 'VERMELHO' = 'VERDE';
      let descricaoFalta = '';

      if (plano.tipoIntervalo === 'KM') {
        const kmAtual = plano.veiculo.ultimoKm || 0;
        const alvo = plano.kmProximaManutencao || 0;
        const inicioCiclo = alvo - plano.valorIntervalo;
        const totalPercorridoNoCiclo = Math.max(0, kmAtual - inicioCiclo);
        
        percentualDesgaste = Math.min((totalPercorridoNoCiclo / plano.valorIntervalo) * 100, 100);
        const kmFaltante = alvo - kmAtual;

        if (kmFaltante <= 0) {
          status = 'VERMELHO';
          descricaoFalta = `Estourou por ${Math.abs(kmFaltante).toLocaleString()} KM`;
        } else if (kmFaltante <= 1500) {
          status = 'AMARELO';
          descricaoFalta = `Atenção: Apenas ${kmFaltante.toLocaleString()} KM restantes`;
        } else {
          status = 'VERDE';
          descricaoFalta = `Faltam ${kmFaltante.toLocaleString()} KM`;
        }
      } else {
        const dataAlvo = plano.dataProximaManutencao ? new Date(plano.dataProximaManutencao) : new Date();
        const diasFaltantes = differenceInDays(dataAlvo, new Date());
        
        // Regra simples: O plano.valorIntervalo tá em MESES. Assume media 30d/mes.
        const totalDiasDoCiclo = plano.valorIntervalo * 30;
        const diasPassados = totalDiasDoCiclo - diasFaltantes;
        
        percentualDesgaste = Math.min((diasPassados / totalDiasDoCiclo) * 100, 100);

        if (diasFaltantes <= 0) {
           status = 'VERMELHO';
           descricaoFalta = `Vencido há ${Math.abs(diasFaltantes)} dias`;
        } else if (diasFaltantes <= 15) {
           status = 'AMARELO';
           descricaoFalta = `Vence em ${diasFaltantes} dias`;
        } else {
           status = 'VERDE';
           descricaoFalta = `Seguro por ${diasFaltantes} dias`;
        }
      }

      return { ...plano, percentualDesgaste, status, descricaoFalta };
    });
  }, [planos]);

  // Seletor de cores do semáforo do Card
  const STATUS_CONFIG = {
    VERMELHO: { border: 'border-error/40', bg: 'bg-error/10', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.2)]', icon: ShieldAlert, color: 'text-error' },
    AMARELO:  { border: 'border-warning/40', bg: 'bg-warning/10', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]', icon: AlertTriangle, color: 'text-warning' },
    VERDE:    { border: 'border-border/60', bg: 'bg-surface', glow: 'shadow-sm', icon: CheckCircle, color: 'text-success/80' }
  };

  const abrirModal = (plano: PlanoManutencao) => {
    setPlanoAberto(plano);
    // Sugere o KM real para evitar digitação atoa
    setKmAtualConfirmacao(plano.veiculo.ultimoKm?.toString() || '');
    setObsConfirmacao('');
  };

  const handleRegistrarBaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planoAberto) return;
    
    setIsSubmitting(true);
    try {
      await registrarExecucao.mutateAsync({
        planoId: planoAberto.id,
        kmDaBaixa: kmAtualConfirmacao ? Number(kmAtualConfirmacao) : undefined,
        observacao: obsConfirmacao
      });
      setPlanoAberto(null);
    } catch (err: any) {
      handleApiError(err, 'Falha ao registrar a manutenção.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-text-muted animate-pulse font-mono tracking-widest text-xs uppercase">Buscando rastreabilidade da frota...</div>;
  }

  // Organizar para exibir primeiro os Vencidos (Vermelho) -> (Amarelo) -> (Verdes)
  const ordenados = [...planosProcessados].sort((a,b) => {
    const weights: Record<string, number> = { 'VERMELHO': 0, 'AMARELO': 1, 'VERDE': 2 };
    return weights[a.status] - weights[b.status];
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 bg-surface p-4 rounded-xl border border-border/40">
        <Wrench className="w-5 h-5 text-text-secondary" />
        <div>
           <p className="text-sm font-bold text-text-main">Cockpit de Preventivas Inteligentes</p>
           <p className="text-xs text-text-muted">Cards interativos medindo a saúde da frota baseada no hodômetro e calendário.</p>
        </div>
      </div>

      {/* ─── GRÁFICO BARRA — Saúde da Frota ─── */}
      {ordenados.length > 0 && (
        <div className="bg-surface border border-border/60 rounded-[2rem] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-text-muted" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Saúde da Frota — Desgaste por Intervenção</span>
          </div>
          <GraficoBarraPlanos
            dados={ordenados.map(p => ({
              nome: p.veiculo.placa,
              desgaste: p.percentualDesgaste,
              status: p.status
            }))}
          />
          {/* Legenda */}
          <div className="flex items-center gap-4 justify-center mt-3">
            {[{color:'#34d399',label:'Normal'},{color:'#eab308',label:'Atenção'},{color:'#ef4444',label:'Vencido'}].map(l => (
              <span key={l.label} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-text-muted">
                <span className="w-2.5 h-2.5 rounded" style={{backgroundColor:l.color}} />{l.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {ordenados.map((plano) => {
          const conf = STATUS_CONFIG[plano.status];
          const Icon = conf.icon;

          return (
            <div key={plano.id} className={`relative flex flex-col bg-surface border transition-all duration-300 rounded-[2rem] overflow-hidden ${conf.border} hover:${conf.glow}`}>
               {/* Cabeçalho do Card */}
               <div className={`p-5 pb-3 border-b border-border/20 flex flex-col gap-2 ${conf.bg}`}>
                  <div className="flex justify-between items-start">
                     <div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/80">{plano.veiculo.modelo}</span>
                       <h3 className="text-2xl font-black font-mono text-text-main tracking-tight uppercase leading-none">{plano.veiculo.placa}</h3>
                     </div>
                     <div className={`p-2 rounded-xl bg-background/50 border border-border/20 ${conf.color}`}>
                       <Icon className="w-6 h-6" />
                     </div>
                  </div>
                  <p className="text-sm font-bold text-text-secondary mt-1">{plano.descricao}</p>
               </div>

               {/* Miolo - Termostato/Gauge Linear */}
               <div className="flex-1 p-5 pb-4 space-y-4">
                  <div className="flex justify-between items-end text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                     <span>Progresso ({plano.tipoIntervalo})</span>
                     <span className={conf.color}>{plano.descricaoFalta}</span>
                  </div>

                  {/* Barra Thermostat */}
                  <div className="w-full h-3 bg-surface-hover rounded-full overflow-hidden border border-border/40 shadow-inner">
                     <div 
                       className={`h-full rounded-r-full transition-all duration-1000 ${
                         plano.status === 'VERMELHO' ? 'bg-error' : plano.status === 'AMARELO' ? 'bg-warning' : 'bg-emerald-500'
                       }`}
                       style={{ width: `${Math.max(10, plano.percentualDesgaste)}%`,
                                boxShadow: plano.status === 'VERMELHO' ? '0 0 10px rgba(239,68,68,0.7)' : 'none' 
                       }}
                     />
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-mono text-text-secondary mt-1.5 opacity-80">
                     <span>
                       Atual: {plano.tipoIntervalo === 'KM' ? (plano.veiculo.ultimoKm?.toLocaleString() + ' KM') : 'Hoje'}
                     </span>
                     <span>
                       Alvo: {plano.tipoIntervalo === 'KM' ? (plano.kmProximaManutencao?.toLocaleString() + ' KM') : (plano.dataProximaManutencao ? format(new Date(plano.dataProximaManutencao), 'dd/MM/yyyy') : '--')}
                     </span>
                  </div>
               </div>

               {/* Histórico Mini Timeline Rápida (1 só) */}
               {plano.historicoExecucoes && plano.historicoExecucoes.length > 0 && (
                 <div className="px-5 pb-4 text-[10px] text-text-muted font-medium flex items-center gap-2">
                   <Clock className="w-3.5 h-3.5" /> 
                   Última Baixa: {format(new Date(plano.historicoExecucoes[0].dataExecucao), 'dd/MM/yyyy')} por {plano.historicoExecucoes[0].registradoPor?.nome.split(' ')[0]}
                 </div>
               )}

               {/* Rodapé - O Botão Mágico */}
               <div className="p-4 pt-0">
                  <Button 
                    variant={plano.status === 'VERMELHO' ? 'danger' : 'outline'}
                    className={`w-full group ${plano.status === 'VERMELHO' ? 'bg-error hover:bg-error-500 border-error' : ''}`}
                    onClick={() => abrirModal(plano)}
                  >
                     <Wrench className={`w-4 h-4 mr-2 ${plano.status === 'VERMELHO' ? 'text-white group-hover:animate-spin' : ''}`} /> 
                     {plano.status === 'VERDE' ? 'Anotar Revisão Antecipada' : 'Manutenção Realizada!'}
                  </Button>
               </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE CONFIRMAÇÃO = RECÁLCULO AUTOMÁTICO */}
      <Modal isOpen={!!planoAberto} onClose={() => setPlanoAberto(null)} title="Registrar Conclusão de Plano">
         {planoAberto && (
           <form onSubmit={handleRegistrarBaixa} className="space-y-6 pt-2">
              <div className="bg-surface-hover p-4 rounded-xl border border-border/40 text-sm">
                 Você está registrando a execução de <strong>{planoAberto.descricao}</strong> para o veículo <strong className="font-mono text-text-main">{planoAberto.veiculo.placa}</strong>.
                 <br/><br/>
                 O próximo ciclo será re-engatilhado automaticamente e a meta ({planoAberto.valorIntervalo} {planoAberto.tipoIntervalo === 'KM' ? 'KM' : 'Meses'}) será somada à quilometragem/mês de hoje.
              </div>

              {planoAberto.tipoIntervalo === 'KM' && (
                <div className="space-y-2">
                   <label className="text-sm font-bold text-text-main flex gap-1">KM do Veículo na execução do serviço: <span className="text-error">*</span></label>
                   <Input 
                     type="number"
                     placeholder="Ex: 85200"
                     value={kmAtualConfirmacao}
                     onChange={(e) => setKmAtualConfirmacao(e.target.value)}
                     required
                   />
                   <p className="text-xs text-text-muted">Último KM conhecido pelo rastreador: {planoAberto.veiculo.ultimoKm}</p>
                </div>
              )}

              <div className="space-y-2">
                 <label className="text-sm font-bold text-text-main">Comprovantes ou Observações Adicionais (Opcional):</label>
                 <Input 
                   type="text"
                   placeholder="Ex: Feito na Oficina Center Car, NF 4402 - R$ 680"
                   value={obsConfirmacao}
                   onChange={(e) => setObsConfirmacao(e.target.value)}
                 />
              </div>

              <div className="flex gap-4 pt-4 border-t border-border/40">
                  <Button type="button" variant="outline" onClick={() => setPlanoAberto(null)} className="flex-1 text-text-muted" disabled={isSubmitting}>
                     Cancelar
                  </Button>
                  <Button type="submit" isLoading={isSubmitting} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black tracking-widest uppercase">
                     Salvar & Renovar
                  </Button>
              </div>
           </form>
         )}
      </Modal>
    </div>
  );
}
