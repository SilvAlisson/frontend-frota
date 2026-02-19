import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { toast } from 'sonner';
import { Edit, Trash2, Camera, X, ImageOff, Download, Filter, Calendar, Activity } from 'lucide-react';
import type { Jornada } from '../types';

// --- HOOKS ATÔMICOS ---
import { useVeiculos } from '../hooks/useVeiculos';

// --- DESIGN SYSTEM ---
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { ListaResponsiva } from './ui/ListaResponsiva';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { TableStyles } from '../styles/table';

// --- COMPONENTES & FORMS ---
import { FormEditarJornada } from './forms/FormEditarJornada';
import { BotaoLimparFantasmas } from './BotaoLimparFantasmas';

interface JornadaHistorico extends Jornada {
  kmPercorrido?: number;
  [key: string]: any;
}

interface HistoricoJornadasProps {
  userRole?: string;
}

export function HistoricoJornadas({ userRole = 'OPERADOR' }: HistoricoJornadasProps) {
  
  // 📡 BUSCA INDEPENDENTE DE VEÍCULOS
  const { data: veiculos = [] } = useVeiculos();

  // --- ESTADOS ---
  const [historico, setHistorico] = useState<JornadaHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  // Filtros de busca
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    veiculoId: '',
    buscaMotorista: '',
    buscaPlaca: ''
  });

  const canEdit = ['ADMIN', 'ENCARREGADO'].includes(userRole);
  const canDelete = userRole === 'ADMIN';

  // --- FETCHING OTIMIZADO ---
  const fetchHistorico = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      
      if (filtros.dataInicio) params.dataInicio = filtros.dataInicio;
      if (filtros.dataFim) params.dataFim = filtros.dataFim;
      if (filtros.veiculoId) params.veiculoId = filtros.veiculoId;
      if (filtros.buscaMotorista) params.motorista = filtros.buscaMotorista; 
      if (filtros.buscaPlaca) params.placa = filtros.buscaPlaca;           

      const response = await api.get('/jornadas/historico', { params });
      setHistorico(response.data);
    } catch (err) {
      console.error('Erro no fetch de histórico:', err);
      toast.error('Não foi possível carregar o histórico.');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => { 
    fetchHistorico(); 
  }, [fetchHistorico]);

  // --- CÁLCULOS MEMOIZADOS (SUMÁRIO) ---
  const kmTotalGeral = useMemo(() => {
    return historico.reduce((acc, j) => {
      const km = (j.kmFim && j.kmInicio) ? j.kmFim - j.kmInicio : (j.kmPercorrido || 0);
      return acc + km;
    }, 0);
  }, [historico]);

  // --- ACTIONS ---
  const handleDelete = async (id: string) => {
    if (!window.confirm("ATENÇÃO: Tem certeza que deseja excluir este registro histórico?")) return;

    try {
      await api.delete(`/jornadas/${id}`);
      setHistorico(prev => prev.filter(item => item.id !== id));
      toast.success('Registro excluído com sucesso.');
    } catch (err) {
      console.error("Erro ao excluir:", err);
      toast.error('Erro ao excluir jornada.');
    }
  };

  // ✅ FUNÇÃO RESTAURADA AQUI
  const handleSuccessEdit = () => {
    setEditingId(null);
    fetchHistorico();
  };

  const handleExportar = () => {
    if (historico.length === 0) return;

    const dados = historico.map(j => {
      const kmAndados = (j.kmFim && j.kmInicio) ? j.kmFim - j.kmInicio : (j.kmPercorrido || 0);
      return {
        'Saída': new Date(j.dataInicio).toLocaleString('pt-BR'),
        'Chegada': j.dataFim ? new Date(j.dataFim).toLocaleString('pt-BR') : 'Em andamento',
        'Veículo': j.veiculo ? `${j.veiculo.placa} - ${j.veiculo.modelo}` : 'Veículo Excluído',
        'Motorista': j.operador?.nome || 'Motorista Excluído',
        'KM Inicial': j.kmInicio,
        'KM Final': j.kmFim || '-',
        'Percorrido': kmAndados,
        'Obs': j.observacoes || ''
      };
    });

    try {
      exportarParaExcel(dados, "Historico_Jornadas.xlsx");
      toast.success('Histórico exportado com sucesso!');
    } catch (err) {
      toast.error('Erro ao exportar arquivo.');
    }
  };

  // --- HELPERS ---
  const getFotoUrl = (jornada: JornadaHistorico, tipo: 'inicio' | 'fim'): string | null => {
    if (tipo === 'inicio') return jornada.fotoInicioUrl || jornada.fotoInicio || jornada.foto_inicio || null;
    return jornada.fotoFimUrl || jornada.fotoFim || jornada.foto_fim || null;
  };

  const veiculosOptions = useMemo(() => [
    { value: "", label: "Todos os veículos" },
    ...veiculos.map(v => ({ value: v.id, label: v.placa }))
  ], [veiculos]);

  return (
    <div className="space-y-6 pb-10 animate-enter">
      
      {/* 1. HEADER & FILTROS DE BUSCA AVANÇADOS */}
      <PageHeader 
        title="Histórico de Viagens"
        subtitle="Consulte rotas, quilometragem e fotos dos odômetros."
        extraAction={
          <div className="flex flex-col gap-3 w-full xl:w-auto">
            
            {/* Linha 1: Filtros de texto/seleção */}
            <div className="flex flex-col sm:flex-row gap-2 items-end">
              <div className="w-full sm:w-44">
                <Input 
                  placeholder="Nome do motorista..." 
                  label="Buscar Motorista"
                  value={filtros.buscaMotorista}
                  onChange={e => setFiltros(prev => ({...prev, buscaMotorista: e.target.value}))}
                />
              </div>
              <div className="w-full sm:w-32">
                <Input 
                  placeholder="ABC-1234" 
                  label="Buscar Placa"
                  value={filtros.buscaPlaca}
                  onChange={e => setFiltros(prev => ({...prev, buscaPlaca: e.target.value}))}
                />
              </div>
              <div className="w-full sm:w-48">
                <Select 
                  label="Lista de Veículos" 
                  options={veiculosOptions}
                  value={filtros.veiculoId}
                  onChange={e => setFiltros(prev => ({...prev, veiculoId: e.target.value}))}
                  icon={<Filter className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* Linha 2: Datas e Ações */}
            <div className="flex flex-col sm:flex-row gap-2 items-end xl:justify-end">
              <div className="w-full sm:w-32">
                <Input 
                  type="date" 
                  label="Data Início" 
                  value={filtros.dataInicio}
                  onChange={e => setFiltros(prev => ({...prev, dataInicio: e.target.value}))}
                />
              </div>
              <div className="w-full sm:w-32">
                <Input 
                  type="date" 
                  label="Data Fim" 
                  value={filtros.dataFim}
                  onChange={e => setFiltros(prev => ({...prev, dataFim: e.target.value}))}
                />
              </div>

              <div className="flex gap-2 pb-0.5">
                {userRole === 'ADMIN' && filtros.veiculoId && (
                  <BotaoLimparFantasmas 
                    veiculoId={filtros.veiculoId} 
                    onSuccess={fetchHistorico}
                    className="h-9"
                  />
                )}
                <Button 
                  variant="secondary" 
                  onClick={handleExportar} 
                  icon={<Download className="w-4 h-4" />}
                  disabled={historico.length === 0}
                  className="h-9"
                >
                  Excel
                </Button>
              </div>
            </div>
          </div>
        }
      />

      {/* 2. SUMÁRIO DA CONSULTA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="bg-primary/5 border-primary/20 flex flex-col justify-center gap-1">
          <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4" /> KM Percorrido
          </span>
          <span className="text-2xl font-mono font-black text-primary truncate">
            {kmTotalGeral.toLocaleString('pt-BR')} <small className="text-sm font-bold opacity-70">km</small>
          </span>
        </Card>
        
        <Card padding="sm" className="flex flex-col justify-center gap-1 bg-surface">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Viagens Listadas
          </span>
          <span className="text-2xl font-mono font-black text-text-main">
            {historico.length} <small className="text-sm font-medium opacity-70">registros</small>
          </span>
        </Card>
      </div>

      {/* 3. TABELA DE RESULTADOS */}
      <Card padding="none">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-surface-hover rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <ListaResponsiva
            itens={historico}
            emptyMessage="Nenhuma viagem encontrada neste período ou com estes filtros."

            // --- DESKTOP ---
            desktopHeader={
              <>
                <th className={TableStyles.th}>Data / Status</th>
                <th className={TableStyles.th}>Veículo</th>
                <th className={TableStyles.th}>Motorista</th>
                <th className={TableStyles.th}>Distância</th>
                <th className={`${TableStyles.th} text-center`}>Fotos</th>
                {(canEdit || canDelete) && <th className={`${TableStyles.th} text-right`}>Ações</th>}
              </>
            }
            renderDesktop={(j) => {
              const kmPercorrido = (j.kmFim && j.kmInicio) ? j.kmFim - j.kmInicio : (j.kmPercorrido || 0);
              const imgInicio = getFotoUrl(j, 'inicio');
              const imgFim = getFotoUrl(j, 'fim');

              return (
                <>
                  <td className={TableStyles.td}>
                    <div className="flex flex-col gap-1 items-start">
                      <span className="font-bold text-text-main text-sm flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-text-muted" />
                        {new Date(j.dataInicio).toLocaleDateString('pt-BR')}
                      </span>
                      {j.dataFim ? (
                        <Badge variant="success" className="text-[10px] h-5 px-1.5">FINALIZADA</Badge>
                      ) : (
                        <Badge variant="info" className="text-[10px] h-5 px-1.5 animate-pulse">EM ROTA</Badge>
                      )}
                    </div>
                  </td>
                  <td className={TableStyles.td}>
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-primary text-sm">{j.veiculo?.placa || '---'}</span>
                      <span className="text-xs text-text-secondary">{j.veiculo?.modelo || 'Veículo Excluído'}</span>
                    </div>
                  </td>
                  <td className={TableStyles.td}>
                    <span className="font-medium text-text-main text-sm">{j.operador?.nome || 'Motorista Excluído'}</span>
                  </td>
                  <td className={TableStyles.td}>
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-text-main text-sm">
                        {kmPercorrido > 0 ? `${kmPercorrido} km` : '--'}
                      </span>
                      <span className="text-[10px] text-text-muted font-mono">
                        {j.kmInicio} → {j.kmFim || '...'}
                      </span>
                    </div>
                  </td>
                  
                  {/* Botões de Foto */}
                  <td className={`${TableStyles.td} text-center`}>
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => imgInicio && setViewingPhoto(imgInicio)}
                        disabled={!imgInicio}
                        className={`p-1.5 rounded-full border transition-colors ${imgInicio 
                            ? 'bg-info/10 text-info border-info/20 hover:bg-info/20' 
                            : 'bg-surface-hover text-text-muted border-border cursor-not-allowed'}`}
                        title="Foto Início"
                      >
                        {imgInicio ? <Camera className="w-4 h-4"/> : <ImageOff className="w-4 h-4"/>}
                      </button>
                      
                      <button 
                        onClick={() => imgFim && setViewingPhoto(imgFim)}
                        disabled={!imgFim}
                        className={`p-1.5 rounded-full border transition-colors ${imgFim 
                            ? 'bg-success/10 text-success border-success/20 hover:bg-success/20' 
                            : 'bg-surface-hover text-text-muted border-border cursor-not-allowed'}`}
                        title="Foto Fim"
                      >
                        {imgFim ? <Camera className="w-4 h-4"/> : <ImageOff className="w-4 h-4"/>}
                      </button>
                    </div>
                  </td>

                  {(canEdit || canDelete) && (
                    <td className={`${TableStyles.td} text-right`}>
                      <div className="flex justify-end gap-1">
                        {canEdit && (
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 !p-0 text-text-muted hover:text-primary" 
                            onClick={() => setEditingId(j.id)}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 !p-0 text-text-muted hover:text-error" 
                            onClick={() => handleDelete(j.id)}
                            title="Excluir"
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
              const imgInicio = getFotoUrl(j, 'inicio');
              const imgFim = getFotoUrl(j, 'fim');

              return (
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="bg-surface-hover p-2 rounded-lg border border-border flex flex-col items-center justify-center w-12 h-12 shrink-0">
                        <span className="text-sm font-bold text-text-main">{new Date(j.dataInicio).getDate()}</span>
                        <span className="text-[9px] font-bold uppercase text-text-muted">
                          {new Date(j.dataInicio).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                        </span>
                      </div>
                      <div>
                        <span className="font-mono font-bold text-text-main block">{j.veiculo?.placa || 'N/A'}</span>
                        <span className="text-xs text-text-secondary">{j.operador?.nome || 'Motorista Excluído'}</span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="font-mono font-bold text-text-main text-lg">
                        {kmPercorrido > 0 ? `${kmPercorrido} km` : '--'}
                      </span>
                      {j.dataFim ? (
                        <Badge variant="success" className="text-[10px] h-5 px-1.5">FINALIZADA</Badge>
                      ) : (
                        <Badge variant="info" className="text-[10px] h-5 px-1.5 animate-pulse">EM ROTA</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-dashed border-border pt-3">
                    <div className="flex gap-2">
                      {imgInicio && (
                        <Button variant="ghost" className="h-7 px-2 text-xs text-info bg-info/10" onClick={() => setViewingPhoto(imgInicio)}>
                          <Camera className="w-3 h-3 mr-1"/> Início
                        </Button>
                      )}
                      {imgFim && (
                        <Button variant="ghost" className="h-7 px-2 text-xs text-success bg-success/10" onClick={() => setViewingPhoto(imgFim)}>
                          <Camera className="w-3 h-3 mr-1"/> Fim
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-1">
                        {canEdit && (
                          <Button variant="ghost" className="h-8 w-8 !p-0 text-text-muted" onClick={() => setEditingId(j.id)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="ghost" className="h-8 w-8 !p-0 text-text-muted hover:text-error" onClick={() => handleDelete(j.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                    </div>
                  </div>
                </div>
              );
            }}
          />
        )}
      </Card>

      {/* 4. MODAIS E LIGHTBOXES */}
      <Modal 
        isOpen={!!editingId} 
        onClose={() => setEditingId(null)} 
        title="Editar Jornada"
        className="max-w-2xl"
      >
        {editingId && (
          <FormEditarJornada
            jornadaId={editingId}
            onSuccess={handleSuccessEdit}
            onCancelar={() => setEditingId(null)}
          />
        )}
      </Modal>

      {/* LIGHTBOX DE FOTO */}
      {viewingPhoto && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setViewingPhoto(null)}
        >
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <button 
              onClick={() => setViewingPhoto(null)}
              className="absolute top-6 right-6 text-white hover:text-error bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all z-50"
            >
              <X className="w-8 h-8" />
            </button>
            
            <img 
              src={viewingPhoto} 
              alt="Odômetro Ampliado" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()} 
            />
            <p className="text-white/60 mt-4 text-sm font-medium">
              Clique fora para fechar
            </p>
          </div>
        </div>
      )}
    </div>
  );
}