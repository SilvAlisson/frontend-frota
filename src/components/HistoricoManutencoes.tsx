import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import { FormEditarManutencao } from './forms/FormEditarManutencao';
import type { OrdemServico, Veiculo, Produto, Fornecedor } from '../types';

interface HistoricoManutencoesProps {
  userRole: string;
  veiculos: Veiculo[];
  produtos: Produto[];
  fornecedores: Fornecedor[];
  filtroInicial?: {
    veiculoId?: string;
    dataInicio?: string;
  };
}

// Ícones Minimalistas
function IconeLixo() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" /></svg>; }
function IconeEditar() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>; }
function IconeLink() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>; }

// Configuração Visual por Tipo (Cores OKLCH)
const tipoConfig: Record<string, { badge: string; border: string; label: string }> = {
  PREVENTIVA: { badge: 'bg-blue-50 text-blue-700 border-blue-200', border: 'border-l-blue-500', label: 'Preventiva' },
  CORRETIVA: { badge: 'bg-amber-50 text-amber-700 border-amber-200', border: 'border-l-amber-500', label: 'Corretiva' },
  LAVAGEM: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', border: 'border-l-emerald-500', label: 'Lavagem' },
};

// Estilos de Input Reutilizáveis
const inputStyle = "w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-sm shadow-sm hover:border-gray-300 font-sans";
const labelStyle = "block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider pl-1 font-sans";

