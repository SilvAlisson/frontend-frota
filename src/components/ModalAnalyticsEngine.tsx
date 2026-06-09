import { useState, useEffect } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import type { DrilldownDataPoint, MetricType } from '../types/analytics';
import { PieChartDrilldown } from './charts/PieChartDrilldown';
import { BarChartTemporal } from './charts/BarChartTemporal';
import { ANALYTICS_STRATEGIES } from '../hooks/useAnalyticsStrategy';

interface ModalAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
  metric: MetricType;
  title: string;
}

export function ModalAnalyticsEngine({ isOpen, onClose, metric, title }: ModalAnalyticsProps) {
  const [level, setLevel] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [loading, setLoading] = useState(false);

  const [dataNivel1, setDataNivel1] = useState<DrilldownDataPoint[]>([]);
  const [dataNivel2, setDataNivel2] = useState<DrilldownDataPoint[]>([]);
  const [dataNivel3, setDataNivel3] = useState<DrilldownDataPoint[]>([]);
  const [dataNivel4, setDataNivel4] = useState<DrilldownDataPoint[]>([]);
  const [dataNivel5, setDataNivel5] = useState<import('../types/analytics').TicketDrilldown[]>([]);

  const [selectedVeiculo, setSelectedVeiculo] = useState<string | null>(null);
  const [selectedVeiculoId, setSelectedVeiculoId] = useState<string | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [selectedMes, setSelectedMes] = useState<string | null>(null);
  const [selectedFornecedor, setSelectedFornecedor] = useState<string | null>(null);
  
  useEffect(() => {
    if (isOpen && metric) {
      setLevel(1);
      setSelectedVeiculo(null);
      setSelectedVeiculoId(null);
      setSelectedCategoria(null);
      setSelectedMes(null);
      setSelectedFornecedor(null);
      loadMacroData();
    }
  }, [isOpen, metric]);

  const loadMacroData = async () => {
    if (!metric) return;
    setLoading(true);
    try {
      const strategy = ANALYTICS_STRATEGIES[metric];
      const data = await strategy.fetchMacro();
      setDataNivel1(data);
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error(err);
      toast.error("Erro ao carregar dados macro");
    } finally {
      setLoading(false);
    }
  };

  const handleSliceClickNivel1 = async (entry: DrilldownDataPoint) => {
    if (!metric) return;
    setSelectedVeiculo(entry.name);
    setSelectedVeiculoId(entry.veiculoId || null);
    setLoading(true);

    try {
      const strategy = ANALYTICS_STRATEGIES[metric];
      const nextLevel = strategy.getNextLevelFrom1();
      
      if (nextLevel === 2) {
        const data = await strategy.fetchLevel2(entry.veiculoId);
        setDataNivel2(data);
        setLevel(2);
      } else {
        // Para métricas que pulam do 1 pro 3 (ex: Combustível)
        const catDisplay = metric === 'OFICINA' ? 'Manutenção' : metric === 'ADITIVOS' ? 'Aditivos' : 'Abastecimento';
        setSelectedCategoria(catDisplay);
        const data = await strategy.fetchLevel3(entry.veiculoId);
        setDataNivel3(data);
        setLevel(3);
      }
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error(err);
      toast.error("Erro ao carregar detalhes");
    } finally {
      setLoading(false);
    }
  };

  const handleSliceClickNivel2 = async (entry: DrilldownDataPoint) => {
    if (!metric) return;
    setSelectedCategoria(entry.name);
    setLoading(true);
    try {
      const strategy = ANALYTICS_STRATEGIES[metric];
      const data = await strategy.fetchLevel3(selectedVeiculoId, entry.name);
      setDataNivel3(data);
      setLevel(3);
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error(err);
      toast.error("Erro ao carregar evolução temporal");
    } finally {
      setLoading(false);
    }
  };

  const handleSliceClickNivel3 = async (entry: DrilldownDataPoint) => {
    if (!metric) return;
    setSelectedMes(entry.name);
    setLoading(true);
    try {
      const strategy = ANALYTICS_STRATEGIES[metric];
      const data = await strategy.fetchLevel4(selectedVeiculoId, selectedCategoria, entry.name);
      setDataNivel4(data);
      setLevel(4);
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error(err);
      toast.error("Erro ao carregar detalhamento final");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 bg-background/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-surface glass-premium border border-border/50 rounded-[2rem] w-full max-w-6xl h-[85vh] flex flex-col shadow-float overflow-hidden relative">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between p-6 sm:px-8 border-b border-border/40 bg-surface-hover/20">
          <div className="flex items-center gap-4">
            {level > 1 && (
              <Button variant="ghost" size="icon" onClick={() => setLevel((l) => (l - 1) as 1 | 2 | 3)} className="hover:-translate-x-1 transition-transform">
                <ArrowLeft className="w-5 h-5 text-text-secondary" />
              </Button>
            )}
            <div>
              <h2 className="text-2xl sm:text-3xl font-header font-black text-text-main tracking-tight flex items-center gap-2">
                {title}
              </h2>
              <p className="text-sm font-medium text-text-secondary mt-1">
                {level === 1 && "Visão Macro - Clique em um elemento para detalhar"}
                {level === 2 && `Visão por Veículo: ${selectedVeiculo} - Selecione a categoria`}
                {level === 3 && `Evolução Mensal: ${selectedCategoria ? selectedCategoria : selectedVeiculo}`}
                {level === 4 && `${metric === 'KM_TOTAL' || metric === 'EFICIENCIA' ? 'Operadores' : metric === 'CUSTO_KM' ? 'Breakdown de Custos' : 'Top Fornecedores'}: ${selectedMes} (${selectedCategoria ? selectedCategoria : selectedVeiculo})`}
                {level === 5 && `Tickets do Fornecedor: ${selectedFornecedor} - ${selectedMes}`}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-danger/10 hover:text-danger">
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 sm:p-8 relative overflow-auto">
          {loading ? (
            <div className="w-full h-full min-h-[400px] sm:min-h-[650px] flex flex-col gap-8 animate-in fade-in duration-500">
              <div className="flex justify-center mb-4">
                <div className="w-64 h-64 sm:w-96 sm:h-96 rounded-full border-[20px] border-surface-hover/50 border-t-primary/20 animate-spin" />
              </div>
              <div className="flex justify-center gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-24 h-6 bg-surface-hover/50 rounded-md animate-pulse" />
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full h-full min-h-[400px] sm:min-h-[650px]">
              
              {/* NÍVEL 1: PIE CHART MACRO */}
              {level === 1 && (
                <PieChartDrilldown 
                  data={dataNivel1} 
                  metric={metric} 
                  onClickSlice={handleSliceClickNivel1} 
                />
              )}

              {/* NÍVEL 2: PIE CHART VEÍCULO */}
              {level === 2 && (
                <PieChartDrilldown 
                  data={dataNivel2} 
                  metric={metric} 
                  onClickSlice={handleSliceClickNivel2} 
                />
              )}

              {/* NÍVEL 3: BAR CHART TEMPORAL */}
              {level === 3 && (
                <BarChartTemporal 
                  data={dataNivel3} 
                  metric={metric} 
                  onClickBar={handleSliceClickNivel3} 
                />
              )}

              {/* NÍVEL 4: PIE CHART FORNECEDORES */}
              {level === 4 && (
                <PieChartDrilldown 
                  data={dataNivel4} 
                  metric={metric} 
                  onClickSlice={async (entry) => {
                    if (!metric) return;
                    const strategy = ANALYTICS_STRATEGIES[metric];
                    if (!strategy.fetchLevel5) {
                       toast.info("Não há mais níveis de detalhamento.");
                       return;
                    }
                    setSelectedFornecedor(entry.name);
                    setLoading(true);
                    try {
                      const data = await strategy.fetchLevel5(selectedVeiculoId, selectedCategoria, selectedMes, entry.name);
                      setDataNivel5(data);
                      setLevel(5);
                    } catch (err: unknown) {
                      toast.error("Erro ao carregar tickets do fornecedor");
                    } finally {
                      setLoading(false);
                    }
                  }} 
                />
              )}

              {/* NÍVEL 5: TABELA DE TICKETS */}
              {level === 5 && (
                <div className="w-full h-full overflow-auto rounded-xl border border-border/50 bg-surface/50">
                  <table className="w-full text-left text-sm text-text-main">
                    <thead className="bg-surface-hover/50 text-xs uppercase text-text-secondary sticky top-0 backdrop-blur-md">
                      <tr>
                        <th className="px-6 py-4 font-medium">Data</th>
                        <th className="px-6 py-4 font-medium">Placa</th>
                        <th className="px-6 py-4 font-medium">Serviço/Produto</th>
                        <th className="px-6 py-4 font-medium text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {dataNivel5.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-text-muted">Nenhum ticket encontrado.</td>
                        </tr>
                      ) : (
                        dataNivel5.map(ticket => (
                          <tr key={ticket.id} className="hover:bg-surface-hover/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">{new Date(ticket.data).toLocaleDateString('pt-BR')}</td>
                            <td className="px-6 py-4 font-mono text-primary/80">{ticket.placa || '-'}</td>
                            <td className="px-6 py-4">{ticket.servicoProduto}</td>
                            <td className="px-6 py-4 text-right font-medium">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticket.valor)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}