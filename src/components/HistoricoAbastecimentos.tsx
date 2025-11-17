import { useState, useEffect } from 'react';
import axios from 'axios';
import { RENDER_API_BASE_URL } from '../config';
import { exportarParaExcel } from '../utils';

// Tipos (baseados nos 'includes' da nova rota do backend)
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
  token: string;
  userRole: string; 
  veiculos: any[];
}

// Sub-componente para o ícone da foto (para usar no link)
function IconeFoto() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}
// Ícone de Lixo
function IconeLixo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" />
    </svg>
  );
}

const exportButton = "bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50";


export function HistoricoAbastecimentos({ token, userRole, veiculos }: HistoricoAbastecimentosProps) {

  const [historico, setHistorico] = useState<Abastecimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [dataInicioFiltro, setDataInicioFiltro] = useState('');
  const [dataFimFiltro, setDataFimFiltro] = useState('');
  const [veiculoIdFiltro, setVeiculoIdFiltro] = useState('');

  const api = axios.create({
    baseURL: RENDER_API_BASE_URL,
    headers: { 'Authorization': `Bearer ${token}` }
  });

  // Efeito para buscar os dados na nova rota da API
  useEffect(() => {
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
        console.error("Erro ao buscar histórico de abastecimentos:", err);
        setError('Falha ao carregar histórico.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistorico();
  }, [token, dataInicioFiltro, dataFimFiltro, veiculoIdFiltro]); // Recarrega se os filtros mudarem

  const handleDelete = async (id: string) => {
    // Removida a confirmação duplicada
    if (!window.confirm(`Tem a certeza que quer REMOVER permanentemente este registo de abastecimento? (ID: ${id})\n\nEsta ação não pode ser desfeita e pode afetar os relatórios.`)) {
      return;
    }

    setDeletingId(id);
    setError('');
    try {
      await api.delete(`/abastecimento/${id}`);
      setHistorico(prev => prev.filter(ab => ab.id !== id));
    } catch (err) {
      console.error("Erro ao deletar abastecimento:", err);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Falha ao remover o registo.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  // Funções de formatação
  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;
  const formatDateTime = (dateStr: string) => 
    new Date(dateStr).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' });

  // Handler de exportação
  const handleExportar = () => {
    setError('');
    if (historico.length === 0) {
      setError("Nenhum dado para exportar (baseado nos filtros atuais).");
      return;
    }
    
    try {
      // Formatar os dados para o Excel
      const dadosFormatados = historico.flatMap(ab => {
        const dataFormatada = formatDateTime(ab.dataHora);
        const itensFormatados = ab.itens.map(item => `${item.produto.nome} (${item.quantidade} ${item.produto.tipo === 'COMBUSTIVEL' ? 'L' : 'Un'})`).join(', ');

        return {
          'Data/Hora': dataFormatada,
          'Placa': ab.veiculo.placa,
          'Modelo': ab.veiculo.modelo,
          'KM Odómetro': ab.kmOdometro,
          'Itens': itensFormatados,
          'Fornecedor (Posto)': ab.fornecedor.nome,
          'Operador': ab.operador.nome,
          'Custo Total (R$)': ab.custoTotal.toFixed(2).replace('.', ','),
          'Link Nota Fiscal': ab.fotoNotaFiscalUrl || 'N/A',
        };
      });
      
      exportarParaExcel(dadosFormatados, "Historico_Abastecimentos.xlsx");

    } catch (err) {
      setError('Ocorreu um erro ao preparar os dados para exportação.');
      console.error(err);
    }
  };


  // Renderização
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-klin-azul text-center mb-4">
        Histórico de Abastecimentos ({historico.length > 0 ? `${historico.length} resultados` : 'Últimos 50 por filtro'})
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
      
      {error && <p className="text-center text-red-600 bg-red-100 p-3 rounded border border-red-400">{error}</p>}

      {loading && (
         <p className="text-center text-klin-azul">A carregar histórico...</p>
      )}
      
      {!loading && historico.length === 0 && !error && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
          <p>Nenhum registo de abastecimento encontrado (para os filtros selecionados).</p>
        </div>
      )}

      {/* Container para os cards com scroll */}
      <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2">
        {!loading && historico.map((ab) => (
          <div key={ab.id} className={`bg-white shadow border border-gray-200 rounded-lg p-4 transition-opacity ${deletingId === ab.id ? 'opacity-50' : 'opacity-100'}`}>
            
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-bold text-lg text-klin-azul">{formatDateTime(ab.dataHora)}</span>
                <p className="text-sm text-gray-700 font-semibold">{ab.veiculo.placa} ({ab.veiculo.modelo})</p>
              </div>
              
              <div className="flex items-center gap-4">
                {ab.fotoNotaFiscalUrl ? (
                  <a
                    href={ab.fotoNotaFiscalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-klin-azul hover:text-klin-azul-hover font-medium underline inline-flex items-center gap-1 flex-shrink-0"
                  >
                    Ver Nota Fiscal
                    <IconeFoto />
                  </a>
                ) : (
                  <span className="text-sm text-gray-500 italic flex-shrink-0">(Sem foto)</span>
                )}

                {userRole === 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => handleDelete(ab.id)}
                    disabled={deletingId === ab.id}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    title="Remover Registo (Apenas Admin)"
                  >
                    {deletingId === ab.id ? 'Aguarde...' : <IconeLixo />}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm border-t border-b py-2 my-2">
              <div>
                <span className="font-semibold text-gray-500 block">KM Odómetro</span>
                <span className="text-gray-800">{ab.kmOdometro} KM</span>
              </div>
              <div>
                <span className="font-semibold text-gray-500 block">Operador</span>
                <span className="text-gray-800">{ab.operador.nome}</span>
              </div>
               <div>
                <span className="font-semibold text-gray-500 block">Fornecedor</span>
                <span className="text-gray-800">{ab.fornecedor.nome}</span>
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div className="text-sm">
                <span className="font-semibold text-gray-500 block">Itens Registados:</span>
                <ul className="list-disc list-inside">
                  {ab.itens.map(item => (
                    <li key={item.produto.nome} className="text-gray-700">
                      {item.produto.nome} ({item.quantidade} L/Un)
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-right">
                <span className="font-semibold text-gray-500 block">Custo Total</span>
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
const inputStyle = "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-klin-azul";
const labelStyle = "block text-sm font-bold text-gray-700 mb-1";

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

function FiltrosHistorico({
  veiculos,
  veiculoId,
  setVeiculoId,
  dataInicio,
  setDataInicio,
  dataFim,
  setDataFim,
  onExportar,
  loading,
  historicoLength
}: FiltrosProps) {
  return (
    <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg border items-end">
      <div>
        <label className={labelStyle}>Data Início</label>
        <input 
          type="date"
          className={inputStyle}
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
        />
      </div>
      <div>
        <label className={labelStyle}>Data Fim</label>
        <input 
          type="date"
          className={inputStyle}
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
        />
      </div>
      <div className="flex-grow">
        <label className={labelStyle}>Veículo</label>
        <select 
          className={inputStyle}
          value={veiculoId}
          onChange={(e) => setVeiculoId(e.target.value)}
        >
          <option value="">-- Todos os Veículos --</option>
          {veiculos.map(v => (
            <option key={v.id} value={v.id}>{v.placa} ({v.modelo})</option>
          ))}
        </select>
      </div>

      <div className="flex-shrink-0">
         <button
            type="button"
            className={exportButton + " text-sm py-2"}
            onClick={onExportar}
            disabled={historicoLength === 0 || loading}
          >
            Exportar (Excel)
          </button>
      </div>
    </div>
  );
}