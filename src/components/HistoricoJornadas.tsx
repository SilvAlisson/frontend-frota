import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { toast } from 'sonner';
import { CardJornada } from './CardJornada'; // Novo componente unificado
import type { Jornada } from '../types';

interface HistoricoJornadasProps {
    veiculos: any[];
    userRole?: string;
}

export function HistoricoJornadas({ veiculos, userRole = 'OPERADOR' }: HistoricoJornadasProps) {
    // Usamos o tipo global 'Jornada' em vez de interface local para garantir compatibilidade com o Card
    const [historico, setHistorico] = useState<Jornada[]>([]);
    const [loading, setLoading] = useState(true);
    
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
            console.error("Erro ao buscar histórico:", err);
            toast.error('Não foi possível carregar o histórico.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistorico();
    }, [dataInicio, dataFim, veiculoId]);

    const handleExportar = () => {
        if (historico.length === 0) return;

        const promise = new Promise((resolve, reject) => {
            try {
                const dados = historico.map(j => ({
                    'Saída': new Date(j.dataInicio).toLocaleString('pt-BR'),
                    'Chegada': j.dataFim ? new Date(j.dataFim).toLocaleString('pt-BR') : 'Em andamento',
                    'Veículo': `${j.veiculo.placa} - ${j.veiculo.modelo}`,
                    'Motorista': j.operador.nome,
                    'KM Inicial': j.kmInicio,
                    'KM Final': j.kmFim || '-',
                    'Percorrido (KM)': (j.kmFim && j.kmInicio) ? j.kmFim - j.kmInicio : 0,
                    'Observações': j.observacoes || ''
                }));
                exportarParaExcel(dados, "Historico_Jornadas.xlsx");
                resolve(true);
            } catch (err) {
                reject(err);
            }
        });

        toast.promise(promise, {
            loading: 'Exportando dados...',
            success: 'Histórico exportado com sucesso!',
            error: 'Erro ao exportar arquivo.'
        });
    };

    // Define se o card entra em modo de edição (Gestor) ou apenas leitura (Histórico)
    // Se for ADMIN ou ENCARREGADO, permitimos editar mesmo estando no histórico.
    const mode = (userRole === 'ADMIN' || userRole === 'ENCARREGADO') ? 'GESTOR' : 'HISTORICO';

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

                <div className="flex flex-wrap gap-3 items-end bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <div className="w-full sm:w-auto">
                        <Input label="De" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                    </div>
                    <div className="w-full sm:w-auto">
                        <Input label="Até" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                    </div>
                    <div className="flex-grow min-w-[200px]">
                        <label className="block mb-1.5 text-sm font-bold text-text-secondary">Veículo</label>
                        <select
                            className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            value={veiculoId}
                            onChange={e => setVeiculoId(e.target.value)}
                        >
                            <option value="">Todos os Veículos</option>
                            {veiculos.map(v => (
                                <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full sm:w-auto pb-0.5">
                        <Button
                            variant="success"
                            onClick={handleExportar}
                            disabled={historico.length === 0}
                            className="h-[42px] w-full"
                        >
                            Exportar Excel
                        </Button>
                    </div>
                </div>
            </div>

            {/* LISTAGEM DE CARDS */}
            {loading && (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                </div>
            )}

            {!loading && historico.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
                    <p className="text-gray-400 font-medium">Nenhuma viagem encontrada neste período.</p>
                </div>
            )}

            {!loading && historico.length > 0 && (
                <div className="grid gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {historico.map(jornada => (
                        <CardJornada
                            key={jornada.id}
                            jornada={jornada}
                            mode={mode}
                            onUpdate={fetchHistorico} // Recarrega a lista se houver edição/exclusão no card
                        />
                    ))}
                </div>
            )}
        </div>
    );
}