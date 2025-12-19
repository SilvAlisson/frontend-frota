import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { toast } from 'sonner';

interface JornadaHistorico {
    id: string;
    dataInicio: string;
    dataFim: string | null;
    kmInicio: number;
    kmFim: number | null;
    kmPercorrido: number;
    observacoes: string | null;
    veiculo: {
        placa: string;
        modelo: string;
    };
    operador: {
        nome: string;
    };
    encarregado?: {
        nome: string;
    };
}

interface HistoricoJornadasProps {
    veiculos: any[];
    userRole?: string;
}

function IconeLixo() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" /></svg>; }

export function HistoricoJornadas({ veiculos, userRole = 'OPERADOR' }: HistoricoJornadasProps) {
    const [historico, setHistorico] = useState<JornadaHistorico[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState('');

    // Filtros
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [veiculoId, setVeiculoId] = useState('');

    const fetchHistorico = async () => {
        setLoading(true);
        setError('');
        try {
            const params: any = {};
            if (dataInicio) params.dataInicio = dataInicio;
            if (dataFim) params.dataFim = dataFim;
            if (veiculoId) params.veiculoId = veiculoId;

            const response = await api.get('/jornadas/historico', { params });
            setHistorico(response.data);
        } catch (err) {
            console.error("Erro ao buscar histórico de jornadas:", err);
            setError('Não foi possível carregar o histórico.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistorico();
    }, [dataInicio, dataFim, veiculoId]);

    const handleDelete = async (id: string) => {
        if (!window.confirm("ATENÇÃO: Tem certeza que deseja excluir este registro histórico?")) return;

        setDeletingId(id);
        const promise = api.delete(`/jornada/${id}`);

        toast.promise(promise, {
            loading: 'Removendo registro...',
            success: () => {
                setHistorico(prev => prev.filter(item => item.id !== id));
                setDeletingId(null);
                return 'Registro excluído com sucesso.';
            },
            error: (err) => { // CORREÇÃO APLICADA: 'err' é logado
                console.error("Erro ao excluir:", err);
                setDeletingId(null);
                return 'Erro ao excluir jornada. Tente novamente.';
            }
        });
    };

    const handleExportar = () => {
        if (historico.length === 0) return;

        const exportPromise = new Promise((resolve, reject) => {
            try {
                const dados = historico.map(j => ({
                    'Saída': new Date(j.dataInicio).toLocaleString('pt-BR'),
                    'Chegada': j.dataFim ? new Date(j.dataFim).toLocaleString('pt-BR') : 'Em andamento',
                    'Veículo': `${j.veiculo.placa} - ${j.veiculo.modelo}`,
                    'Motorista': j.operador.nome,
                    'KM Inicial': j.kmInicio,
                    'KM Final': j.kmFim || '-',
                    'Percorrido (KM)': j.kmPercorrido || 0,
                }));
                exportarParaExcel(dados, "Historico_Jornadas.xlsx");
                resolve(true);
            } catch (err) {
                reject(err);
            }
        });

        toast.promise(exportPromise, {
            loading: 'Exportando dados...',
            success: 'Histórico exportado com sucesso!',
            error: (err) => { // CORREÇÃO APLICADA: 'err' é logado
                console.error("Erro ao exportar arquivo:", err);
                return 'Erro ao exportar arquivo.';
            }
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* CABEÇALHO E FILTROS */}
            <div className="flex flex-col gap-4 border-b border-gray-100 pb-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        Histórico de Viagens
                        <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {historico.length}
                        </span>
                    </h3>
                </div>

                <div className="flex flex-wrap gap-3 items-end bg-gray-50 p-1 rounded-xl border border-gray-100">
                    <div className="w-full sm:w-auto px-2 py-2">
                        <Input label="De" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} containerClassName="w-full sm:w-32" />
                    </div>
                    <div className="w-full sm:w-auto px-2 py-2">
                        <Input label="Até" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} containerClassName="w-full sm:w-32" />
                    </div>
                    <div className="flex-grow min-w-[200px] px-2 py-2">
                        <label className="block mb-1.5 text-sm font-bold text-text-secondary">Veículo</label>
                        <div className="relative">
                            <select
                                className="w-full px-4 py-2.5 text-sm text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none shadow-sm transition-all hover:border-gray-400 cursor-pointer"
                                value={veiculoId}
                                onChange={e => setVeiculoId(e.target.value)}
                            >
                                <option value="">Todos os Veículos</option>
                                {veiculos.map(v => (
                                    <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
                        </div>
                    </div>
                    <div className="w-full sm:w-auto px-2 py-2">
                        <Button
                            variant="success"
                            onClick={handleExportar}
                            disabled={historico.length === 0}
                            className="w-full sm:w-auto h-[42px] shadow-sm bg-green-600 text-white border-transparent hover:bg-green-700"
                        >
                            Exportar
                        </Button>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center py-12 opacity-60">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-primary mb-3"></div>
                    <p className="text-sm text-gray-500">Carregando viagens...</p>
                </div>
            )}

            {error && <p className="text-center py-8 text-error bg-red-50 rounded-lg border border-red-100">{error}</p>}

            {!loading && !error && historico.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                    <p className="text-gray-400 font-medium">Nenhuma viagem encontrada neste período.</p>
                </div>
            )}

            {!loading && !error && historico.length > 0 && (
                <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {historico.map(jornada => (
                        <div key={jornada.id} className={`group bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 ${deletingId === jornada.id ? 'opacity-50 pointer-events-none' : ''}`}>

                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">

                                {/* Info Principal */}
                                <div className="flex items-start gap-3 flex-1">
                                    <div className="bg-gray-50 px-3 py-2 rounded-lg text-center border border-gray-100 min-w-[80px]">
                                        <span className="block text-xs text-gray-400 font-bold uppercase">{new Date(jornada.dataInicio).toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                                        <span className="block text-lg font-bold text-gray-800 leading-none">{new Date(jornada.dataInicio).getDate()}</span>
                                        <span className="block text-[10px] text-gray-400">{new Date(jornada.dataInicio).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-base font-bold text-gray-900">{jornada.veiculo.placa}</h4>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{jornada.veiculo.modelo}</span>
                                        </div>

                                        <div className="text-sm text-gray-600 flex items-center gap-2">
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                {jornada.operador.nome}
                                            </span>
                                        </div>

                                        <div className="text-xs text-gray-400 mt-1">
                                            {new Date(jornada.dataInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            {' → '}
                                            {jornada.dataFim ? new Date(jornada.dataFim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Em andamento'}
                                        </div>
                                    </div>
                                </div>

                                {/* Status e KM */}
                                <div className="flex flex-col items-end gap-2">
                                    {jornada.dataFim ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Finalizada
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 animate-pulse">
                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Em Rota
                                        </span>
                                    )}

                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Distância</p>
                                        <p className="text-lg font-bold text-gray-800">
                                            {jornada.kmPercorrido > 0 ? `${jornada.kmPercorrido} km` : '--'}
                                        </p>
                                    </div>
                                </div>

                                {/* Ações Admin */}
                                {userRole === 'ADMIN' && (
                                    <div className="pl-2 border-l border-gray-100 ml-2">
                                        <Button
                                            variant="ghost"
                                            className="!p-2 h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            onClick={() => handleDelete(jornada.id)}
                                            disabled={deletingId === jornada.id}
                                            isLoading={deletingId === jornada.id}
                                            title="Excluir registro"
                                            icon={<IconeLixo />}
                                        />
                                    </div>
                                )}

                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}