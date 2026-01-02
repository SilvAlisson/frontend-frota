import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { toast } from 'sonner';
import type { Jornada, Veiculo } from '../types';

// Componentes UI
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ListaResponsiva } from './ui/ListaResponsiva';
import { TableStyles } from '../styles/table';

// --- Ícones Locais ---
function IconeLixo() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" /></svg>; }

// Interface local para garantir tipagem
interface JornadaHistorico extends Jornada {
    kmPercorrido?: number; // Opcional, pois calculamos se faltar
}

interface HistoricoJornadasProps {
    veiculos: Veiculo[];
    userRole?: string;
}

export function HistoricoJornadas({ veiculos, userRole = 'OPERADOR' }: HistoricoJornadasProps) {
    const [historico, setHistorico] = useState<JornadaHistorico[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Filtros
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [veiculoId, setVeiculoId] = useState('');

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

    const handleExportar = () => {
        if (historico.length === 0) return;

        const exportPromise = new Promise((resolve, reject) => {
            try {
                const dados = historico.map(j => {
                    // [RESTAURADO] Cálculo seguro de KM (Código 1)
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
                        {/* [RESTAURADO] Título Original */}
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Histórico de Viagens</h2>
                        {/* [RESTAURADO] Badge de contagem */}
                        <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full border border-gray-200">
                            {historico.length}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Consulte rotas, quilometragem e horários.</p>
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
                            {userRole === 'ADMIN' && <th className={`${TableStyles.th} text-right`}>Ações</th>}
                        </>
                    }
                    renderDesktop={(j) => {
                        // Cálculo seguro para display
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
                                {userRole === 'ADMIN' && (
                                    <td className={`${TableStyles.td} text-right`}>
                                        <Button variant="ghost" className="h-8 w-8 !p-0 text-gray-400 hover:text-red-600" onClick={() => handleDelete(j.id)} disabled={deletingId === j.id}>
                                            <IconeLixo />
                                        </Button>
                                    </td>
                                )}
                            </>
                        );
                    }}

                    // --- MOBILE (Cards Melhorados) ---
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

                                {userRole === 'ADMIN' && (
                                    <div className="flex justify-end pt-2 border-t border-dashed border-gray-100">
                                        <Button variant="ghost" className="text-xs h-7 px-2 text-red-600 hover:bg-red-50" onClick={() => handleDelete(j.id)}>Excluir Registro</Button>
                                    </div>
                                )}
                            </div>
                        );
                    }}
                />
            )}
        </div>
    );
}