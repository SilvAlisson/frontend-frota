import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { toast } from 'sonner';
import { Trash2, Edit, ExternalLink, Calendar, Filter } from 'lucide-react';
import type { OrdemServico, Veiculo, Produto, Fornecedor } from '../types';

// Componentes UI
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ListaResponsiva } from './ui/ListaResponsiva';
import { TableStyles } from '../styles/table';
import { FormEditarManutencao } from './forms/FormEditarManutencao';

interface HistoricoManutencoesProps {
  userRole: string;
  veiculos: Veiculo[];
  produtos: Produto[];
  fornecedores: Fornecedor[];
  filtroInicial?: { veiculoId?: string; dataInicio?: string; };
}

export function HistoricoManutencoes({
  userRole,
  veiculos,
  produtos,
  fornecedores,
  filtroInicial
}: HistoricoManutencoesProps) {
  // Estados
  const [historico, setHistorico] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOS, setEditingOS] = useState<OrdemServico | null>(null);

  // Filtros
  const [filtros, setFiltros] = useState({
    veiculoId: filtroInicial?.veiculoId || '',
    dataInicio: filtroInicial?.dataInicio || '',
    dataFim: ''
  });

  const handleFiltroChange = (key: keyof typeof filtros, value: string) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  const fetchHistorico = useCallback(async () => {
    setLoading(true);
    try {
      // Tipagem correta para os parâmetros
      const params: Record<string, string> = {};
      if (filtros.veiculoId) params.veiculoId = filtros.veiculoId;
      if (filtros.dataInicio) params.dataInicio = filtros.dataInicio;
      if (filtros.dataFim) params.dataFim = filtros.dataFim;

      const response = await api.get<OrdemServico[]>('/ordens-servico/recentes', { params });
      setHistorico(response.data);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar histórico de manutenções.');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    fetchHistorico();
  }, [fetchHistorico]);

  const handleDelete = async (id: string) => {
    // Idealmente substituir window.confirm por um Dialog do seu UI Kit
    if (!window.confirm("Esta ação é irreversível. Deseja continuar?")) return;

    try {
      await api.delete(`/ordens-servico/${id}`);
      setHistorico(prev => prev.filter(os => os.id !== id));
      toast.success('Registro removido com sucesso.');
    } catch (error) {
      toast.error('Não foi possível remover o registro.');
    }
  };

  const handleExportar = () => {
    const dados = historico.map(os => ({
      'Data': new Date(os.data).toLocaleDateString('pt-BR'),
      'Placa': os.veiculo?.placa || 'N/A',
      'Tipo': os.tipo,
      'Fornecedor': os.fornecedor.nome,
      'Valor Total': os.custoTotal
    }));
    exportarParaExcel(dados, "Historico_Manutencoes.xlsx");
  };

  // Renderização do Modal de Edição
  if (editingOS) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-white/20">
          <FormEditarManutencao
            osParaEditar={editingOS}
            veiculos={veiculos}
            produtos={produtos}
            fornecedores={fornecedores}
            onCancel={() => setEditingOS(null)}
            onSuccess={() => { setEditingOS(null); fetchHistorico(); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER E FILTROS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Manutenções
            <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
              {historico.length} registros
            </span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">Gerencie preventivas, corretivas e lavagens.</p>
        </div>

        <div className="flex flex-wrap items-end gap-3 w-full xl:w-auto bg-gray-50/50 p-3 rounded-xl border border-border/50">
          {/* Inputs de Data */}
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-36">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Início
              </label>
              <Input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => handleFiltroChange('dataInicio', e.target.value)}
                className="bg-white h-9 text-xs"
              />
            </div>
            <div className="w-full sm:w-36">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Fim
              </label>
              <Input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => handleFiltroChange('dataFim', e.target.value)}
                className="bg-white h-9 text-xs"
              />
            </div>
          </div>

          {/* Select Veículo */}
          <div className="w-full sm:w-48">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1 mb-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Veículo
            </label>
            <select
              className="w-full h-9 px-3 bg-white border border-border rounded-md text-xs focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              value={filtros.veiculoId}
              onChange={(e) => handleFiltroChange('veiculoId', e.target.value)}
            >
              <option value="">Todos</option>
              {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa}</option>)}
            </select>
          </div>

          <Button variant="secondary" onClick={handleExportar} className="h-9 text-xs px-4">
            Exportar
          </Button>
        </div>
      </div>

      {/* LISTA DE DADOS */}
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <ListaResponsiva
          itens={historico}
          emptyMessage="Nenhuma manutenção encontrada com os filtros atuais."

          // --- DESKTOP ---
          desktopHeader={
            <>
              <th className={TableStyles.th}>Data / Tipo</th>
              <th className={TableStyles.th}>Veículo</th>
              <th className={TableStyles.th}>Fornecedor / Peças</th>
              <th className={TableStyles.th}>Custo</th>
              <th className={`${TableStyles.th} text-right`}>Ações</th>
            </>
          }
          renderDesktop={(os) => (
            <>
              <td className={TableStyles.td}>
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-gray-700 font-semibold text-sm">
                    {new Date(os.data).toLocaleDateString('pt-BR')}
                  </span>
                  <BadgeTipo tipo={os.tipo} />
                </div>
              </td>
              <td className={TableStyles.td}>
                <div className="flex flex-col">
                  <span className="font-bold text-primary text-sm">{os.veiculo?.placa || 'Equipamento'}</span>
                  <span className="text-[11px] text-gray-400">{os.veiculo?.modelo || '-'}</span>
                </div>
              </td>
              <td className={TableStyles.td}>
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-900 text-sm">{os.fornecedor.nome}</span>
                  <p className="text-xs text-gray-500 truncate max-w-[220px]" title={os.itens.map(i => i.produto.nome).join(', ')}>
                    {os.itens.map(i => i.produto.nome).join(', ')}
                  </p>
                </div>
              </td>
              <td className={TableStyles.td}>
                <span className="font-mono font-medium text-gray-900 text-sm">
                  {Number(os.custoTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </td>
              <td className={`${TableStyles.td} text-right`}>
                <div className="flex justify-end items-center gap-1">
                  {os.fotoComprovanteUrl && (
                    <a
                      href={os.fotoComprovanteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                      title="Ver Comprovante"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {['ADMIN', 'ENCARREGADO'].includes(userRole) && (
                    <Button variant="ghost" className="h-8 w-8 !p-0 text-gray-400 hover:text-blue-600" onClick={() => setEditingOS(os)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {userRole === 'ADMIN' && (
                    <Button variant="ghost" className="h-8 w-8 !p-0 text-gray-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(os.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </td>
            </>
          )}

          // --- MOBILE ---
          renderMobile={(os) => (
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-gray-900 block">{new Date(os.data).toLocaleDateString('pt-BR')}</span>
                  <span className="text-xs text-gray-500">{os.fornecedor.nome}</span>
                </div>
                <div className="text-right">
                  <span className="block font-mono font-bold text-gray-900 mb-1">
                    {Number(os.custoTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <BadgeTipo tipo={os.tipo} />
                </div>
              </div>

              <div className="bg-gray-50/50 p-3 rounded-lg border border-border/60">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm text-primary">{os.veiculo?.placa || 'Equipamento'}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {os.itens.map(i => i.produto.nome).join(', ')}
                </p>
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-3">
                {os.fotoComprovanteUrl && (
                  <a href={os.fotoComprovanteUrl} target="_blank" className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1.5 rounded-md hover:bg-blue-100 transition-colors">
                    <ExternalLink className="w-3 h-3" /> Comprovante
                  </a>
                )}

                <div className="flex items-center gap-1">
                  {['ADMIN', 'ENCARREGADO'].includes(userRole) && (
                    <Button variant="ghost" className="h-7 text-xs px-2 text-gray-600" onClick={() => setEditingOS(os)}>
                      Editar
                    </Button>
                  )}
                  {userRole === 'ADMIN' && (
                    <Button variant="ghost" className="h-7 text-xs px-2 text-red-600 hover:bg-red-50" onClick={() => handleDelete(os.id)}>
                      Excluir
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}

// --- Subcomponentes e Helpers ---

function BadgeTipo({ tipo }: { tipo: string }) {
  const styles: Record<string, string> = {
    'PREVENTIVA': 'bg-blue-50 text-blue-700 border-blue-200',
    'CORRETIVA': 'bg-amber-50 text-amber-700 border-amber-200',
    'LAVAGEM': 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border w-fit ${styles[tipo] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {tipo}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-20 bg-gray-50/50 rounded-xl animate-pulse border border-border/60" />
      ))}
    </div>
  )
}