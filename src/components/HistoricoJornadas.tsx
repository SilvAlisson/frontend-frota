import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { toast } from 'sonner';
import { Edit, Trash2, Camera, X, ImageOff, Download, Filter, Calendar } from 'lucide-react';
import type { Jornada, Veiculo } from '../types';

// --- DESIGN SYSTEM KLIN ---
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { ListaResponsiva } from './ui/ListaResponsiva';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { TableStyles } from '../styles/table';
import { FormEditarJornada } from './forms/FormEditarJornada';

// --- COMPONENTES & FORMS ---
import { FormEditarJornada } from './forms/FormEditarJornada';
import { BotaoLimparFantasmas } from './BotaoLimparFantasmas';

interface JornadaHistorico extends Jornada {
    kmPercorrido?: number;
    [key: string]: any;
}

interface HistoricoJornadasProps {
  veiculos: Veiculo[];
  userRole?: string;
}

export function HistoricoJornadas({ veiculos, userRole = 'OPERADOR' }: HistoricoJornadasProps) {

    // --- ESTADOS ---
    const [historico, setHistorico] = useState<JornadaHistorico[]>([]);
    const [loading, setLoading] = useState(true);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

    // Filtros
    const [filtros, setFiltros] = useState({
        dataInicio: '',
        dataFim: '',
        veiculoId: ''
    });

    const canEdit = ['ADMIN', 'ENCARREGADO'].includes(userRole);
    const canDelete = userRole === 'ADMIN';

    // --- FETCHING ---
    const fetchHistorico = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (filtros.dataInicio) params.dataInicio = filtros.dataInicio;
            if (filtros.dataFim) params.dataFim = filtros.dataFim;
            if (filtros.veiculoId) params.veiculoId = filtros.veiculoId;

            const response = await api.get('/jornadas/historico', { params });
            setHistorico(response.data);
        } catch (err) {
            console.error(err);
            toast.error('Não foi possível carregar o histórico.');
        } finally {
            setTimeout(() => setLoading(false), 300);
        }
    };

    useEffect(() => { fetchHistorico(); }, [filtros]);

    // --- ACTIONS (Com Toast Promise mantido) ---
    const handleDelete = async (id: string) => {
        if (!window.confirm("ATENÇÃO: Tem certeza que deseja excluir este registro histórico?")) return;

        const promise = api.delete(`/jornadas/${id}`);

        toast.promise(promise, {
            loading: 'Removendo registro...',
            success: () => {
                setHistorico(prev => prev.filter(item => item.id !== id));
                return 'Registro excluído com sucesso.';
            },
            error: (err) => {
                console.error("Erro ao excluir:", err);
                return 'Erro ao excluir jornada.';
            }
        });
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
                exportarParaExcel(dados, "Historico_Jornadas.xlsx");
                resolve(true);
            } catch (err) {
                reject(err);
            }
        });

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
    };

    // --- HELPERS ---
    const getFotoUrl = (jornada: JornadaHistorico, tipo: 'inicio' | 'fim'): string | null => {
        if (tipo === 'inicio') return jornada.fotoInicioUrl || jornada.fotoInicio || jornada.foto_inicio || null;
        return jornada.fotoFimUrl || jornada.fotoFim || jornada.foto_fim || null;
    };

    const veiculosOptions = [
        { value: "", label: "Todos os veículos" },
        ...veiculos.map(v => ({ value: v.id, label: v.placa }))
    ];

    return (
        <div className="space-y-6 pb-10">

            {/* 1. HEADER & FILTROS */}
            <PageHeader
                title="Histórico de Viagens"
                subtitle="Consulte rotas, quilometragem e fotos dos odômetros."
                // Mantivemos o badge de contador aqui no título via prop ou composição, se o PageHeader suportar, senão no extraAction
                extraAction={
                    <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto items-end">
                        <div className="flex items-center mr-2">
                            <Badge variant="neutral" className="h-9 px-3">
                                {historico.length} Registros
                            </Badge>
                        </div>

                        <div className="w-full sm:w-32">
                            <Input
                                type="date"
                                label="Início"
                                value={filtros.dataInicio}
                                onChange={e => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                            />
                        </div>
                        <div className="w-full sm:w-32">
                            <Input
                                type="date"
                                label="Fim"
                                value={filtros.dataFim}
                                onChange={e => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                            />
                        </div>
                        <div className="w-full sm:w-48">
                            <Select
                                label="Veículo"
                                options={veiculosOptions}
                                value={filtros.veiculoId}
                                onChange={e => setFiltros(prev => ({ ...prev, veiculoId: e.target.value }))}
                                icon={<Filter className="w-4 h-4" />}
                            />
                        </div>

                        {/* Botão Admin Limpar Fantasmas */}
                        {userRole === 'ADMIN' && filtros.veiculoId && (
                            <div className="pb-0.5">
                                <BotaoLimparFantasmas
                                    veiculoId={filtros.veiculoId}
                                    onSuccess={fetchHistorico}
                                    className="h-9"
                                />
                            </div>
                        )}

                        <div className="pb-0.5">
                            <Button
                                variant="secondary"
                                onClick={handleExportar}
                                icon={<Download className="w-4 h-4" />}
                                disabled={historico.length === 0}
                            >
                                Excel
                            </Button>
                        </div>
                    </div>
                }
            />

            {/* 2. TABELA (UX Preservada) */}
            <Card noPadding>
                {loading ? (
                    <div className="p-6 space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}
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
                                            <span className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
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
                                            <span className="text-xs text-gray-500">{j.veiculo?.modelo || 'Veículo Excluído'}</span>
                                        </div>
                                    </td>
                                    <td className={TableStyles.td}>
                                        <span className="font-medium text-gray-700 text-sm">{j.operador?.nome || 'Motorista Excluído'}</span>
                                    </td>
                                    <td className={TableStyles.td}>
                                        <div className="flex flex-col">
                                            <span className="font-mono font-bold text-gray-900 text-sm">
                                                {kmPercorrido > 0 ? `${kmPercorrido} km` : '--'}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-mono">
                                                {j.kmInicio} → {j.kmFim || '...'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* UX: Botões de Foto Coloridos (Restaurados) */}
                                    <td className={`${TableStyles.td} text-center`}>
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => imgInicio && setViewingPhoto(imgInicio)}
                                                disabled={!imgInicio}
                                                className={`p-1.5 rounded-full border transition-colors ${imgInicio ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'}`}
                                                title="Foto Início"
                                            >
                                                {imgInicio ? <Camera className="w-4 h-4" /> : <ImageOff className="w-4 h-4" />}
                                            </button>

                                            <button
                                                onClick={() => imgFim && setViewingPhoto(imgFim)}
                                                disabled={!imgFim}
                                                className={`p-1.5 rounded-full border transition-colors ${imgFim ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'}`}
                                                title="Foto Fim"
                                            >
                                                {imgFim ? <Camera className="w-4 h-4" /> : <ImageOff className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </td>

                                    {/* UX: Ações em 1 Clique (Restaurado) */}
                                    {(canEdit || canDelete) && (
                                        <td className={`${TableStyles.td} text-right`}>
                                            <div className="flex justify-end gap-1">
                                                {canEdit && (
                                                    <Button
                                                        variant="ghost"
                                                        className="h-8 w-8 !p-0 text-gray-400 hover:text-blue-600"
                                                        onClick={() => setEditingId(j.id)}
                                                        title="Editar"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {canDelete && (
                                                    <Button
                                                        variant="ghost"
                                                        className="h-8 w-8 !p-0 text-gray-400 hover:text-red-600"
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
                                            <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex flex-col items-center justify-center w-12 h-12 shrink-0">
                                                <span className="text-sm font-bold text-gray-700">{new Date(j.dataInicio).getDate()}</span>
                                                <span className="text-[9px] font-bold uppercase text-gray-400">
                                                    {new Date(j.dataInicio).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="font-mono font-bold text-gray-900 block">{j.veiculo?.placa || 'N/A'}</span>
                                                <span className="text-xs text-gray-500">{j.operador?.nome || 'Motorista Excluído'}</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1">
                                            <span className="font-mono font-bold text-gray-900 text-lg">
                                                {kmPercorrido > 0 ? `${kmPercorrido} km` : '--'}
                                            </span>
                                            {j.dataFim ? (
                                                <Badge variant="success" className="text-[10px] h-5 px-1.5">FINALIZADA</Badge>
                                            ) : (
                                                <Badge variant="info" className="text-[10px] h-5 px-1.5 animate-pulse">EM ROTA</Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center border-t border-dashed border-gray-100 pt-3">
                                        <div className="flex gap-2">
                                            {imgInicio && (
                                                <Button variant="ghost" className="h-7 px-2 text-xs text-blue-600 bg-blue-50" onClick={() => setViewingPhoto(imgInicio)}>
                                                    <Camera className="w-3 h-3 mr-1" /> Início
                                                </Button>
                                            )}
                                            {imgFim && (
                                                <Button variant="ghost" className="h-7 px-2 text-xs text-green-600 bg-green-50" onClick={() => setViewingPhoto(imgFim)}>
                                                    <Camera className="w-3 h-3 mr-1" /> Fim
                                                </Button>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            {canEdit && (
                                                <Button variant="ghost" className="h-8 w-8 !p-0 text-gray-400" onClick={() => setEditingId(j.id)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {canDelete && (
                                                <Button variant="ghost" className="h-8 w-8 !p-0 text-red-400 hover:bg-red-50" onClick={() => handleDelete(j.id)}>
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

            {/* 3. MODAIS */}

            {/* Edição */}
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

            {/* UX: Lightbox Imersivo (Restaurado) */}
            {viewingPhoto && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setViewingPhoto(null)}
                >
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                        <button
                            onClick={() => setViewingPhoto(null)}
                            className="absolute top-6 right-6 text-white hover:text-red-400 bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all z-50"
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
      )}

      {/* MODAL DE VISUALIZAÇÃO DE FOTO */}
      {viewingPhoto && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setViewingPhoto(null)}
        >
          <div className="relative w-full h-full flex flex-col items-center justify-center">
             <button 
               onClick={() => setViewingPhoto(null)}
               className="absolute top-6 right-6 text-white hover:text-red-400 bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all z-50"
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