export function HistoricoManutencoes({ userRole, veiculos, produtos, fornecedores, filtroInicial }: HistoricoManutencoesProps) {

  const [historico, setHistorico] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingOS, setEditingOS] = useState<OrdemServico | null>(null);

  const [veiculoIdFiltro, setVeiculoIdFiltro] = useState(filtroInicial?.veiculoId || '');
  const [dataInicioFiltro, setDataInicioFiltro] = useState(filtroInicial?.dataInicio || '');
  const [dataFimFiltro, setDataFimFiltro] = useState('');

  const formatCurrency = (value: number | string | undefined | null) => {
    const num = Number(value) || 0;
    return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('pt-BR', { dateStyle: 'short', timeZone: 'UTC' });

  const fetchHistorico = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (veiculoIdFiltro) params.veiculoId = veiculoIdFiltro;
      if (dataInicioFiltro) params.dataInicio = dataInicioFiltro;
      if (dataFimFiltro) params.dataFim = dataFimFiltro;

      const response = await api.get<OrdemServico[]>('/ordens-servico/recentes', { params });
      setHistorico(response.data);

    } catch (err) {
      console.error("Erro ao buscar histórico:", err);
      toast.error('Falha ao carregar histórico de manutenções.');
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    fetchHistorico();
  }, [veiculoIdFiltro, dataInicioFiltro, dataFimFiltro]);

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Tem certeza que quer REMOVER permanentemente este registro?`)) return;

    setDeletingId(id);
    const promise = api.delete(`/ordem-servico/${id}`);

    toast.promise(promise, {
      loading: 'Removendo OS...',
      success: () => {
        setHistorico(prev => prev.filter(os => os.id !== id));
        setDeletingId(null);
        return 'Registro removido com sucesso.';
      },
      error: (err) => {
        setDeletingId(null);
        return err.response?.data?.error || 'Falha ao remover o registro.';
      }
    });
  };

  const handleExportar = () => {
    if (historico.length === 0) return;

    const exportPromise = new Promise((resolve, reject) => {
      try {
        const dadosFormatados = historico.map(os => {
          const itensFormatados = os.itens.map(item => item.produto.nome).join(', ');
          const custoNum = Number(os.custoTotal) || 0;
          
          return {
            'Data': formatDate(os.data),
            'Placa': os.veiculo?.placa || 'N/A',
            'Modelo': os.veiculo?.modelo || 'Caixa/Equip.',
            'KM Atual': os.kmAtual ? os.kmAtual.toString() : '-',
            'Tipo': os.tipo,
            'Itens/Serviços': itensFormatados,
            'Observações': os.observacoes || '',
            'Oficina/Fornecedor': os.fornecedor.nome,
            'Custo Total (R$)': custoNum.toFixed(2).replace('.', ','),
            'Registrado Por': os.encarregado.nome,
            'Link do Comprovante': os.fotoComprovanteUrl || 'N/A',
          };
        });
        exportarParaExcel(dadosFormatados, "Historico_Manutencoes.xlsx");
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });

    toast.promise(exportPromise, {
      loading: 'Gerando planilha...',
      success: 'Exportação concluída!',
      error: 'Erro ao exportar dados.'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative pb-10">

      {/* MODAL DE EDIÇÃO */}
      {editingOS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <FormEditarManutencao 
              osParaEditar={editingOS}
              veiculos={veiculos}
              produtos={produtos}
              fornecedores={fornecedores}
              onCancel={() => setEditingOS(null)}
              onSuccess={() => {
                setEditingOS(null);
                fetchHistorico();
              }}
            />
          </div>
        </div>
      )}

      {/* HEADER DE COMANDO (Glass Panel) */}
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
              {historico.length} Registros
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
            <p className="text-sm text-gray-500 font-sans">Carregando histórico...</p>
          </div>
        )}

        {!loading && historico.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-center">
            <div className="p-3 bg-white rounded-full mb-3 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium text-sm">Nenhuma manutenção encontrada neste período.</p>
          </div>
        )}

        {!loading && historico.map((os) => {
          // Configuração visual baseada no tipo (borda lateral colorida)
          const visual = tipoConfig[os.tipo] || { border: 'border-l-gray-400', badge: 'bg-gray-100', label: os.tipo };
          
          return (
            <div 
              key={os.id} 
              className={`
                group bg-white p-4 rounded-r-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 
                border-l-[4px] ${visual.border} rounded-l-md
                ${deletingId === os.id ? 'opacity-50 pointer-events-none' : ''}
              `}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                
                {/* Coluna Esquerda: Data e Veículo */}
                <div className="flex items-start gap-4 min-w-[200px]">
                  {/* Bloco de Data Compacto */}
                  <div className="bg-gray-50 px-3 py-2 rounded-lg text-center border border-gray-100 min-w-[70px]">
                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      {new Date(os.data).toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' })}
                    </span>
                    <span className="block text-xl font-bold text-gray-800 leading-none font-mono">
                      {new Date(os.data).getUTCDate()}
                    </span>
                    <span className="block text-[10px] text-gray-400 mt-0.5">
                      {new Date(os.data).getFullYear()}
                    </span>
                  </div>

                  <div>
                    {/* Badge de Tipo */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase mb-1 inline-block ${visual.badge}`}>
                      {visual.label}
                    </span>
                    
                    {/* Identificação do Veículo */}
                    <div className="flex flex-col">
                      {os.veiculo ? (
                        <>
                          <h4 className="text-base font-bold text-gray-900 font-mono tracking-tight">{os.veiculo.placa}</h4>
                          <span className="text-xs text-gray-500 truncate max-w-[150px]">{os.veiculo.modelo}</span>
                        </>
                      ) : (
                        <span className="text-sm font-bold text-gray-500 italic">Caixa / Equipamento</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Coluna Central: Detalhes e Itens */}
                <div className="flex-1 border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0 sm:pl-4 w-full">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>
                      {os.fornecedor.nome}
                    </span>
                    {os.kmAtual && (
                      <span className="text-xs font-mono text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                        KM {Number(os.kmAtual).toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>

                  <ul className="text-sm text-gray-700 space-y-1">
                    {os.itens.map((item, index) => (
                      <li key={index} className="flex justify-between items-center border-b border-dashed border-gray-100 last:border-0 pb-1 last:pb-0">
                        <span className="truncate pr-2">{item.produto.nome}</span>
                        <span className="font-mono text-gray-500 text-xs whitespace-nowrap">
                          {item.quantidade} x {Number(item.valorPorUnidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  {os.observacoes && (
                    <p className="text-xs text-gray-400 mt-2 italic border-l-2 border-gray-100 pl-2">
                      "{os.observacoes}"
                    </p>
                  )}
                </div>

                {/* Coluna Direita: Valor e Ações */}
                <div className="flex flex-row sm:flex-col justify-between items-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <div className="text-left sm:text-right">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
                    <span className="text-lg font-bold text-gray-900 font-mono">{formatCurrency(os.custoTotal)}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {os.fotoComprovanteUrl && (
                      <a href={os.fotoComprovanteUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100" title="Ver Comprovante">
                        <IconeLink />
                      </a>
                    )}

                    {(userRole === 'ADMIN' || userRole === 'ENCARREGADO') && (
                      <Button variant="ghost" className="!p-1.5 h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" onClick={() => setEditingOS(os)} title="Editar">
                        <IconeEditar />
                      </Button>
                    )}

                    {userRole === 'ADMIN' && (
                      <Button variant="ghost" className="!p-1.5 h-8 w-8 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg" onClick={() => handleDelete(os.id)} disabled={deletingId === os.id} title="Excluir">
                        <IconeLixo />
                      </Button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}