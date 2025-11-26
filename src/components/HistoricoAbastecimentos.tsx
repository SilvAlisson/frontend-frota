import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { TableStyles } from '../styles/table';

// ...Interfaces (Abastecimento, ItemAbastecimento) mantidas...
interface ItemAbastecimento {
  quantidade: number;
  produto: {
    nome: string;
    tipo: string;
  };
}
interface Abastecimento {
  id: string;
  dataHora: string;
  kmOdometro: number;
  custoTotal: number;
  fotoNotaFiscalUrl: string | null;
  veiculo: {
    placa: string;
    modelo: string;
  };
  operador: {
    nome: string;
  };
  fornecedor: {
    nome: string;
  };
  itens: ItemAbastecimento[];
}

interface HistoricoAbastecimentosProps {
  // Removido token
  userRole: string;
  veiculos: any[];
}

function IconeFoto() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}
function IconeLixo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" />
    </svg>
  );
}

export function HistoricoAbastecimentos({ userRole, veiculos }: HistoricoAbastecimentosProps) {

  const [historico, setHistorico] = useState<Abastecimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [dataInicioFiltro, setDataInicioFiltro] = useState('');
  const [dataFimFiltro, setDataFimFiltro] = useState('');
  const [veiculoIdFiltro, setVeiculoIdFiltro] = useState('');

  const fetchHistorico = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (dataInicioFiltro) params.dataInicio = dataInicioFiltro;
      if (dataFimFiltro) params.dataFim = dataFimFiltro;
      if (veiculoIdFiltro) params.veiculoId = veiculoIdFiltro;

      const response = await api.get('/abastecimentos/recentes', { params });
      setHistorico(response.data);
    } catch (err) {
      console.error("Erro ao buscar histórico:", err);
      setError('Falha ao carregar histórico.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorico();
  }, [dataInicioFiltro, dataFimFiltro, veiculoIdFiltro]);

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Tem certeza que quer REMOVER este registro?`)) return;
    setDeletingId(id);
    setError('');
    try {
      await api.delete(`/abastecimento/${id}`);
      setHistorico(prev => prev.filter(ab => ab.id !== id));
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Falha ao remover o registo.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;
  const formatDateTime = (dateStr: string) => new Date(dateStr).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' });

  const handleExportar = () => {
    setError('');
    if (historico.length === 0) {
      setError("Nenhum dado para exportar.");
      return;
    }
    try {
      const dadosFormatados = historico.flatMap(ab => {
        const itensFormatados = ab.itens.map(item => `${item.produto.nome} (${item.quantidade} ${item.produto.tipo === 'COMBUSTIVEL' ? 'L' : 'Un'})`).join(', ');
        return {
          'Data/Hora': formatDateTime(ab.dataHora),
          'Placa': ab.veiculo.placa,
          'Modelo': ab.veiculo.modelo,
          'KM': ab.kmOdometro,
          'Itens': itensFormatados,
          'Fornecedor': ab.fornecedor.nome,
          'Operador': ab.operador.nome,
          'Total (R$)': ab.custoTotal.toFixed(2).replace('.', ','),
          'Nota Fiscal': ab.fotoNotaFiscalUrl || 'N/A',
        };
      });
      exportarParaExcel(dadosFormatados, "Historico_Abastecimentos.xlsx");
    } catch (err) {
      setError('Erro ao exportar.');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-primary text-center mb-4">
        Histórico de Abastecimentos ({historico.length > 0 ? `${historico.length}` : 'Recentes'})
      </h3>

      <FiltrosHistorico
        veiculos={veiculos}
        veiculoId={veiculoIdFiltro}
        setVeiculoId={setVeiculoIdFiltro}
        dataInicio={dataInicioFiltro}
        setDataInicio={setDataInicioFiltro}
        dataFim={dataFimFiltro}
        setDataFim={setDataFimFiltro}
        onExportar={handleExportar}
        loading={loading}
        historicoLength={historico.length}
      />

      {error && <p className="text-center text-error bg-red-50 p-3 rounded border border-red-200">{error}</p>}
      {loading && <p className="text-center text-primary">Carregando histórico...</p>}

      {!loading && historico.length === 0 && !error && (
        <div className={TableStyles.emptyState}>
          <p>Nenhum registo encontrado.</p>
        </div>
      )}

      <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {!loading && historico.map((ab) => (
          <div key={ab.id} className={`bg-white shadow-sm border border-gray-200 rounded-card p-4 transition-opacity ${deletingId === ab.id ? 'opacity-50' : 'opacity-100'}`}>

            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-bold text-lg text-primary">{formatDateTime(ab.dataHora)}</span>
                <p className="text-sm text-gray-700 font-semibold">{ab.veiculo.placa} ({ab.veiculo.modelo})</p>
              </div>

              <div className="flex items-center gap-3">
                {ab.fotoNotaFiscalUrl ? (
                  <a href={ab.fotoNotaFiscalUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-primary-hover font-medium underline inline-flex items-center gap-1">
                    Nota Fiscal <IconeFoto />
                  </a>
                ) : <span className="text-sm text-gray-400 italic">(Sem foto)</span>}

                {userRole === 'ADMIN' && (
                  <Button
                    variant="danger"
                    className={TableStyles.actionButton}
                    onClick={() => handleDelete(ab.id)}
                    disabled={deletingId === ab.id}
                    title="Remover"
                    icon={<IconeLixo />}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm border-t border-b border-gray-100 py-2 my-2">
              <div><span className="font-semibold text-gray-500 block">KM</span><span className="text-gray-800">{ab.kmOdometro}</span></div>
              <div><span className="font-semibold text-gray-500 block">Operador</span><span className="text-gray-800">{ab.operador.nome}</span></div>
              <div><span className="font-semibold text-gray-500 block">Fornecedor</span><span className="text-gray-800">{ab.fornecedor.nome}</span></div>
            </div>

            <div className="flex justify-between items-end">
              <div className="text-sm text-gray-600">
                <span className="font-semibold block text-gray-500">Itens:</span>
                <ul className="list-disc list-inside">
                  {ab.itens.map((item, idx) => (
                    <li key={idx}>{item.produto.nome} ({item.quantidade} {item.produto.tipo === 'COMBUSTIVEL' ? 'L' : 'Un'})</li>
                  ))}
                </ul>
              </div>
              <div className="text-right">
                <span className="font-semibold text-gray-500 block">Total</span>
                <span className="text-xl font-bold text-red-600">{formatCurrency(ab.custoTotal)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Sub-componente de Filtros (Reutilizado)
interface FiltrosProps {
  veiculos: any[];
  veiculoId: string;
  setVeiculoId: (val: string) => void;
  dataInicio: string;
  setDataInicio: (val: string) => void;
  dataFim: string;
  setDataFim: (val: string) => void;
  onExportar: () => void;
  loading: boolean;
  historicoLength: number;
}

function FiltrosHistorico({ veiculos, veiculoId, setVeiculoId, dataInicio, setDataInicio, dataFim, setDataFim, onExportar, loading, historicoLength }: FiltrosProps) {
  return (
    <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 items-end">
      <div className="w-full sm:w-auto"><Input label="Início" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} /></div>
      <div className="w-full sm:w-auto"><Input label="Fim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} /></div>

      <div className="flex-grow min-w-[200px]">
        <label className="block mb-1.5 text-sm font-medium text-text-secondary">Veículo</label>
        <div className="relative">
          <select className="w-full px-4 py-2 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none" value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)}>
            <option value="">-- Todos --</option>
            {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} ({v.modelo})</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
        </div>
      </div>

      <div className="w-full sm:w-auto">
        <Button variant="success" onClick={onExportar} disabled={historicoLength === 0 || loading} className="w-full sm:w-auto">Exportar</Button>
      </div>
    </div>
  );
}