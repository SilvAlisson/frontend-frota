import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { toast } from 'sonner';
import { FormEditarAbastecimento } from './forms/FormEditarAbastecimento';
import { FormRegistrarAbastecimento } from './forms/FormRegistrarAbastecimento';
import { useAuth } from '../contexts/AuthContext';
import type { Abastecimento } from '../types';
import { FileDown, Calendar, Truck, Droplets, Receipt, Gauge, DollarSign, ChevronDown, Store } from 'lucide-react';
import { GraficoCurvaAbastecimento } from './ui/GraficosFlota';

// --- HOOKS ATÔMICOS ---
import { useVeiculos } from '../hooks/useVeiculos';

// --- DESIGN SYSTEM KLIN ---
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { ListaResponsiva } from './ui/ListaResponsiva';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { DropdownAcoes } from './ui/DropdownAcoes';
import { Modal } from './ui/Modal';
import { ConfirmModal } from './ui/ConfirmModal';
import { DatePicker } from './ui/DatePicker';
import { Lightbox } from './ui/Lightbox';
import { TableStyles } from '../styles/table';

interface HistoricoAbastecimentosProps {
  userRole: string;
  filtroInicial?: {
    veiculoId?: string;
    dataInicio?: string;
  };
}

const ITENS_POR_PAGINA = 20;

// ✨ HELPER DE DATAS BLINDADO PARA ABASTECIMENTOS (Fim do problema de Timezone)
const DateHelper = {
  getDia: (isoDate: string) => {
    if (!isoDate) return '--';
    return isoDate.split('T')[0].split('-')[2];
  },
  getMesCurto: (isoDate: string) => {
    if (!isoDate) return '---';
    const mesIndex = parseInt(isoDate.split('T')[0].split('-')[1], 10) - 1;
    const meses = ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'];
    return meses[mesIndex];
  },
  getCompleta: (isoDate: string) => {
    if (!isoDate) return '---';
    const partes = isoDate.split('T')[0].split('-');
    const dia = partes[2];
    const ano = partes[0];
    const mesIndex = parseInt(partes[1], 10) - 1;
    const meses = ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'];
    return `${dia} ${meses[mesIndex]} ${ano}`;
  },
  getHora: (isoDate: string) => {
    if (!isoDate || !isoDate.includes('T')) return '--:--';
    return isoDate.split('T')[1].substring(0, 5); // Pega apenas HH:mm
  },
  getExcel: (isoDate: string) => {
    if (!isoDate) return '';
    const dataPart = isoDate.split('T')[0].split('-');
    return `${dataPart[2]}/${dataPart[1]}/${dataPart[0]}`;
  }
};

