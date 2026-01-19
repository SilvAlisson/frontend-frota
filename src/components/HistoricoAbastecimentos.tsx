import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { toast } from 'sonner';
import { FormEditarAbastecimento } from './forms/FormEditarAbastecimento';
import type { Abastecimento, Veiculo } from '../types';
import { FileDown, Calendar, Truck, Droplets, Receipt, Gauge } from 'lucide-react';

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
  veiculos: Veiculo[];
  filtroInicial?: {
    veiculoId?: string;
    dataInicio?: string;
  };
}

export function HistoricoAbastecimentos({ userRole, veiculos, filtroInicial }: HistoricoAbastecimentosProps) {
  // Estados de Dados
  const [historico, setHistorico] = useState<Abastecimento[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de Interação
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtros
  const [dataInicioFiltro, setDataInicioFiltro] = useState(filtroInicial?.dataInicio || '');
  const [dataFimFiltro, setDataFimFiltro] = useState('');
  const [veiculoIdFiltro, setVeiculoIdFiltro] = useState(filtroInicial?.veiculoId || '');

  const canEdit = ['ADMIN', 'ENCARREGADO'].includes(userRole);

  // Sincroniza filtro inicial se mudar
  useEffect(() => {
    if (filtroInicial?.veiculoId) setVeiculoIdFiltro(filtroInicial.veiculoId);
  }, [filtroInicial]);

  // Busca de Dados
  const fetchHistorico = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dataInicioFiltro) params.dataInicio = dataInicioFiltro;
      if (dataFimFiltro) params.dataFim = dataFimFiltro;
      if (veiculoIdFiltro) params.veiculoId = veiculoIdFiltro;

      const response = await api.get('/abastecimentos/recentes', { params });
      setHistorico(response.data);
    } catch (err) {
      console.error("Erro ao buscar histórico:", err);
      toast.error('Falha ao carregar abastecimentos.');
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    fetchHistorico();
  }, [dataInicioFiltro, dataFimFiltro, veiculoIdFiltro]);

  // Ações
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
    if (historico.length === 0) {
      toast.warning("Nenhum dado para exportar.");
      return;
    }

    const exportPromise = new Promise((resolve, reject) => {
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
            'Total (R$)': custoNum.toFixed(2).replace('.', ','),
          };
        });
        exportarParaExcel(dadosFormatados, "Historico_Abastecimentos.xlsx");
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });

    toast.promise(exportPromise, {
      loading: 'Exportando...',
      success: 'Planilha pronta!',
      error: 'Erro na exportação.'
    });
  };

  // Formatadores e Helpers
  const formatCurrency = (value: number | string) => {
    const num = Number(value) || 0;
    return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const getCombustivelBadge = (ab: Abastecimento) => {
    // Tenta deduzir o tipo principal pelos itens
    const itemCombustivel = ab.itens?.find(i => i.produto.tipo === 'COMBUSTIVEL');
    const nome = itemCombustivel ? itemCombustivel.produto.nome : 'Outros';
    
    // Mapeamento simples de cor por nome
    const nomeUpper = nome.toUpperCase();
    let variant: "neutral" | "warning" | "success" | "info" = "neutral";
    
    if (nomeUpper.includes('DIESEL')) variant = "neutral"; // Diesel geralmente preto/cinza
    if (nomeUpper.includes('GASOLINA')) variant = "warning"; // Inflamável
    if (nomeUpper.includes('ETANOL')) variant = "success"; // Verde
    if (nomeUpper.includes('ARLA')) variant = "info"; // Azul

    return <Badge variant={variant}>{nome}</Badge>;
  };

  // Opções para o Select de Veículos
  const veiculosOptions = [
    { value: "", label: "Todos os veículos" },
    ...veiculos.map(v => ({ value: v.id, label: `${v.placa} - ${v.modelo}` }))
  ];

  return (
    <div className="space-y-6 pb-10">

      {/* 1. HEADER E FILTROS */}
      <PageHeader 
        title="Histórico de Abastecimentos"
        subtitle="Monitore custos, consumo e médias de combustível."
        extraAction={
          <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
             <div className="w-full sm:w-32">
               <Input 
                 type="date" 
                 label="De" 
                 value={dataInicioFiltro} 
                 onChange={(e) => setDataInicioFiltro(e.target.value)} 
               />
             </div>
             <div className="w-full sm:w-32">
               <Input 
                 type="date" 
                 label="Até" 
                 value={dataFimFiltro} 
                 onChange={(e) => setDataFimFiltro(e.target.value)} 
               />
             </div>
             <div className="w-full sm:w-56">
               <Select 
                 label="Veículo"
                 options={veiculosOptions}
                 value={veiculoIdFiltro}
                 onChange={(e) => setVeiculoIdFiltro(e.target.value)}
                 icon={<Truck className="w-4 h-4" />}
               />
             </div>
             <div className="flex items-end pb-0.5">
               <Button 
                 variant="success" 
                 onClick={handleExportar} 
                 disabled={historico.length === 0}
                 icon={<FileDown className="w-4 h-4" />}
                 className="w-full sm:w-auto"
               >
                 Exportar
               </Button>
             </div>
          </div>
        }
      />

      {/* 2. TABELA (CARD) */}
      <Card noPadding>
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <ListaResponsiva
            itens={historico}
            emptyMessage="Nenhum abastecimento encontrado neste período."

            // --- DESKTOP ---
            desktopHeader={
              <>
                <th className={TableStyles.th}>Data / Hora</th>
                <th className={TableStyles.th}>Veículo / Operador</th>
                <th className={TableStyles.th}>Combustível / Nota</th>
                <th className={TableStyles.th}>Valor Total</th>
                <th className={`${TableStyles.th} text-right`}>Ações</th>
              </>
            }
            renderDesktop={(ab) => (
              <>
                <td className={TableStyles.td}>
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(ab.dataHora).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-xs text-gray-500 ml-5">
                        {new Date(ab.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </td>
                <td className={TableStyles.td}>
                  <div className="flex flex-col">
                    <span className="font-mono font-bold text-primary">{ab.veiculo?.placa || 'Sem placa'}</span>
                    <span className="text-xs text-gray-500 font-medium">{ab.operador?.nome || 'Sem operador'}</span>
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded w-fit border border-gray-100">
                        <Gauge className="w-3 h-3" /> {ab.kmOdometro.toLocaleString('pt-BR')} km
                    </div>
                  </div>
                </td>
                <td className={TableStyles.td}>
                  <div className="flex flex-col gap-2 items-start">
                    {getCombustivelBadge(ab)}
                    
                    {ab.fotoNotaFiscalUrl && (
                        <a 
                            href={ab.fotoNotaFiscalUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium hover:underline"
                        >
                            <Receipt className="w-3 h-3" /> Ver Nota Fiscal
                        </a>
                    )}
                  </div>
                </td>
                <td className={TableStyles.td}>
                  <div className="flex flex-col">
                      <span className="font-mono font-bold text-gray-900">{formatCurrency(ab.custoTotal)}</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Droplets className="w-3 h-3" />
                          {(ab.itens || []).map(i => `${i.quantidade}${i.produto.tipo === 'COMBUSTIVEL' ? 'L' : 'un'}`).join(' + ')}
                      </span>
                  </div>
                </td>
                <td className={`${TableStyles.td} text-right`}>
                  <DropdownAcoes 
                    onEditar={canEdit ? () => setEditingId(ab.id) : undefined}
                    onExcluir={userRole === 'ADMIN' ? () => setDeletingId(ab.id) : undefined}
                  />
                </td>
              </>
            )}

            // --- MOBILE ---
            renderMobile={(ab) => (
              <div className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    {/* Data Box */}
                    <div className="bg-gray-50 text-gray-600 p-1.5 rounded-lg border border-gray-200 flex flex-col items-center justify-center w-12 h-12 shrink-0">
                      <span className="text-sm font-bold leading-none">{new Date(ab.dataHora).getDate()}</span>
                      <span className="text-[9px] uppercase font-bold">{new Date(ab.dataHora).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                    </div>
                    
                    {/* Infos Principais */}
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-gray-900">{ab.veiculo?.placa || 'Sem Placa'}</span>
                      <span className="text-xs text-gray-500">{ab.fornecedor?.nome}</span>
                    </div>
                  </div>

                  <DropdownAcoes 
                    onEditar={canEdit ? () => setEditingId(ab.id) : undefined}
                    onExcluir={userRole === 'ADMIN' ? () => setDeletingId(ab.id) : undefined}
                  />
                </div>

                {/* Detalhes Mobile */}
                <div className="grid grid-cols-2 gap-2 border-t border-dashed border-gray-100 pt-3">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Valor</span>
                        <span className="font-mono font-bold text-gray-900">{formatCurrency(ab.custoTotal)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Combustível</span>
                        {getCombustivelBadge(ab)}
                    </div>
                </div>
                
                {ab.fotoNotaFiscalUrl && (
                    <a href={ab.fotoNotaFiscalUrl} target="_blank" className="bg-blue-50 text-blue-600 text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors">
                        <Receipt className="w-4 h-4" /> Visualizar Nota Fiscal
                    </a>
                )}
              </div>
            )}
          />
        )}
      </Card>

      {/* --- MODAIS --- */}

      {/* Edição */}
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

      {/* Confirmação de Exclusão */}
      <ConfirmModal 
        isOpen={!!deletingId}
        onCancel={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Excluir Abastecimento"
        description="Tem certeza que deseja remover este registro? Isso afetará o cálculo de média de consumo do veículo."
        confirmLabel="Sim, remover"
        variant="danger"
      />

    </div>
  );
}