import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import { FormEditarAbastecimento } from './forms/FormEditarAbastecimento';

interface ItemAbastecimento {
  quantidade: number;
  produto: {
    nome: string;
    tipo: string;
  };
}

interface Abastecimento {
  id: string;
  dataHora: string;
  kmOdometro: number;
  custoTotal: number | string; 
  fotoNotaFiscalUrl: string | null;
  veiculo: {
    placa: string;
    modelo: string;
  };
  operador: {
    nome: string;
  };
  fornecedor: {
    nome: string;
  };
  itens: ItemAbastecimento[];
}

interface HistoricoAbastecimentosProps {
  userRole: string;
  veiculos: any[];
  filtroInicial?: {
    veiculoId?: string;
    dataInicio?: string;
  };
}

// Ícones Minimalistas
function IconeFoto() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>; }
function IconeLixo() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" /></svg>; }
function IconeEditar() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>; }

// Estilos de Input Reutilizáveis
const inputStyle = "w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-sm shadow-sm hover:border-gray-300 font-sans";
const labelStyle = "block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider pl-1 font-sans";

export function HistoricoAbastecimentos({ userRole, veiculos, filtroInicial }: HistoricoAbastecimentosProps) {

  const [historico, setHistorico] = useState<Abastecimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Estado para controlar qual item está sendo editado
  const [editingId, setEditingId] = useState<string | null>(null);

  const [dataInicioFiltro, setDataInicioFiltro] = useState(filtroInicial?.dataInicio || '');
  const [dataFimFiltro, setDataFimFiltro] = useState('');
  const [veiculoIdFiltro, setVeiculoIdFiltro] = useState(filtroInicial?.veiculoId || '');

  // Permissão: Admin e Encarregado podem editar
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
      toast.error('Falha ao carregar histórico de abastecimentos.');
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    fetchHistorico();
  }, [dataInicioFiltro, dataFimFiltro, veiculoIdFiltro]);

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Tem certeza que quer REMOVER este registro?`)) return;

    setDeletingId(id);
    const promise = api.delete(`/abastecimentos/${id}`); // Garantir plural se a rota for plural

    toast.promise(promise, {
      loading: 'Removendo...',
      success: () => {
        setHistorico(prev => prev.filter(ab => ab.id !== id));
        setDeletingId(null);
        return 'Registro removido.';
      },
      error: (err) => {
        setDeletingId(null);
        return err.response?.data?.error || 'Erro ao remover.';
      }
    });
  };

  // Conversão Segura de Moeda
  const formatCurrency = (value: number | string) => {
    const num = Number(value) || 0;
    return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };
  
  // Formatador de Data/Hora Clean
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
        day: date.getDate().toString().padStart(2, '0'),
        month: date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase(),
        year: date.getFullYear(),
        time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
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
            'Data/Hora': new Date(ab.dataHora).toLocaleString('pt-BR'),
            'Placa': ab.veiculo.placa,
            'Modelo': ab.veiculo.modelo,
            'KM': ab.kmOdometro,
            'Itens': itensFormatados,
            'Fornecedor': ab.fornecedor.nome,
            'Operador': ab.operador.nome,
            'Total (R$)': custoNum.toFixed(2).replace('.', ','),
            'Nota Fiscal': ab.fotoNotaFiscalUrl || 'N/A',
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative pb-10">

      {/* HEADER DE FILTROS (Glass Panel) */}
      <div className="glass-panel p-1 rounded-xl sticky top-0 z-10 mb-6">
        <div className="flex flex-wrap gap-4 p-3 bg-white/50 rounded-lg items-end justify-between">
          
          <div className="flex flex-wrap gap-3 w-full lg:w-auto items-end">
            <div className="w-full sm:w-32">
              <label className={labelStyle}>De</label>
              <input type="date" className={inputStyle} value={dataInicioFiltro} onChange={(e) => setDataInicioFiltro(e.target.value)} />
            </div>
            <div className="w-full sm:w-32">
              <label className={labelStyle}>Até</label>
              <input type="date" className={inputStyle} value={dataFimFiltro} onChange={(e) => setDataFimFiltro(e.target.value)} />
            </div>
            <div className="w-full sm:w-56">
              <label className={labelStyle}>Veículo</label>
              <div className="relative">
                <select 
                  className={inputStyle} 
                  value={veiculoIdFiltro} 
                  onChange={(e) => setVeiculoIdFiltro(e.target.value)}
                >
                  <option value="">Todos os veículos</option>
                  {veiculos.map(v => (
                    <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-auto flex items-center gap-3">
            <span className="text-[10px] bg-white px-2 py-1 rounded border border-gray-200 text-gray-400 font-mono hidden sm:block">
              {historico.length} Reg.
            </span>
            <Button
              variant="success"
              onClick={handleExportar}
              disabled={historico.length === 0 || loading}
              className="w-full sm:w-auto shadow-sm"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              }
            >
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* LISTA DE CARDS (Design Industrial) */}
      <div className="space-y-3">

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 opacity-60">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-primary mb-3"></div>
            <p className="text-sm text-gray-500 font-sans">Carregando dados...</p>
          </div>
        )}

        {!loading && historico.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-center">
            <div className="p-3 bg-white rounded-full mb-3 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium text-sm">Nenhum abastecimento encontrado.</p>
          </div>
        )}

        {!loading && historico.map((ab) => {
          const dateInfo = formatDateTime(ab.dataHora);
          
          return (
            <div 
              key={ab.id} 
              className={`
                group bg-white p-4 rounded-r-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 
                border-l-[4px] border-l-primary rounded-l-md
                ${deletingId === ab.id ? 'opacity-50 pointer-events-none' : ''}
              `}
            >
              {/* Linha Superior: Info Principal */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-4">
                  {/* Bloco de Data Compacto */}
                  <div className="bg-gray-50 px-2.5 py-1.5 rounded-lg text-center border border-gray-100 min-w-[70px]">
                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">{dateInfo.month}</span>
                    <span className="block text-xl font-bold text-gray-800 leading-none font-mono">{dateInfo.day}</span>
                    <span className="block text-[10px] text-gray-400">{dateInfo.time}</span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-gray-900 font-mono flex items-center gap-2">
                      {ab.veiculo.placa}
                      <span className="text-[10px] font-sans font-normal text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                        {ab.veiculo.modelo}
                      </span>
                    </h4>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                      <span className="font-medium text-gray-600">{ab.fornecedor.nome}</span>
                      <span className="text-gray-300">•</span>
                      <span>Op: {ab.operador.nome}</span>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1">
                  {ab.fotoNotaFiscalUrl && (
                    <a
                      href={ab.fotoNotaFiscalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                      title="Ver Nota Fiscal"
                    >
                      <IconeFoto />
                    </a>
                  )}

                  {/* BOTÃO EDITAR (Para Admin e Encarregado) */}
                  {canEdit && (
                    <Button
                      variant="ghost"
                      className="!p-1.5 h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      onClick={() => setEditingId(ab.id)}
                      title="Editar"
                      icon={<IconeEditar />}
                    />
                  )}

                  {userRole === 'ADMIN' && (
                    <Button
                      variant="ghost"
                      className="!p-1.5 h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      onClick={() => handleDelete(ab.id)}
                      disabled={deletingId === ab.id}
                      title="Remover"
                      icon={<IconeLixo />}
                    />
                  )}
                </div>
              </div>

              {/* Linha Inferior: Detalhes e Valores */}
              <div className="bg-gray-50/50 rounded-lg p-3 flex flex-wrap justify-between items-end gap-4 border border-gray-100/50">
                <div className="space-y-1">
                  {ab.itens.map((item, idx) => (
                    <div key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary/60 rounded-full"></span>
                      <span className="font-medium">{item.produto.nome}</span>
                      <span className="text-gray-400 text-xs font-mono">
                        {item.quantidade} {item.produto.tipo === 'COMBUSTIVEL' ? 'L' : 'un'}
                      </span>
                    </div>
                  ))}
                  <div className="text-xs text-gray-400 pl-3.5 pt-1 font-mono">
                    KM {ab.kmOdometro.toLocaleString('pt-BR')}
                  </div>
                </div>

                <div className="text-right">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total</span>
                  <span className="text-lg font-bold text-gray-900 font-mono">{formatCurrency(ab.custoTotal)}</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* MODAL DE EDIÇÃO */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-in zoom-in-95 duration-200">
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