export function HistoricoAbastecimentos({ userRole, filtroInicial }: HistoricoAbastecimentosProps) {
  
  // 📡 BUSCA INDEPENDENTE COM CACHE
  const { data: veiculos = [] } = useVeiculos();

  // --- ESTADOS DE DADOS ---
  const [historico, setHistorico] = useState<Abastecimento[]>([]);
  const [fornecedores, setFornecedores] = useState<{id: string, nome: string}[]>([]); 
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS DE RENDERIZAÇÃO PROGRESSIVA (ANTI-LAG) ---
  const [visibleCount, setVisibleCount] = useState(ITENS_POR_PAGINA);
  
  // --- ESTADOS DE INTERAÇÃO ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [isNovoAbastecimentoOpen, setIsNovoAbastecimentoOpen] = useState(false);

  const { user } = useAuth();

  // --- ESTADOS DE FILTROS ---
  const [dataInicioFiltro, setDataInicioFiltro] = useState(filtroInicial?.dataInicio || '');
  const [dataFimFiltro, setDataFimFiltro] = useState('');
  const [veiculoIdFiltro, setVeiculoIdFiltro] = useState(filtroInicial?.veiculoId || '');
  const [fornecedorIdFiltro, setFornecedorIdFiltro] = useState('');

  const canEdit = ['ADMIN', 'ENCARREGADO'].includes(userRole);

  useEffect(() => {
    if (filtroInicial?.veiculoId) setVeiculoIdFiltro(filtroInicial.veiculoId);
  }, [filtroInicial]);

  useEffect(() => {
    api.get('/fornecedores')
       .then(res => setFornecedores(res.data))
       .catch(err => console.error("Erro ao carregar fornecedores", err));
  }, []);

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

  const historicoFiltrado = useMemo(() => {
    return historico.filter(ab => {
      if (!fornecedorIdFiltro) return true;
      return ab.fornecedor?.id === fornecedorIdFiltro || ab.fornecedorId === fornecedorIdFiltro;
    });
  }, [historico, fornecedorIdFiltro]);

  const totalGasto = useMemo(() => {
    return historicoFiltrado.reduce((acc, ab) => acc + (Number(ab.custoTotal) || 0), 0);
  }, [historicoFiltrado]);

  const totalLitros = useMemo(() => {
    return historicoFiltrado.reduce((acc, ab) => {
      const litrosDoAbastecimento = ab.itens?.reduce((sum, item) => {
        if (item.produto.tipo === 'COMBUSTIVEL') {
          return sum + Number(item.quantidade);
        }
        return sum;
      }, 0) || 0;
      return acc + litrosDoAbastecimento;
    }, 0);
  }, [historicoFiltrado]);

  const historicoVisivel = useMemo(() => {
    return historicoFiltrado.slice(0, visibleCount);
  }, [historicoFiltrado, visibleCount]);

  // Dados para a curva mensal (agrupa por mês/ano)
  const dadosCurva = useMemo(() => {
    const mapa: Record<string, { litros: number; custo: number }> = {};
    historicoFiltrado.forEach(ab => {
      const partes = ab.dataHora.split('T')[0].split('-');
      const mesLabel = `${['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][parseInt(partes[1])-1]}/${partes[0].slice(2)}`;
      if (!mapa[mesLabel]) mapa[mesLabel] = { litros: 0, custo: 0 };
      const litrosAb = (ab.itens || []).reduce((s, it) => it.produto.tipo === 'COMBUSTIVEL' ? s + Number(it.quantidade) : s, 0);
      mapa[mesLabel].litros += litrosAb;
      mapa[mesLabel].custo += Number(ab.custoTotal) || 0;
    });
    // Ordena pelas chaves (mes/ano), pega últimos 6 meses
    return Object.entries(mapa)
      .slice(-6)
      .map(([mes, v]) => ({ mes, litros: parseFloat(v.litros.toFixed(1)), custo: parseFloat(v.custo.toFixed(2)) }));
  }, [historicoFiltrado]);

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

  const handleExportar = () => {
    if (historicoFiltrado.length === 0) {
      toast.warning("Nenhum dado para exportar com estes filtros.");
      return;
    }

    const exportPromise = new Promise((resolve, reject) => {
      try {
        // ✨ MAPA DE DADOS OTIMIZADO PARA O BM (Sem colunas inúteis e Valor como Número Real)
        const dadosFormatados = historicoFiltrado.map(ab => {
          const itensSafe = ab.itens || [];
          const itensFormatados = itensSafe.map(item =>
            `${item.quantidade}${item.produto.tipo === 'COMBUSTIVEL' ? 'L' : 'Un'} ${item.produto.nome}`
          ).join(' | ');

          return {
            'Data do Abastecimento': DateHelper.getExcel(ab.dataHora),
            'Posto / Fornecedor': ab.fornecedor?.nome || 'Não Registrado',
            'Placa do Veículo': ab.veiculo?.placa || 'N/A',
            'Produtos / Combustível': itensFormatados,
            'KM Registrado': ab.kmOdometro,
            'Motorista / Operador': ab.operador?.nome || 'N/A',
            'Valor Total (R$)': Number(ab.custoTotal), // Retorna NÚMERO NATIVO
            'Nota Fiscal': ab.fotoNotaFiscalUrl ? `=HYPERLINK("${ab.fotoNotaFiscalUrl}", "Acessar Comprovante")` : 'Sem anexo'
          };
        });

        let nomeArquivo = "BM_Abastecimentos_Globais.xlsx";
        if (fornecedorIdFiltro) {
            const nomeFornecedor = fornecedores.find(f => f.id === fornecedorIdFiltro)?.nome?.replace(/[^a-zA-Z0-9]/g, '_');
            nomeArquivo = `BM_${nomeFornecedor}.xlsx`;
        }

        exportarParaExcel(dadosFormatados, nomeArquivo);
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });

    toast.promise(exportPromise, {
      loading: 'A preparar exportação...',
      success: 'Boletim de Medição exportado com sucesso!',
      error: 'Erro na exportação.'
    });
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
    { value: "", label: "Todos os Veículos" },
    ...veiculos.map(v => ({ value: v.id, label: v.placa }))
  ], [veiculos]);

  const fornecedoresOptions = useMemo(() => [
    { value: "", label: "Todos os Postos / Oficinas" },
    ...fornecedores.map(f => ({ value: f.id, label: f.nome }))
  ], [fornecedores]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <PageHeader 
        title="Boletim de Abastecimentos"
        subtitle="Filtre por Posto pargerando o Boletim de Medição (BM) com os comprovantes integrados."
        actionLabel={canEdit ? "Novo Abastecimento" : undefined}
        onAction={canEdit ? () => setIsNovoAbastecimentoOpen(true) : undefined}
        extraAction={
          <div className="flex flex-col xl:flex-row gap-3 w-full xl:w-auto items-end bg-surface p-2 rounded-2xl border border-border/60 shadow-sm">
             <div className="flex gap-3 w-full">
               <div className="flex-1">
                  <DatePicker disableFuture
                    label="Data Inicial"
                    placeholder="Início"
                    date={dataInicioFiltro ? new Date(`${dataInicioFiltro}T12:00:00`) : undefined}
                    onChange={date => setDataInicioFiltro(date ? date.toISOString().split('T')[0] : '')}
                  />
               </div>
               <div className="flex-1">
                  <DatePicker disableFuture
                    label="Data Final"
                    placeholder="Fim"
                    date={dataFimFiltro ? new Date(`${dataFimFiltro}T12:00:00`) : undefined}
                    onChange={date => setDataFimFiltro(date ? date.toISOString().split('T')[0] : '')}
                  />
               </div>
             </div>
             
             <div className="w-px h-10 bg-border/60 hidden xl:block mx-1"></div>
             
             <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
               <div className="w-full sm:w-48">
                 <Select 
                   label="Filtrar Veículo"
                   options={veiculosOptions}
                   value={veiculoIdFiltro}
                   onChange={(e) => setVeiculoIdFiltro(e.target.value)}
                   icon={<Truck className="w-4 h-4" />}
                   containerClassName="!mb-0"
                 />
               </div>
               <div className="w-full sm:w-56">
                 <Select 
                   label="Posto / Fornecedor"
                   options={fornecedoresOptions}
                   value={fornecedorIdFiltro}
                   onChange={(e) => setFornecedorIdFiltro(e.target.value)}
                   icon={<Store className="w-4 h-4" />}
                   containerClassName="!mb-0"
                 />
               </div>
             </div>

             <div className="w-full xl:w-auto flex items-end pb-0.5 mt-2 xl:mt-0 xl:ml-auto">
               <Button 
                 variant="secondary" 
                 onClick={handleExportar} 
                 disabled={historicoFiltrado.length === 0}
                 icon={<FileDown className="w-4 h-4" />}
                 className="w-full xl:w-auto h-11 sm:h-12 bg-emerald-500/10 text-emerald-700 dark:text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"
               >
                 Gerar BM (Excel)
               </Button>
             </div>
          </div>
        }
      />

      {/* ─── GRÁFICO DE CURVA MENSAL ─── */}
      {dadosCurva.length > 1 && (
        <div className="bg-surface border border-border/60 rounded-[2rem] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted block">Tendência Mensal de Consumo</span>
              <p className="text-sm font-bold text-text-main mt-0.5">Litros abastecidos nos últimos meses</p>
            </div>
          </div>
          <GraficoCurvaAbastecimento dados={dadosCurva} modo="litros" />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Card className="bg-surface border-border/60 flex flex-col justify-center gap-2 p-6 shadow-sm hover:shadow-md transition-shadow group">
          <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Capital Investido (Relatório Atual)
          </span>
          <span className="text-3xl font-mono font-black text-text-main truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {formatCurrency(totalGasto)}
          </span>
        </Card>
        
        <Card className="bg-surface border-border/60 flex flex-col justify-center gap-2 p-6 shadow-sm hover:shadow-md transition-shadow group">
          <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
            <Droplets className="w-4 h-4 text-sky-500 dark:text-sky-400" /> Litragem Abastecida
          </span>
          <span className="text-3xl font-mono font-black text-text-main group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
            {totalLitros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} <small className="text-lg font-bold opacity-60 ml-1 uppercase tracking-widest">Litros</small>
          </span>
        </Card>
      </div>

      <Card padding="none" className="overflow-hidden border-border/60 shadow-sm rounded-3xl bg-surface">
        {loading ? (
          <div className="p-6 sm:p-8 space-y-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-surface-hover/50 rounded-xl animate-pulse border border-border/30" />)}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <ListaResponsiva
            virtualized={true}
              itens={historicoVisivel}
              emptyMessage="Nenhum abastecimento encontrado com estes filtros."

              desktopHeader={
                <>
                  <th className={`${TableStyles.th} pl-8 py-5 text-left`}>Data e Hora</th>
                  <th className={`${TableStyles.th} text-left`}>Identificação</th>
                  <th className={`${TableStyles.th} text-center`}>Produto Abastecido</th>
                  <th className={`${TableStyles.th} text-center`}>Custo Financeiro</th>
                  <th className={`${TableStyles.th} text-right pr-8`}>Gestão</th>
                </>
              }
              renderDesktop={(ab) => (
                <>
                  <td className={`${TableStyles.td} pl-8`}>
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-text-main flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-text-muted/60" />
                          {/* ✨ HELPER DE DATA NO DESKTOP */}
                          {DateHelper.getCompleta(ab.dataHora)}
                      </span>
                      <span className="text-xs text-text-secondary font-mono ml-6 tracking-widest opacity-80">
                          {DateHelper.getHora(ab.dataHora)}
                      </span>
                    </div>
                  </td>
                  <td className={TableStyles.td}>
                    <div className="flex flex-col gap-1">
                      <span className="font-mono font-black text-primary text-base tracking-tight">{ab.veiculo?.placa || 'N/D'}</span>
                      <span className="text-[11px] text-text-secondary font-bold uppercase tracking-wider">{ab.operador?.nome || 'Sistema'}</span>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-text-main font-bold bg-surface-hover px-2 py-1 rounded-md w-fit border border-border/60">
                          <Gauge className="w-3.5 h-3.5 opacity-60" /> {ab.kmOdometro.toLocaleString('pt-BR')} KM
                      </div>
                    </div>
                  </td>
                  <td className={`${TableStyles.td} text-center`}>
                    <div className="flex flex-col gap-2.5 items-center justify-center">
                      {getCombustivelBadge(ab)}
                      
                      {ab.fotoNotaFiscalUrl && (
                          <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingPhoto(ab.fotoNotaFiscalUrl || '')}
                              aria-label={`Visualizar nota fiscal do abastecimento de ${ab.veiculo?.placa || 'veículo'}`}
                              icon={<Receipt className="w-3.5 h-3.5" />}
                              className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 mx-auto"
                          >
                              Nota Fiscal
                          </Button>
                      )}
                    </div>
                  </td>
                  <td className={`${TableStyles.td} text-center`}>
                    <div className="flex flex-col gap-1 items-center justify-center">
                        <span className="font-mono font-black text-text-main text-base inline-block w-full">{formatCurrency(ab.custoTotal)}</span>
                        <span className="text-[11px] text-text-secondary font-bold flex items-center gap-1.5 bg-surface-hover w-fit px-1.5 py-0.5 rounded border border-border/50 mx-auto">
                            <Droplets className="w-3 h-3 text-sky-500 dark:text-sky-400" />
                            {(ab.itens || []).map(i => `${i.quantidade}${i.produto.tipo === 'COMBUSTIVEL' ? 'L' : 'un'}`).join(' + ')}
                        </span>
                    </div>
                  </td>
                  <td className={`${TableStyles.td} text-right pr-8`}>
                    <DropdownAcoes 
                      onEditar={canEdit ? () => setEditingId(ab.id) : undefined}
                      onExcluir={userRole === 'ADMIN' ? () => setDeletingId(ab.id) : undefined}
                    />
                  </td>
                </>
              )}

              renderMobile={(ab) => (
                <div className="p-5 flex flex-col gap-4 border-b border-border/60 last:border-0 hover:bg-surface-hover/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      {/* ✨ HELPER DE DATA NO MOBILE */}
                      <div className="bg-surface shadow-sm text-text-main p-2 rounded-xl border border-border/80 flex flex-col items-center justify-center w-14 h-14 shrink-0">
                        <span className="text-lg font-black leading-none">{DateHelper.getDia(ab.dataHora)}</span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted mt-0.5">
                          {DateHelper.getMesCurto(ab.dataHora)}
                        </span>
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
                      <Button
                        variant="ghost"
                        onClick={() => setViewingPhoto(ab.fotoNotaFiscalUrl || '')}
                        aria-label={`Visualizar nota fiscal do abastecimento de ${ab.veiculo?.placa || 'veículo'}`}
                        icon={<Receipt className="w-4 h-4" />}
                        className="w-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 hover:bg-sky-500/20"
                      >
                        Visualizar Nota de Serviço
                      </Button>
                  )}
                </div>
              )}
            />

            {historicoVisivel.length < historicoFiltrado.length && (
               <div className="p-6 border-t border-border/60 bg-surface-hover/30 flex justify-center">
                  <Button 
                    variant="secondary" 
                    onClick={handleCarregarMais}
                    className="w-full sm:w-auto bg-surface hover:shadow-md transition-all group"
                  >
                     Carregar mais {Math.min(ITENS_POR_PAGINA, historicoFiltrado.length - historicoVisivel.length)} registros
                     <ChevronDown className="w-4 h-4 ml-2 text-text-muted group-hover:text-primary transition-colors" />
                  </Button>
               </div>
            )}
          </div>
        )}
      </Card>

      <Modal 
        isOpen={isNovoAbastecimentoOpen} 
        onClose={() => setIsNovoAbastecimentoOpen(false)}
        title="Novo Abastecimento"
        className="max-w-2xl"
      >
        {isNovoAbastecimentoOpen && (
          <FormRegistrarAbastecimento
            usuarioLogado={user || undefined}
            onSuccess={() => {
              setIsNovoAbastecimentoOpen(false);
              fetchHistorico();
            }}
            onCancelar={() => setIsNovoAbastecimentoOpen(false)}
          />
        )}
      </Modal>

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
        description="Tem certeza que deseja remover este Registro de forma permanente? O cálculo de média de consumo da frota será recalculado."
        confirmLabel="Sim, Excluir Registro"
        variant="danger"
      />

      {/* ✅ NC4 RESOLVIDA — Lightbox centralizado com focus trap, ESC e acessibilidade */}
      <Lightbox
        src={viewingPhoto}
        alt="Nota Fiscal do Abastecimento"
        caption="Nota Fiscal"
        onClose={() => setViewingPhoto(null)}
      />

    </div>
  );
}


