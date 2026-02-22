import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { toast } from 'sonner';
import { Edit, Trash2, Camera, X, ImageOff, Download, Filter, Calendar, Activity, ChevronDown, MapPin } from 'lucide-react';
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
import { ConfirmModal } from './ui/ConfirmModal'; // ✨ Adicionado
import { TableStyles } from '../styles/table';

// --- COMPONENTES & FORMS ---
import { FormEditarJornada } from './forms/FormEditarJornada';

interface JornadaHistorico extends Jornada {
  kmPercorrido?: number;
  [key: string]: any;
}

interface HistoricoJornadasProps {
  userRole?: string;
}

const ITENS_POR_PAGINA = 20;

export function HistoricoJornadas({ userRole = 'OPERADOR' }: HistoricoJornadasProps) {
  
  const { data: veiculos = [] } = useVeiculos();

  const [historico, setHistorico] = useState<JornadaHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(ITENS_POR_PAGINA);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  
  // --- ESTADO PARA O CONFIRM MODAL ---
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    veiculoId: '',
    buscaMotorista: '',
    buscaPlaca: ''
  });

  const canEdit = ['ADMIN', 'ENCARREGADO'].includes(userRole);
  const canDelete = userRole === 'ADMIN';

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
      setVisibleCount(ITENS_POR_PAGINA); 
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

  const kmTotalGeral = useMemo(() => {
    return historico.reduce((acc, j) => {
      const km = (j.kmFim && j.kmInicio) ? j.kmFim - j.kmInicio : (j.kmPercorrido || 0);
      return acc + km;
    }, 0);
  }, [historico]);

  const historicoVisivel = useMemo(() => {
    return historico.slice(0, visibleCount);
  }, [historico, visibleCount]);

  const handleCarregarMais = () => {
    setVisibleCount(prev => prev + ITENS_POR_PAGINA);
  };

  // --- NOVA LÓGICA DE EXCLUSÃO (UI Elite) ---
  const executeDelete = async () => {
    if (!deletingId) return;

    try {
      await api.delete(`/jornadas/${deletingId}`);
      setHistorico(prev => prev.filter(item => item.id !== deletingId));
      toast.success('Registo excluído com sucesso.');
    } catch (err) {
      console.error("Erro ao excluir:", err);
      toast.error('Erro ao excluir jornada.');
    } finally {
      setDeletingId(null); // Fecha o modal
    }
  };

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
      toast.error('Erro ao exportar ficheiro.');
    }
  };

  const getFotoUrl = (jornada: JornadaHistorico, tipo: 'inicio' | 'fim'): string | null => {
    if (tipo === 'inicio') return jornada.fotoInicioUrl || jornada.fotoInicio || jornada.foto_inicio || null;
    return jornada.fotoFimUrl || jornada.fotoFim || jornada.foto_fim || null;
  };

  const veiculosOptions = useMemo(() => [
    { value: "", label: "Todos os veículos" },
    ...veiculos.map(v => ({ value: v.id, label: v.placa }))
  ], [veiculos]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <PageHeader 
        title="Histórico de Viagens"
        subtitle="Consulte rotas, quilometragem e provas fotográficas dos odómetros."
        extraAction={
          <div className="flex flex-col gap-3 w-full xl:w-auto bg-surface p-2 sm:p-3 rounded-2xl border border-border/60 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="w-full sm:w-44">
                <Input 
                  placeholder="Nome do motorista..." 
                  label="Buscar Motorista"
                  value={filtros.buscaMotorista}
                  onChange={e => setFiltros(prev => ({...prev, buscaMotorista: e.target.value}))}
                  containerClassName="!mb-0"
                />
              </div>
              <div className="w-full sm:w-32">
                <Input 
                  placeholder="ABC-1234" 
                  label="Buscar Placa"
                  value={filtros.buscaPlaca}
                  onChange={e => setFiltros(prev => ({...prev, buscaPlaca: e.target.value}))}
                  containerClassName="!mb-0"
                  className="font-mono uppercase tracking-widest"
                />
              </div>
              <div className="w-px h-10 bg-border/60 hidden sm:block mx-1"></div>
              <div className="w-full sm:w-56">
                <Select 
                  label="Lista de Veículos" 
                  options={veiculosOptions}
                  value={filtros.veiculoId}
                  onChange={e => setFiltros(prev => ({...prev, veiculoId: e.target.value}))}
                  icon={<Filter className="w-4 h-4" />}
                  containerClassName="!mb-0"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-end sm:justify-between xl:justify-start">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="w-full sm:w-32">
                  <Input 
                    type="date" 
                    label="Data Início" 
                    value={filtros.dataInicio}
                    onChange={e => setFiltros(prev => ({...prev, dataInicio: e.target.value}))}
                    containerClassName="!mb-0"
                  />
                </div>
                <div className="w-full sm:w-32">
                  <Input 
                    type="date" 
                    label="Data Fim" 
                    value={filtros.dataFim}
                    onChange={e => setFiltros(prev => ({...prev, dataFim: e.target.value}))}
                    containerClassName="!mb-0"
                  />
                </div>
              </div>

              {/* ✨ Botão de Exportar ocupando o espaço deixado pelo falecido Fantasma */}
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 xl:ml-auto">
                <Button 
                  variant="secondary" 
                  onClick={handleExportar} 
                  icon={<Download className="w-4 h-4" />}
                  disabled={historico.length === 0}
                  className="h-11 sm:h-12 w-full sm:w-auto flex-1 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/20"
                >
                  Excel
                </Button>
              </div>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Card className="bg-surface border-border/60 flex flex-col justify-center gap-2 p-6 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Distância Total Percorrida
          </span>
          <span className="text-3xl font-mono font-black text-text-main truncate">
            {kmTotalGeral.toLocaleString('pt-BR')} <small className="text-lg font-bold opacity-60 uppercase tracking-widest ml-1">km</small>
          </span>
        </Card>
        
        <Card className="bg-surface border-border/60 flex flex-col justify-center gap-2 p-6 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-500" /> Total de Deslocações
          </span>
          <span className="text-3xl font-mono font-black text-text-main">
            {historico.length} <small className="text-lg font-bold opacity-60 uppercase tracking-widest ml-1">Registos</small>
          </span>
        </Card>
      </div>

      <Card padding="none" className="overflow-hidden border-border/60 shadow-sm rounded-3xl bg-surface">
        {loading ? (
          <div className="p-6 sm:p-8 space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-surface-hover/50 rounded-xl animate-pulse border border-border/30" />)}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <ListaResponsiva
              itens={historicoVisivel}
              emptyMessage="Nenhuma viagem encontrada neste período ou com os filtros atuais."

              desktopHeader={
                <>
                  <th className={`${TableStyles.th} pl-8 py-5`}>Data e Estado</th>
                  <th className={TableStyles.th}>Veículo</th>
                  <th className={TableStyles.th}>Motorista</th>
                  <th className={TableStyles.th}>Telemetria (KM)</th>
                  <th className={`${TableStyles.th} text-center`}>Provas (Fotos)</th>
                  {(canEdit || canDelete) && <th className={`${TableStyles.th} text-right pr-8`}>Gestão</th>}
                </>
              }
              renderDesktop={(j) => {
                const kmPercorrido = (j.kmFim && j.kmInicio) ? j.kmFim - j.kmInicio : (j.kmPercorrido || 0);
                const imgInicio = getFotoUrl(j, 'inicio');
                const imgFim = getFotoUrl(j, 'fim');

                return (
                  <>
                    <td className={`${TableStyles.td} pl-8`}>
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className="font-bold text-text-main text-sm flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-text-muted/60" />
                          {new Date(j.dataInicio).toLocaleDateString('pt-BR')}
                        </span>
                        {j.dataFim ? (
                          <Badge variant="success" className="text-[10px] h-5 px-2 tracking-widest">FINALIZADA</Badge>
                        ) : (
                          <Badge variant="info" className="text-[10px] h-5 px-2 tracking-widest animate-pulse shadow-sm">EM ROTA</Badge>
                        )}
                      </div>
                    </td>
                    <td className={TableStyles.td}>
                      <div className="flex flex-col gap-1">
                        <span className="font-mono font-black text-primary text-base tracking-tight">{j.veiculo?.placa || '---'}</span>
                        <span className="text-[11px] text-text-secondary font-bold uppercase tracking-wider">{j.veiculo?.modelo || 'Veículo Excluído'}</span>
                      </div>
                    </td>
                    <td className={TableStyles.td}>
                      <span className="font-medium text-text-main text-sm">{j.operador?.nome || 'Motorista Excluído'}</span>
                    </td>
                    <td className={TableStyles.td}>
                      <div className="flex flex-col gap-1">
                        <span className="font-mono font-black text-text-main text-base">
                          {kmPercorrido > 0 ? `${kmPercorrido.toLocaleString('pt-BR')} km` : '--'}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono font-bold bg-surface-hover px-1.5 py-0.5 rounded-md border border-border/50 w-fit">
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
                          className={`p-2 rounded-xl border transition-all ${imgInicio 
                              ? 'bg-info/10 text-info border-info/20 hover:bg-info/20 hover:scale-105 cursor-pointer shadow-sm' 
                              : 'bg-surface-hover text-text-muted/40 border-border cursor-not-allowed'}`}
                          title={imgInicio ? "Ver Foto Odômetro Inicial" : "Foto Indisponível"}
                        >
                          {imgInicio ? <Camera className="w-4 h-4"/> : <ImageOff className="w-4 h-4"/>}
                        </button>
                        
                        <button 
                          onClick={() => imgFim && setViewingPhoto(imgFim)}
                          disabled={!imgFim}
                          className={`p-2 rounded-xl border transition-all ${imgFim 
                              ? 'bg-success/10 text-success border-success/20 hover:bg-success/20 hover:scale-105 cursor-pointer shadow-sm' 
                              : 'bg-surface-hover text-text-muted/40 border-border cursor-not-allowed'}`}
                          title={imgFim ? "Ver Foto Odômetro Final" : "Foto Indisponível"}
                        >
                          {imgFim ? <Camera className="w-4 h-4"/> : <ImageOff className="w-4 h-4"/>}
                        </button>
                      </div>
                    </td>

                    {(canEdit || canDelete) && (
                      <td className={`${TableStyles.td} text-right pr-8`}>
                        <div className="flex justify-end gap-1">
                          {canEdit && (
                            <Button variant="ghost" className="h-9 w-9 !p-0 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg" onClick={() => setEditingId(j.id)} title="Editar">
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button variant="ghost" className="h-9 w-9 !p-0 text-text-muted hover:text-error hover:bg-error/10 rounded-lg" onClick={() => setDeletingId(j.id)} title="Excluir">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </>
                );
              }}

              renderMobile={(j) => {
                const kmPercorrido = (j.kmFim && j.kmInicio) ? j.kmFim - j.kmInicio : (j.kmPercorrido || 0);
                const imgInicio = getFotoUrl(j, 'inicio');
                const imgFim = getFotoUrl(j, 'fim');

                return (
                  <div className="p-5 flex flex-col gap-4 border-b border-border/60 hover:bg-surface-hover/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="bg-surface shadow-sm text-text-main p-2 rounded-xl border border-border/80 flex flex-col items-center justify-center w-14 h-14 shrink-0">
                          <span className="text-lg font-black leading-none">{new Date(j.dataInicio).getDate()}</span>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted mt-0.5">
                            {new Date(j.dataInicio).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                          </span>
                        </div>
                        <div className="flex flex-col justify-center gap-1">
                          <span className="font-mono font-black text-primary text-lg tracking-tight leading-none block">{j.veiculo?.placa || 'Sem Placa'}</span>
                          <span className="text-xs text-text-secondary font-medium">{j.operador?.nome || 'Motorista Excluído'}</span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        {j.dataFim ? (
                          <Badge variant="success" className="text-[9px] h-5 px-1.5 shadow-sm">FINALIZADA</Badge>
                        ) : (
                          <Badge variant="info" className="text-[9px] h-5 px-1.5 animate-pulse shadow-sm">EM ROTA</Badge>
                        )}
                        {(canEdit || canDelete) && (
                          <div className="flex gap-1 mt-1">
                            {canEdit && (
                              <Button variant="ghost" className="h-8 w-8 !p-0 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg" onClick={() => setEditingId(j.id)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button variant="ghost" className="h-8 w-8 !p-0 text-text-muted hover:text-error hover:bg-error/10 rounded-lg" onClick={() => setDeletingId(j.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-surface-hover/50 p-3 rounded-xl border border-border/40 mt-1">
                      <div className="flex flex-col gap-1.5 items-start">
                         <span className="text-[9px] text-text-muted uppercase font-black tracking-widest">Trajeto Odómetro</span>
                         <span className="text-xs font-mono font-bold text-text-main">{j.kmInicio} <span className="text-text-muted mx-0.5">→</span> {j.kmFim || '...'}</span>
                      </div>
                      <div className="flex flex-col items-end">
                         <span className="text-[9px] text-text-muted uppercase font-black tracking-widest mb-1">Distância</span>
                         <span className="font-mono font-black text-text-main text-lg tracking-tighter">
                           {kmPercorrido > 0 ? `${kmPercorrido.toLocaleString('pt-BR')} km` : '--'}
                         </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {imgInicio ? (
                        <Button variant="secondary" className="h-10 text-xs text-info bg-info/10 border-info/20 hover:bg-info/20 font-bold shadow-sm" onClick={() => setViewingPhoto(imgInicio)}>
                          <Camera className="w-3.5 h-3.5 mr-2"/> Ver Início
                        </Button>
                      ) : (
                        <div className="h-10 flex items-center justify-center text-xs font-bold text-text-muted/50 bg-surface-hover rounded-xl border border-border border-dashed">
                           <ImageOff className="w-3.5 h-3.5 mr-2"/> Sem Início
                        </div>
                      )}
                      {imgFim ? (
                        <Button variant="secondary" className="h-10 text-xs text-success bg-success/10 border-success/20 hover:bg-success/20 font-bold shadow-sm" onClick={() => setViewingPhoto(imgFim)}>
                          <Camera className="w-3.5 h-3.5 mr-2"/> Ver Fim
                        </Button>
                      ) : (
                        <div className="h-10 flex items-center justify-center text-xs font-bold text-text-muted/50 bg-surface-hover rounded-xl border border-border border-dashed">
                           <ImageOff className="w-3.5 h-3.5 mr-2"/> Sem Fim
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />

            {historicoVisivel.length < historico.length && (
               <div className="p-6 border-t border-border/60 bg-surface-hover/30 flex justify-center">
                  <Button 
                    variant="secondary" 
                    onClick={handleCarregarMais}
                    className="w-full sm:w-auto bg-surface hover:shadow-md transition-all group cursor-pointer"
                  >
                     Ver mais {Math.min(ITENS_POR_PAGINA, historico.length - historicoVisivel.length)} Viagens
                     <ChevronDown className="w-4 h-4 ml-2 text-text-muted group-hover:text-primary transition-colors" />
                  </Button>
               </div>
            )}
          </div>
        )}
      </Card>

      <Modal 
        isOpen={!!editingId} 
        onClose={() => setEditingId(null)} 
        title="Editar Registo de Viagem"
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

      {/* ✨ O NOSSO CONFIRM MODAL (Substitui o window.confirm) */}
      <ConfirmModal 
        isOpen={!!deletingId}
        onCancel={() => setDeletingId(null)}
        onConfirm={executeDelete}
        title="Excluir Histórico"
        description="Atenção: Esta ação não pode ser desfeita. Tem a certeza que deseja excluir esta viagem dos registos globais da empresa?"
        variant="danger"
        confirmLabel="Sim, Excluir Viagem"
      />

      {viewingPhoto && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-300"
          onClick={() => setViewingPhoto(null)}
        >
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <button 
              onClick={() => setViewingPhoto(null)}
              className="absolute top-4 right-4 sm:top-8 sm:right-8 text-white hover:text-error bg-white/10 hover:bg-white/20 rounded-full p-2.5 transition-all z-50 shadow-lg cursor-pointer"
              title="Fechar Imagem"
            >
              <X className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
            <img 
              src={viewingPhoto} 
              alt="Odômetro Ampliado" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-500 ring-1 ring-white/10"
              onClick={(e) => e.stopPropagation()} 
            />
            <p className="text-white/60 mt-6 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Camera className="w-4 h-4"/> Registo Fotográfico
            </p>
          </div>
        </div>
      )}
    </div>
  );
}