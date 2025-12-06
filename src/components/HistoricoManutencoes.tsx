import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { toast } from 'sonner';

// Tipos
interface ItemManutencao {
  produto: {
    nome: string;
  };
  quantidade: number; // Adicionado para melhor detalhamento se disponível
  valorTotalItem?: number; // Adicionado para melhor detalhamento se disponível
}
interface OrdemServico {
  id: string;
  data: string;
  kmAtual: number;
  custoTotal: number;
  tipo: 'PREVENTIVA' | 'CORRETIVA' | 'LAVAGEM';
  fotoComprovanteUrl: string | null;
  veiculo: {
    placa: string;
    modelo: string;
  };
  encarregado: {
    nome: string;
  };
  fornecedor: {
    nome: string;
  };
  itens: ItemManutencao[];
}

interface HistoricoManutencoesProps {
  userRole: string;
  veiculos: any[];
  filtroInicial?: {
    veiculoId?: string;
    dataInicio?: string;
  };
}

// Ícones
function IconeFoto() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>; }
function IconeLixo() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" /></svg>; }

// Cores para os Tipos
const tipoConfig = {
  PREVENTIVA: { color: 'bg-blue-50 text-blue-700 border-blue-100', label: 'Preventiva' },
  CORRETIVA: { color: 'bg-orange-50 text-orange-700 border-orange-100', label: 'Corretiva' },
  LAVAGEM: { color: 'bg-green-50 text-green-700 border-green-100', label: 'Lavagem' },
};

