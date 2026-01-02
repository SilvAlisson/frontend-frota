import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { toast } from 'sonner';
import { FormEditarAbastecimento } from './forms/FormEditarAbastecimento';
import type { Abastecimento, Veiculo } from '../types';

// Componentes UI
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ListaResponsiva } from './ui/ListaResponsiva';
import { TableStyles } from '../styles/table'; // Assumindo que você tem isso padronizado

// Ícones (Mantidos locais para facilitar seu copy-paste, mas idealmente mover para arquivo separado)
function IconeLixo() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" /></svg>; }
function IconeEditar() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>; }
function IconeFoto() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>; }

interface HistoricoAbastecimentosProps {
  userRole: string;
  veiculos: Veiculo[];
  filtroInicial?: {
    veiculoId?: string;
    dataInicio?: string;
  };
}

export function HistoricoAbastecimentos({ userRole, veiculos, filtroInicial }: HistoricoAbastecimentosProps) {
  const [historico, setHistorico] = useState<Abastecimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filtros
  const [dataInicioFiltro, setDataInicioFiltro] = useState(filtroInicial?.dataInicio || '');
  const [dataFimFiltro, setDataFimFiltro] = useState('');
  const [veiculoIdFiltro, setVeiculoIdFiltro] = useState(filtroInicial?.veiculoId || '');

  // Permissão
  const canEdit = ['ADMIN', 'ENCARREGADO'].includes(userRole);

  useEffect(() => {
    if (filtroInicial?.veiculoId) setVeiculoIdFiltro(filtroInicial.veiculoId);
  }, [filtroInicial]);

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

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Tem certeza que quer REMOVER este abastecimento?`)) return;

    try {
      await api.delete(`/abastecimentos/${id}`);
      setHistorico(prev => prev.filter(ab => ab.id !== id));
      toast.success('Abastecimento removido.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao remover.');
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
          const itensFormatados = ab.itens.map(item => `${item.produto.nome} (${item.quantidade} ${item.produto.tipo === 'COMBUSTIVEL' ? 'L' : 'Un'})`).join(', ');
          const custoNum = Number(ab.custoTotal) || 0;

          return {
            'Data': new Date(ab.dataHora).toLocaleDateString('pt-BR'),
            'Placa': ab.veiculo.placa,
            'Modelo': ab.veiculo.modelo,
            'KM': ab.kmOdometro,
            'Combustível/Itens': itensFormatados,
            'Fornecedor': ab.fornecedor.nome,
            'Operador': ab.operador.nome,
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

  const formatCurrency = (value: number | string) => {
    const num = Number(value) || 0;
    return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6 pb-10">

      {/* HEADER DE COMANDO */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Abastecimentos</h2>
          <p className="text-sm text-gray-500">Controle de combustível e consumo.</p>
        </div>

        <div className="flex flex-wrap items-end gap-2 w-full xl:w-auto">
          <div className="w-full sm:w-32">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1 mb-1 block">De</span>
            <Input type="date" value={dataInicioFiltro} onChange={(e) => setDataInicioFiltro(e.target.value)} className="bg-white" />
          </div>

          <div className="w-full sm:w-32">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1 mb-1 block">Até</span>
            <Input type="date" value={dataFimFiltro} onChange={(e) => setDataFimFiltro(e.target.value)} className="bg-white" />
          </div>

          <div className="w-full sm:w-56">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1 mb-1 block">Veículo</span>
            <select
              className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              value={veiculoIdFiltro}
              onChange={(e) => setVeiculoIdFiltro(e.target.value)}
            >
              <option value="">Todos os veículos</option>
              {veiculos.map(v => (
                <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Contador de registros */}
            <span className="text-[10px] bg-white px-2 py-2.5 rounded border border-gray-200 text-gray-400 font-mono hidden sm:block whitespace-nowrap h-10 flex items-center">
              {historico.length} Reg.
            </span>

            <Button variant="success" onClick={handleExportar} disabled={historico.length === 0} className="w-full sm:w-auto h-10">
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* LISTAGEM RESPONSIVA */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-50 rounded-xl animate-pulse border border-gray-100" />)}
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
              <th className={TableStyles.th}>Fornecedor / Itens</th>
              <th className={TableStyles.th}>Valor Total</th>
              <th className={`${TableStyles.th} text-right`}>Ações</th>
            </>
          }
          renderDesktop={(ab) => (
            <>
              <td className={TableStyles.td}>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-gray-900">{new Date(ab.dataHora).toLocaleDateString('pt-BR')}</span>
                  <span className="text-xs text-gray-500">{new Date(ab.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </td>
              <td className={TableStyles.td}>
                <div className="flex flex-col">
                  <span className="font-mono font-bold text-primary">{ab.veiculo.placa}</span>
                  <span className="text-xs text-gray-900 font-medium">{ab.operador.nome}</span>
                  <span className="text-[10px] text-gray-400">KM {ab.kmOdometro.toLocaleString('pt-BR')}</span>
                </div>
              </td>
              <td className={TableStyles.td}>
                <div className="flex flex-col max-w-[250px]">
                  <span className="text-sm font-medium text-gray-900 truncate">{ab.fornecedor.nome}</span>
                  {/* Lista de itens no Desktop */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ab.itens.map((i, idx) => (
                      <span key={idx} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-gray-600 whitespace-nowrap">
                        {i.produto.nome}: {i.quantidade}{i.produto.tipo === 'COMBUSTIVEL' ? 'L' : 'un'}
                      </span>
                    ))}
                  </div>
                </div>
              </td>
              <td className={TableStyles.td}>
                <span className="font-mono font-bold text-gray-900">{formatCurrency(ab.custoTotal)}</span>
              </td>
              <td className={`${TableStyles.td} text-right`}>
                <div className="flex justify-end gap-1">
                  {ab.fotoNotaFiscalUrl && (
                    <a href={ab.fotoNotaFiscalUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors" title="Ver Nota Fiscal">
                      <IconeFoto />
                    </a>
                  )}
                  {canEdit && (
                    <Button variant="ghost" className="h-8 w-8 !p-0 text-gray-400 hover:text-blue-600" onClick={() => setEditingId(ab.id)}>
                      <IconeEditar />
                    </Button>
                  )}
                  {userRole === 'ADMIN' && (
                    <Button variant="ghost" className="h-8 w-8 !p-0 text-gray-400 hover:text-red-600" onClick={() => handleDelete(ab.id)}>
                      <IconeLixo />
                    </Button>
                  )}
                </div>
              </td>
            </>
          )}

          // --- MOBILE  ---
          renderMobile={(ab) => (
            <div className="p-4 border-l-[4px] border-l-primary rounded-l-md">
              <div className="flex justify-between items-start pl-2 mb-3">
                <div className="flex gap-3">
                  <div className="bg-orange-50 text-orange-600 p-1.5 rounded-lg border border-orange-200 flex flex-col items-center justify-center w-12 h-12">
                    <span className="text-sm font-bold leading-none">{new Date(ab.dataHora).getDate()}</span>
                    <span className="text-[9px] uppercase font-bold">{new Date(ab.dataHora).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-mono font-bold text-gray-900">{ab.veiculo.placa}</span>
                    <span className="text-xs text-gray-500">{ab.operador.nome}</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="font-mono font-bold text-gray-900">{formatCurrency(ab.custoTotal)}</span>
                  <span className="text-[10px] text-gray-400 bg-gray-50 px-1 rounded mt-1 border border-gray-100">KM {ab.kmOdometro}</span>
                </div>
              </div>

              <div className="bg-gray-50/50 p-2 rounded-lg mb-3 border border-gray-100 mx-2">
                <p className="text-xs text-gray-600 font-medium mb-1">
                  {ab.fornecedor.nome}
                </p>
                {/* [RESTAURADO] Lista detalhada com bullet points */}
                <div className="space-y-1 border-t border-gray-200 pt-1">
                  {ab.itens.map((item, idx) => (
                    <div key={idx} className="text-xs text-gray-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary/60 rounded-full"></span>
                      <span className="font-medium">{item.produto.nome}</span>
                      <span className="text-gray-400 font-mono">
                        {item.quantidade} {item.produto.tipo === 'COMBUSTIVEL' ? 'L' : 'un'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-dashed border-gray-200 pt-2 pr-2">
                {ab.fotoNotaFiscalUrl && (
                  <a href={ab.fotoNotaFiscalUrl} target="_blank" className="text-xs flex items-center gap-1 text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">
                    <IconeFoto /> Nota
                  </a>
                )}
                {canEdit && (
                  <Button variant="ghost" className="text-xs h-7 px-2" onClick={() => setEditingId(ab.id)}>Editar</Button>
                )}
                {userRole === 'ADMIN' && (
                  <Button variant="ghost" className="text-xs h-7 px-2 text-red-600 hover:bg-red-50" onClick={() => handleDelete(ab.id)}>Excluir</Button>
                )}
              </div>
            </div>
          )}
        />
      )}

      {/* MODAL DE EDIÇÃO */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 p-6">
            <FormEditarAbastecimento
              abastecimentoId={editingId}
              onSuccess={() => {
                setEditingId(null);
                fetchHistorico();
              }}
              onCancel={() => setEditingId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}