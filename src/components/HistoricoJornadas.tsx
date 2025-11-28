import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { TableStyles } from '../styles/table';

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
}

export function HistoricoJornadas({ veiculos }: HistoricoJornadasProps) {
    const [historico, setHistorico] = useState<JornadaHistorico[]>([]);
    const [loading, setLoading] = useState(true);
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

            // Endpoint presumido para buscar jornadas finalizadas
            const response = await api.get('/jornadas/historico', { params });
            setHistorico(response.data);
        } catch (err) {
            console.error("Erro ao buscar histórico de jornadas:", err);
            // Fallback visual caso o endpoint ainda não exista no backend
            setError('Não foi possível carregar o histórico de jornadas no momento.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistorico();
    }, [dataInicio, dataFim, veiculoId]);

    const handleExportar = () => {
        if (historico.length === 0) return;
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
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold text-primary text-center mb-4">
                Histórico de Viagens e Jornadas
            </h3>

            {/* Barra de Filtros */}
            <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 items-end">
                <div className="w-full sm:w-auto">
                    <Input label="De" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                </div>
                <div className="w-full sm:w-auto">
                    <Input label="Até" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                </div>
                <div className="flex-grow min-w-[200px]">
                    <label className="block mb-1.5 text-sm font-medium text-text-secondary">Veículo</label>
                    <div className="relative">
                        <select
                            className="w-full px-4 py-2 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                            value={veiculoId}
                            onChange={e => setVeiculoId(e.target.value)}
                        >
                            <option value="">Todos os Veículos</option>
                            {veiculos.map(v => (
                                <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="w-full sm:w-auto">
                    <Button variant="success" onClick={handleExportar} disabled={historico.length === 0}>
                        Exportar
                    </Button>
                </div>
            </div>

            {loading && <p className="text-center py-8 text-primary">Carregando viagens...</p>}
            {error && <p className="text-center py-8 text-error bg-red-50 rounded-lg">{error}</p>}

            {!loading && !error && (
                <div className="overflow-x-auto shadow-card rounded-card border border-gray-100 bg-white">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className={TableStyles.th}>Data/Hora</th>
                                <th className={TableStyles.th}>Veículo</th>
                                <th className={TableStyles.th}>Motorista</th>
                                <th className={`${TableStyles.th} text-right`}>Distância</th>
                                <th className={TableStyles.th}>Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {historico.map(jornada => (
                                <tr key={jornada.id} className={TableStyles.rowHover}>
                                    <td className={TableStyles.td}>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-700">
                                                {new Date(jornada.dataInicio).toLocaleDateString('pt-BR')}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(jornada.dataInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} -
                                                {jornada.dataFim ? new Date(jornada.dataFim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '...'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className={TableStyles.td}>
                                        <span className="font-medium">{jornada.veiculo.placa}</span>
                                        <br />
                                        <span className="text-xs text-gray-500">{jornada.veiculo.modelo}</span>
                                    </td>
                                    <td className={TableStyles.td}>{jornada.operador.nome}</td>
                                    <td className={`${TableStyles.td} text-right`}>
                                        {jornada.kmPercorrido > 0 ? (
                                            <span className="font-bold text-primary">{jornada.kmPercorrido} km</span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className={TableStyles.td}>
                                        {jornada.dataFim ? (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                                                Finalizada
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full animate-pulse">
                                                Em Rota
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {historico.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-gray-500">
                                        Nenhuma viagem encontrada neste período.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}