export function HistoricoManutencoes({ userRole, veiculos, filtroInicial }: HistoricoManutencoesProps) {

  const [historico, setHistorico] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [veiculoIdFiltro, setVeiculoIdFiltro] = useState(filtroInicial?.veiculoId || '');
  const [dataInicioFiltro, setDataInicioFiltro] = useState(filtroInicial?.dataInicio || '');
  const [dataFimFiltro, setDataFimFiltro] = useState('');

  useEffect(() => {
    const fetchHistorico = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (veiculoIdFiltro) params.veiculoId = veiculoIdFiltro;
        if (dataInicioFiltro) params.dataInicio = dataInicioFiltro;
        if (dataFimFiltro) params.dataFim = dataFimFiltro;

        const response = await api.get('/ordens-servico/recentes', { params });
        setHistorico(response.data);

      } catch (err) {
        console.error("Erro ao buscar histórico:", err);
        toast.error('Falha ao carregar histórico de manutenções.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistorico();
  }, [veiculoIdFiltro, dataInicioFiltro, dataFimFiltro]);

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Tem certeza que quer REMOVER permanentemente este registro?`)) return;

    setDeletingId(id);
    const promise = api.delete(`/ordem-servico/${id}`);

    toast.promise(promise, {
      loading: 'Removendo OS...',
      success: () => {
        setHistorico(prev => prev.filter(os => os.id !== id));
        setDeletingId(null);
        return 'Registro removido com sucesso.';
      },
      error: (err) => {
        setDeletingId(null);
        return err.response?.data?.error || 'Falha ao remover o registro.';
      }
    });
  };

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('pt-BR', { dateStyle: 'short', timeZone: 'UTC' });

  const handleExportar = () => {
    if (historico.length === 0) return;

    const exportPromise = new Promise((resolve, reject) => {
      try {
        const dadosFormatados = historico.map(os => {
          const itensFormatados = os.itens.map(item => item.produto.nome).join(', ');
          return {
            'Data': formatDate(os.data),
            'Placa': os.veiculo?.placa || 'N/A',
            'Modelo': os.veiculo?.modelo || 'N/A',
            'KM Atual': os.kmAtual,
            'Tipo': os.tipo,
            'Itens/Serviços': itensFormatados,
            'Oficina/Fornecedor': os.fornecedor.nome,
            'Custo Total (R$)': os.custoTotal.toFixed(2).replace('.', ','),
            'Registrado Por': os.encarregado.nome,
            'Link do Comprovante': os.fotoComprovanteUrl || 'N/A',
          };
        });
        exportarParaExcel(dadosFormatados, "Historico_Manutencoes.xlsx");
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });

    toast.promise(exportPromise, {
      loading: 'Gerando planilha...',
      success: 'Exportação concluída!',
      error: 'Erro ao exportar dados.'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* CABEÇALHO E FILTROS */}
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Histórico de Manutenções
            <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {historico.length}
            </span>
          </h3>
        </div>

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
      </div>

      {/* LISTA DE CARDS */}
      <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 opacity-60">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-primary mb-3"></div>
            <p className="text-sm text-gray-500">Carregando histórico...</p>
          </div>
        )}

        {!loading && historico.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
            <p className="text-gray-400 font-medium">Nenhum registro encontrado neste período.</p>
          </div>
        )}

        {!loading && historico.map((os) => (
          <div key={os.id} className={`group bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 ${deletingId === os.id ? 'opacity-50 pointer-events-none' : ''}`}>

            {/* Linha 1: Data, Veículo, Tipo */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="bg-gray-50 px-3 py-1.5 rounded-lg text-center border border-gray-100 min-w-[80px]">
                  <span className="block text-xs text-gray-400 font-bold uppercase">{new Date(os.data).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                  <span className="block text-lg font-bold text-gray-800 leading-none">{new Date(os.data).getDate()}</span>
                  <span className="block text-[10px] text-gray-400">{new Date(os.data).getFullYear()}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {os.veiculo ? (
                      <>
                        <h4 className="text-base font-bold text-gray-900">{os.veiculo.placa}</h4>
                        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{os.veiculo.modelo}</span>
                      </>
                    ) : (
                      <span className="text-sm font-bold text-gray-500 italic">Não vinculado a veículo</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${tipoConfig[os.tipo]?.color || 'bg-gray-100 text-gray-600'}`}>
                      {tipoConfig[os.tipo]?.label || os.tipo}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      • {os.fornecedor.nome}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {os.fotoComprovanteUrl && (
                  <a
                    href={os.fotoComprovanteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Ver Comprovante"
                  >
                    <IconeFoto />
                  </a>
                )}

                {userRole === 'ADMIN' && (
                  <Button
                    variant="ghost"
                    className="!p-2 h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    onClick={() => handleDelete(os.id)}
                    disabled={deletingId === os.id}
                    title="Remover registro"
                    icon={<IconeLixo />}
                  />
                )}
              </div>
            </div>

            {/* Linha 2: Detalhes e Valores */}
            <div className="bg-gray-50/50 rounded-lg p-3 flex flex-wrap justify-between items-end gap-4 border border-gray-100/50">
              <div className="space-y-1 max-w-[70%]">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Serviços Realizados</span>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                  {os.itens.map((item, index) => (
                    <li key={index} className="truncate">
                      {item.produto.nome}
                    </li>
                  ))}
                </ul>
                <div className="text-xs text-gray-400 pt-1 mt-1 border-t border-gray-100">
                  Reg.: {os.encarregado.nome} {os.kmAtual > 0 && `• KM ${os.kmAtual.toLocaleString('pt-BR')}`}
                </div>
              </div>

              <div className="text-right">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Custo Total</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(os.custoTotal)}</span>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}

// Sub-componente de Filtros (Reutilizável)
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
    <div className="flex flex-wrap gap-3 items-end bg-gray-50 p-1 rounded-xl border border-gray-100">
      <div className="w-full sm:w-auto px-2 py-2">
        <Input label="De" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} containerClassName="w-full sm:w-32" />
      </div>
      <div className="w-full sm:w-auto px-2 py-2">
        <Input label="Até" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} containerClassName="w-full sm:w-32" />
      </div>

      <div className="flex-grow min-w-[200px] px-2 py-2">
        <label className="block mb-1.5 text-sm font-bold text-text-secondary">Veículo</label>
        <div className="relative">
          <select
            className="w-full px-4 py-2.5 text-sm text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none shadow-sm transition-all hover:border-gray-400 cursor-pointer"
            value={veiculoId}
            onChange={(e) => setVeiculoId(e.target.value)}
          >
            <option value="">Todos os veículos</option>
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
          onClick={onExportar}
          disabled={historicoLength === 0 || loading}
          className="w-full sm:w-auto h-[42px] shadow-sm bg-green-600 text-white border-transparent hover:bg-green-700"
        >
          Exportar
        </Button>
      </div>
    </div>
  );
}