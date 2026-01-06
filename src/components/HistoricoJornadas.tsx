import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { toast } from 'sonner';
import { Edit, Trash2, Camera, X } from 'lucide-react'; // <--- ADICIONADO Camera e X
import type { Jornada, Veiculo } from '../types';

// Componentes UI
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ListaResponsiva } from './ui/ListaResponsiva';
import { TableStyles } from '../styles/table';
import { FormEditarJornada } from './forms/FormEditarJornada';

interface JornadaHistorico extends Jornada {
  kmPercorrido?: number;
  // Certifique-se que sua API retorna estes campos.
  // Se o nome for diferente (ex: foto_inicio), ajuste aqui e no código abaixo.
  fotoInicio?: string; 
  fotoFim?: string;
}

interface HistoricoJornadasProps {
  veiculos: Veiculo[];
  userRole?: string;
}

export function HistoricoJornadas({ veiculos, userRole = 'OPERADOR' }: HistoricoJornadasProps) {
  const [historico, setHistorico] = useState<JornadaHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // NOVO: Estado para visualizar a foto
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  // Filtros
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [veiculoId, setVeiculoId] = useState('');

  // Permissões
  const canEdit = ['ADMIN', 'ENCARREGADO'].includes(userRole);
  const canDelete = userRole === 'ADMIN';

  const fetchHistorico = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dataInicio) params.dataInicio = dataInicio;
      if (dataFim) params.dataFim = dataFim;
      if (veiculoId) params.veiculoId = veiculoId;

      const response = await api.get('/jornadas/historico', { params });
      setHistorico(response.data);
    } catch (err) {
      console.error("Erro ao buscar histórico de jornadas:", err);
      toast.error('Não foi possível carregar o histórico.');
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    fetchHistorico();
  }, [dataInicio, dataFim, veiculoId]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("ATENÇÃO: Tem certeza que deseja excluir este registro histórico?")) return;

    setDeletingId(id);
    const promise = api.delete(`/jornadas/${id}`);

    toast.promise(promise, {
      loading: 'Removendo registro...',
      success: () => {
        setHistorico(prev => prev.filter(item => item.id !== id));
        setDeletingId(null);
        return 'Registro excluído com sucesso.';
      },
      error: (err) => {
        console.error("Erro ao excluir:", err);
        setDeletingId(null);
        return 'Erro ao excluir jornada.';
      }
    });
  };

  const handleEdit = (jornada: JornadaHistorico) => {
    setEditingId(jornada.id);
  };

  const handleSuccessEdit = () => {
    setEditingId(null);
    fetchHistorico();
  };

  const handleExportar = () => {
    if (historico.length === 0) return;

    const exportPromise = new Promise((resolve, reject) => {
      try {
        const dados = historico.map(j => {
          const kmAndados = (j.kmFim && j.kmInicio)
            ? j.kmFim - j.kmInicio
            : (j.kmPercorrido || 0);

          return {
            'Saída': new Date(j.dataInicio).toLocaleString('pt-BR'),
            'Chegada': j.dataFim ? new Date(j.dataFim).toLocaleString('pt-BR') : 'Em andamento',
            'Veículo': `${j.veiculo.placa} - ${j.veiculo.modelo}`,
            'Motorista': j.operador.nome,
            'KM Inicial': j.kmInicio,
            'KM Final': j.kmFim || '-',
            'Percorrido (KM)': kmAndados,
            'Observações': j.observacoes || ''
          };
        });
        exportarParaExcel(dados, "Historico_Jornadas.xlsx");
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });

    toast.promise(exportPromise, {
      loading: 'Exportando dados...',
      success: 'Histórico exportado com sucesso!',
      error: 'Erro ao exportar arquivo.'
    });
  };

  return (
    <div className="space-y-6 pb-10">

      {/* HEADER DE COMANDO */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Histórico de Viagens</h2>
            <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full border border-gray-200">
              {historico.length}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Consulte rotas, quilometragem e fotos dos odômetros.</p>
        </div>

        <div className="flex flex-wrap items-end gap-2 w-full xl:w-auto">
          {/* Filtros */}
          <div className="w-full sm:w-32">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1 mb-1 block">De</span>
            <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="bg-white" />
          </div>

          <div className="w-full sm:w-32">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1 mb-1 block">Até</span>
            <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="bg-white" />
          </div>

          <div className="w-full sm:w-56">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1 mb-1 block">Veículo</span>
            <select
              className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              value={veiculoId}
              onChange={(e) => setVeiculoId(e.target.value)}
            >
              <option value="">Todos os Veículos</option>
              {veiculos.map(v => (
                <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>
              ))}
            </select>
          </div>

          <Button variant="success" onClick={handleExportar} disabled={historico.length === 0} className="w-full sm:w-auto h-10">
            Exportar Excel
          </Button>
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
          emptyMessage="Nenhuma viagem encontrada neste período."

          // --- DESKTOP ---
          desktopHeader={
            <>
              <th className={TableStyles.th}>Data / Status</th>
              <th className={TableStyles.th}>Veículo</th>
              <th className={TableStyles.th}>Motorista</th>
              <th className={TableStyles.th}>Distância</th>
              <th className={`${TableStyles.th} text-center`}>Fotos</th> {/* NOVA COLUNA */}
              {(canEdit || canDelete) && <th className={`${TableStyles.th} text-right`}>Ações</th>}
            </>
          }
          renderDesktop={(j) => {
            const kmPercorrido = (j.kmFim && j.kmInicio) ? j.kmFim - j.kmInicio : (j.kmPercorrido || 0);

            return (
              <>
                <td className={TableStyles.td}>
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-gray-900">{new Date(j.dataInicio).toLocaleDateString('pt-BR')}</span>
                    {j.dataFim ? (
                      <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded w-fit border border-green-200">FINALIZADA</span>
                    ) : (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit border border-blue-200 animate-pulse">EM ROTA</span>
                    )}
                  </div>
                </td>
                <td className={TableStyles.td}>
                  <div className="flex flex-col">
                    <span className="font-mono font-bold text-primary">{j.veiculo.placa}</span>
                    <span className="text-xs text-gray-500">{j.veiculo.modelo}</span>
                  </div>
                </td>
                <td className={TableStyles.td}>
                  <span className="font-medium text-gray-700">{j.operador.nome}</span>
                </td>
                <td className={TableStyles.td}>
                  <div className="flex flex-col">
                    <span className="font-mono font-bold text-gray-900">{kmPercorrido > 0 ? `${kmPercorrido} km` : '--'}</span>
                    <span className="text-[10px] text-gray-400">KM {j.kmInicio} → {j.kmFim || '...'}</span>
                  </div>
                </td>
                
                {/* --- NOVA COLUNA DE FOTOS --- */}
                <td className={`${TableStyles.td} text-center`}>
                  <div className="flex justify-center gap-2">
                    {j.fotoInicio && (
                      <button 
                        onClick={() => setViewingPhoto(j.fotoInicio!)}
                        className="p-1.5 rounded-full bg-gray-100 hover:bg-primary/10 text-gray-500 hover:text-primary transition-colors"
                        title="Ver Odômetro Início"
                      >
                        <Camera className="w-4 h-4" />
                        <span className="sr-only">Início</span>
                      </button>
                    )}
                    {j.fotoFim && (
                      <button 
                         onClick={() => setViewingPhoto(j.fotoFim!)}
                         className="p-1.5 rounded-full bg-gray-100 hover:bg-primary/10 text-gray-500 hover:text-primary transition-colors"
                         title="Ver Odômetro Fim"
                      >
                        <Camera className="w-4 h-4" />
                        <span className="sr-only">Fim</span>
                      </button>
                    )}
                    {!j.fotoInicio && !j.fotoFim && <span className="text-gray-300">-</span>}
                  </div>
                </td>

                {(canEdit || canDelete) && (
                  <td className={`${TableStyles.td} text-right`}>
                    <div className="flex justify-end gap-2">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          className="h-8 w-8 !p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => handleEdit(j)}
                          title="Editar registro"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          className="h-8 w-8 !p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(j.id)}
                          disabled={deletingId === j.id}
                          title="Excluir registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </>
            );
          }}

          // --- MOBILE ---
          renderMobile={(j) => {
            const kmPercorrido = (j.kmFim && j.kmInicio) ? j.kmFim - j.kmInicio : (j.kmPercorrido || 0);

            return (
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">{new Date(j.dataInicio).toLocaleDateString('pt-BR')}</span>
                    <span className="text-xs text-gray-500">{new Date(j.dataInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-mono font-bold text-gray-900 text-lg">{kmPercorrido > 0 ? `${kmPercorrido} km` : '--'}</span>
                    {j.dataFim ? (
                      <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200">FINALIZADA</span>
                    ) : (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 animate-pulse">EM ROTA</span>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-3 flex justify-between items-center">
                  <div>
                    <span className="block font-bold text-sm text-primary">{j.veiculo.placa}</span>
                    <span className="block text-xs text-gray-500">{j.veiculo.modelo}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-medium text-gray-700">{j.operador.nome}</span>
                    <span className="block text-[10px] text-gray-400 font-mono">KM {j.kmInicio} → {j.kmFim || '...'}</span>
                  </div>
                </div>

                {/* BOTÕES DE AÇÃO MOBILE (FOTOS + EDITAR/EXCLUIR) */}
                <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-100">
                  {/* Botões de Foto Mobile */}
                  <div className="flex gap-2">
                     {j.fotoInicio && (
                        <button 
                          onClick={() => setViewingPhoto(j.fotoInicio!)}
                          className="flex items-center gap-1 text-xs px-2 py-1 bg-white border border-gray-200 rounded text-gray-600 hover:text-primary hover:border-primary transition-all"
                        >
                          <Camera className="w-3 h-3" /> Início
                        </button>
                     )}
                     {j.fotoFim && (
                        <button 
                          onClick={() => setViewingPhoto(j.fotoFim!)}
                          className="flex items-center gap-1 text-xs px-2 py-1 bg-white border border-gray-200 rounded text-gray-600 hover:text-primary hover:border-primary transition-all"
                        >
                          <Camera className="w-3 h-3" /> Fim
                        </button>
                     )}
                  </div>

                  {(canEdit || canDelete) && (
                    <div className="flex gap-2">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          className="text-xs h-8 px-2 text-blue-600 hover:bg-blue-50 gap-1"
                          onClick={() => handleEdit(j)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          className="text-xs h-8 px-2 text-red-600 hover:bg-red-50 gap-1"
                          onClick={() => handleDelete(j.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          }}
        />
      )}

      {/* MODAL DE EDIÇÃO */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl animate-in zoom-in-95">
            <FormEditarJornada
              jornadaId={editingId}
              onSuccess={handleSuccessEdit}
              onCancelar={() => setEditingId(null)}
            />
          </div>
        </div>
      )}

      {/* --- NOVO: MODAL DE VISUALIZAÇÃO DE FOTO --- */}
      {viewingPhoto && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setViewingPhoto(null)}
        >
          <div className="relative max-w-4xl w-full h-full flex flex-col items-center justify-center">
             <button 
               onClick={() => setViewingPhoto(null)}
               className="absolute top-4 right-4 text-white hover:text-red-400 bg-white/10 rounded-full p-2 transition-all"
             >
               <X className="w-8 h-8" />
             </button>
             <img 
               src={viewingPhoto} 
               alt="Odômetro" 
               className="max-w-full max-h-[85vh] object-contain rounded-lg border-2 border-white/20 shadow-2xl animate-in zoom-in-95"
               onClick={(e) => e.stopPropagation()} // Impede fechar ao clicar na imagem
             />
             <p className="text-white mt-4 text-sm font-medium bg-black/50 px-4 py-2 rounded-full">
               Clique fora ou no X para fechar
             </p>
          </div>
        </div>
      )}

    </div>
  );
}