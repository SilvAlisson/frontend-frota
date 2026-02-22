import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { toast } from 'sonner';
import { FormEditarAbastecimento } from './forms/FormEditarAbastecimento';
import type { Abastecimento } from '../types';
import { FileDown, Calendar, Truck, Droplets, Receipt, Gauge, DollarSign, ChevronDown } from 'lucide-react';

// --- HOOKS ATÔMICOS ---
import { useVeiculos } from '../hooks/useVeiculos';

// --- DESIGN SYSTEM KLIN ---
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { ListaResponsiva } from './ui/ListaResponsiva';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { DropdownAcoes } from './ui/DropdownAcoes';
import { Modal } from './ui/Modal';
import { ConfirmModal } from './ui/ConfirmModal';
import { TableStyles } from '../styles/table';

interface HistoricoAbastecimentosProps {
  userRole: string;
  filtroInicial?: {
    veiculoId?: string;
    dataInicio?: string;
  };
}

const ITENS_POR_PAGINA = 20;

export function HistoricoAbastecimentos({ userRole, filtroInicial }: HistoricoAbastecimentosProps) {
  
  const { data: veiculos = [] } = useVeiculos();

  const [historico, setHistorico] = useState<Abastecimento[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [visibleCount, setVisibleCount] = useState(ITENS_POR_PAGINA);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [dataInicioFiltro, setDataInicioFiltro] = useState(filtroInicial?.dataInicio || '');
  const [dataFimFiltro, setDataFimFiltro] = useState('');
  const [veiculoIdFiltro, setVeiculoIdFiltro] = useState(filtroInicial?.veiculoId || '');

  const canEdit = ['ADMIN', 'ENCARREGADO'].includes(userRole);

  useEffect(() => {
    if (filtroInicial?.veiculoId) setVeiculoIdFiltro(filtroInicial.veiculoId);
  }, [filtroInicial]);

  const fetchHistorico = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dataInicioFiltro) params.dataInicio = dataInicioFiltro;
      if (dataFimFiltro) params.dataFim = dataFimFiltro;
      if (veiculoIdFiltro) params.veiculoId = veiculoIdFiltro;

      const response = await api.get('/abastecimentos/recentes', { params });
      setHistorico(response.data);
      setVisibleCount(ITENS_POR_PAGINA);
    } catch (err) {
      console.error("Erro ao buscar histórico:", err);
      toast.error('Falha ao carregar abastecimentos.');
    } finally {
      setLoading(false);
    }
  }, [dataInicioFiltro, dataFimFiltro, veiculoIdFiltro]);

  useEffect(() => {
    fetchHistorico();
  }, [fetchHistorico]);

  const totalGasto = useMemo(() => {
    return historico.reduce((acc, ab) => acc + (Number(ab.custoTotal) || 0), 0);
  }, [historico]);

  const totalLitros = useMemo(() => {
    return historico.reduce((acc, ab) => {
      const litrosDoAbastecimento = ab.itens?.reduce((sum, item) => {
        if (item.produto.tipo === 'COMBUSTIVEL') {
          return sum + Number(item.quantidade);
        }
        return sum;
      }, 0) || 0;
      return acc + litrosDoAbastecimento;
    }, 0);
  }, [historico]);

  const historicoVisivel = useMemo(() => {
    return historico.slice(0, visibleCount);
  }, [historico, visibleCount]);

  const handleCarregarMais = () => {
    setVisibleCount(prev => prev + ITENS_POR_PAGINA);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/abastecimentos/${deletingId}`);
      setHistorico(prev => prev.filter(ab => ab.id !== deletingId));
      toast.success('Abastecimento removido.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao remover.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportar = async () => {
    if (historico.length === 0) {
      toast.warning("Nenhum dado para exportar.");
      return;
    }

    try {
      const dadosFormatados = historico.flatMap(ab => {
        const itensSafe = ab.itens || [];
        const itensFormatados = itensSafe.map(item =>
          `${item.produto.nome} (${item.quantidade} ${item.produto.tipo === 'COMBUSTIVEL' ? 'L' : 'Un'})`
        ).join(', ');

        const custoNum = Number(ab.custoTotal) || 0;

        return {
          'Data': new Date(ab.dataHora).toLocaleDateString('pt-BR'),
          'Placa': ab.veiculo?.placa || 'N/A',
          'Modelo': ab.veiculo?.modelo || 'N/A',
          'KM': ab.kmOdometro,
          'Combustível/Itens': itensFormatados,
          'Fornecedor': ab.fornecedor?.nome || 'N/A',
          'Operador': ab.operador?.nome || 'N/A',
          'Total (R$)': custoNum, // Deixamos como Number para o Excel poder somar
        };
      });
      
      exportarParaExcel(dadosFormatados, "Historico_Abastecimentos.xlsx");
      toast.success("Planilha transferida com sucesso!");
    } catch (err) {
      toast.error("Erro na exportação.");
    }
  };

  const formatCurrency = (value: number | string) => {
    const num = Number(value) || 0;
    return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const getCombustivelBadge = (ab: Abastecimento) => {
    const itemCombustivel = ab.itens?.find(i => i.produto.tipo === 'COMBUSTIVEL');
    const nome = itemCombustivel ? itemCombustivel.produto.nome : 'Outros';
    
    const nomeUpper = nome.toUpperCase();
    let variant: "neutral" | "warning" | "success" | "info" = "neutral";
    
    if (nomeUpper.includes('DIESEL')) variant = "neutral";
    if (nomeUpper.includes('GASOLINA')) variant = "warning";
    if (nomeUpper.includes('ETANOL')) variant = "success";
    if (nomeUpper.includes('ARLA')) variant = "info";

    return <Badge variant={variant}>{nome}</Badge>;
  };

  const veiculosOptions = useMemo(() => [
    { value: "", label: "Visão Global" },
    ...veiculos.map(v => ({ value: v.id, label: `${v.placa} - ${v.modelo}` }))
  ], [veiculos]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* 1. HEADER E FILTROS */}
      <PageHeader 
        title="Histórico de Abastecimentos"
        subtitle="Monitore custos, consumo e médias de combustível de forma centralizada."
        extraAction={
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-end bg-surface p-2 rounded-2xl border border-border/60 shadow-sm">
             <div className="w-full sm:w-36">
               <Input 
                 type="date" 
                 label="Data Inicial" 
                 value={dataInicioFiltro} 
                 onChange={(e) => setDataInicioFiltro(e.target.value)} 
                 containerClassName="!mb-0"
               />
             </div>
             <div className="w-full sm:w-36">
               <Input 
                 type="date" 
                 label="Data Final" 
                 value={dataFimFiltro} 
                 onChange={(e) => setDataFimFiltro(e.target.value)} 
                 containerClassName="!mb-0"
               />
             </div>
             <div className="w-px h-10 bg-border/60 hidden sm:block mx-1"></div>
             <div className="w-full sm:w-64">
               <Select 
                 label="Filtrar Veículo"
                 options={veiculosOptions}
                 value={veiculoIdFiltro}
                 onChange={(e) => setVeiculoIdFiltro(e.target.value)}
                 icon={<Truck className="w-4 h-4" />}
                 containerClassName="!mb-0"
               />
             </div>
             <div className="flex items-end pb-0.5 w-full sm:w-auto ml-auto">
               <Button 
                 variant="secondary" 
                 onClick={handleExportar} 
                 disabled={historico.length === 0}
                 icon={<FileDown className="w-4 h-4" />}
                 className="w-full sm:w-auto h-11 sm:h-12 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/20"
               >
                 Exportar Excel
               </Button>
             </div>
          </div>
        }
      />

      {/* 2. SUMÁRIO DA CONSULTA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Card className="bg-surface border-border/60 flex flex-col justify-center gap-2 p-6 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" /> Capital Investido
          </span>
          <span className="text-3xl font-mono font-black text-text-main truncate">
            {formatCurrency(totalGasto)}
          </span>
        </Card>
        
        <Card className="bg-surface border-border/60 flex flex-col justify-center gap-2 p-6 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
            <Droplets className="w-4 h-4 text-sky-500" /> Litragem Abastecida
          </span>
          <span className="text-3xl font-mono font-black text-text-main">
            {totalLitros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} <small className="text-lg font-bold opacity-60 ml-1 uppercase tracking-widest">Litros</small>
          </span>
        </Card>
      </div>

      {/* 3. TABELA (CARD) COM LARGURAS TRAVADAS ✨ */}
      <Card padding="none" className="overflow-hidden border-border/60 shadow-sm rounded-3xl bg-surface">
        <div className="overflow-x-auto"> {/* Garante scroll sem quebrar em monitores pequenos */}
          {loading ? (
            <div className="p-6 sm:p-8 space-y-4">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-surface-hover/50 rounded-xl animate-pulse border border-border/30" />)}
            </div>
          ) : (
            <div className="flex flex-col h-full min-w-[900px]"> {/* Trava a largura mínima do contentor da tabela */}
              <ListaResponsiva
                itens={historicoVisivel}
                emptyMessage="Nenhum abastecimento encontrado neste período."

                // ✨ DESKTOP HEADER COM LARGURAS TRAVADAS
                desktopHeader={
                  <>
                    <th className={`${TableStyles.th} w-44 min-w-[11rem] pl-8 py-5`}>Data e Hora</th>
                    <th className={`${TableStyles.th} w-auto min-w-[16rem]`}>Identificação</th>
                    <th className={`${TableStyles.th} w-48 min-w-[12rem]`}>Produto Abastecido</th>
                    <th className={`${TableStyles.th} w-40 min-w-[10rem] text-right`}>Custo Financeiro</th>
                    <th className={`${TableStyles.th} w-24 min-w-[6rem] text-right pr-8`}>Gestão</th>
                  </>
                }

                // ✨ DESKTOP ROW COM AS MESMAS LARGURAS TRAVADAS
                renderDesktop={(ab) => (
                  <tr className="hover:bg-surface-hover/50 transition-colors group border-b border-border/40 last:border-0">
                    <td className={`${TableStyles.td} w-44 min-w-[11rem] pl-8`}>
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-text-main flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-text-muted/60" />
                            {new Date(ab.dataHora).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-xs text-text-secondary font-mono ml-6 tracking-widest opacity-80">
                            {new Date(ab.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className={`${TableStyles.td} w-auto min-w-[16rem]`}>
                      <div className="flex flex-col gap-1 truncate">
                        <span className="font-mono font-black text-primary text-base tracking-tight truncate">{ab.veiculo?.placa || 'N/D'}</span>
                        <span className="text-[11px] text-text-secondary font-bold uppercase tracking-wider truncate" title={ab.operador?.nome}>{ab.operador?.nome || 'Sistema'}</span>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-text-main font-bold bg-surface-hover px-2 py-1 rounded-md w-fit border border-border/60">
                            <Gauge className="w-3.5 h-3.5 opacity-60" /> {ab.kmOdometro.toLocaleString('pt-BR')} KM
                        </div>
                      </div>
                    </td>
                    <td className={`${TableStyles.td} w-48 min-w-[12rem]`}>
                      <div className="flex flex-col gap-2.5 items-start">
                        {getCombustivelBadge(ab)}
                        
                        {ab.fotoNotaFiscalUrl && (
                            <a 
                                href={ab.fotoNotaFiscalUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-sky-600 hover:text-sky-700 bg-sky-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                            >
                                <Receipt className="w-3.5 h-3.5" /> Anexo
                            </a>
                        )}
                      </div>
                    </td>
                    <td className={`${TableStyles.td} w-40 min-w-[10rem] text-right`}>
                      <div className="flex flex-col items-end gap-1">
                          <span className="font-mono font-black text-text-main text-base">{formatCurrency(ab.custoTotal)}</span>
                          <span className="text-[11px] text-text-secondary font-bold flex items-center gap-1.5 bg-surface-hover w-fit px-1.5 py-0.5 rounded border border-border/50">
                              <Droplets className="w-3 h-3 text-sky-500" />
                              {(ab.itens || []).map(i => `${i.quantidade}${i.produto.tipo === 'COMBUSTIVEL' ? 'L' : 'un'}`).join(' + ')}
                          </span>
                      </div>
                    </td>
                    <td className={`${TableStyles.td} w-24 min-w-[6rem] text-right pr-8`}>
                      <DropdownAcoes 
                        onEditar={canEdit ? () => setEditingId(ab.id) : undefined}
                        onExcluir={userRole === 'ADMIN' ? () => setDeletingId(ab.id) : undefined}
                      />
                    </td>
                  </tr>
                )}

                // --- MOBILE ---
                renderMobile={(ab) => (
                  <div className="p-5 flex flex-col gap-4 border-b border-border/60 last:border-0 hover:bg-surface-hover/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="bg-surface shadow-sm text-text-main p-2 rounded-xl border border-border/80 flex flex-col items-center justify-center w-14 h-14 shrink-0">
                          <span className="text-lg font-black leading-none">{new Date(ab.dataHora).getDate()}</span>
                          <span className="text-[9px] uppercase font-bold tracking-widest text-text-muted mt-0.5">{new Date(ab.dataHora).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                        </div>
                        
                        <div className="flex flex-col justify-center">
                          <span className="font-mono font-black text-primary text-lg tracking-tight leading-none">{ab.veiculo?.placa || 'Sem Placa'}</span>
                          <span className="text-xs text-text-secondary font-medium mt-1">{ab.fornecedor?.nome || 'Fornecedor Local'}</span>
                        </div>
                      </div>

                      <DropdownAcoes 
                        onEditar={canEdit ? () => setEditingId(ab.id) : undefined}
                        onExcluir={userRole === 'ADMIN' ? () => setDeletingId(ab.id) : undefined}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-surface-hover/50 p-3 rounded-xl border border-border/40">
                        <div className="flex flex-col">
                            <span className="text-[9px] text-text-muted uppercase font-black tracking-widest mb-0.5">Custo</span>
                            <span className="font-mono font-black text-text-main">{formatCurrency(ab.custoTotal)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] text-text-muted uppercase font-black tracking-widest mb-1.5">Produto</span>
                            {getCombustivelBadge(ab)}
                        </div>
                    </div>
                    
                    {ab.fotoNotaFiscalUrl && (
                        <a href={ab.fotoNotaFiscalUrl} target="_blank" className="bg-sky-50 text-sky-700 border border-sky-100 text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 hover:bg-sky-100 transition-colors shadow-sm cursor-pointer">
                            <Receipt className="w-4 h-4" /> Visualizar Nota Fiscal
                        </a>
                    )}
                  </div>
                )}
              />

              {historicoVisivel.length < historico.length && (
                 <div className="p-6 border-t border-border/60 bg-surface-hover/30 flex justify-center">
                   <Button 
                     variant="secondary" 
                     onClick={handleCarregarMais}
                     className="w-full sm:w-auto bg-surface hover:shadow-md transition-all group"
                   >
                      Carregar mais {Math.min(ITENS_POR_PAGINA, historico.length - historicoVisivel.length)} registros
                      <ChevronDown className="w-4 h-4 ml-2 text-text-muted group-hover:text-primary transition-colors" />
                   </Button>
                 </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* --- MODAIS --- */}
      <Modal 
        isOpen={!!editingId} 
        onClose={() => setEditingId(null)}
        title="Editar Abastecimento"
        className="max-w-2xl"
      >
        {editingId && (
          <FormEditarAbastecimento
            abastecimentoId={editingId}
            onSuccess={() => {
              setEditingId(null);
              fetchHistorico();
            }}
            onCancel={() => setEditingId(null)}
          />
        )}
      </Modal>

      <ConfirmModal 
        isOpen={!!deletingId}
        onCancel={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Excluir Abastecimento"
        description="Tem a certeza que deseja remover este registo de forma permanente? O cálculo de média de consumo da frota será recalculado."
        confirmLabel="Sim, Excluir Registo"
        variant="danger"
      />

    </div>
  );
}