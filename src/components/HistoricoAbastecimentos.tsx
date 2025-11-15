import { useState, useEffect } from 'react';
import axios from 'axios';
import { RENDER_API_BASE_URL } from '../config';

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
  userRole: string; // <-- CORREÇÃO: Adicionada a propriedade
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

export function HistoricoAbastecimentos({ token, userRole }: HistoricoAbastecimentosProps) {

  const [historico, setHistorico] = useState<Abastecimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
        const response = await api.get('/abastecimentos/recentes');
        setHistorico(response.data);
      } catch (err) {
        console.error("Erro ao buscar histórico de abastecimentos:", err);
        setError('Falha ao carregar histórico.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistorico();
  }, [token]); // Recarrega se o token mudar

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Tem a certeza que quer REMOVER permanentemente este registo de abastecimento? (ID: ${id})\n\nEsta ação não pode ser desfeita e pode afetar os relatórios.`)) {
      return;
    }

    setDeletingId(id);
    setError('');
    try {
      await api.delete(`/abastecimento/${id}`);
      // Remove o item da lista local para atualizar a UI
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
    new Date(dateStr).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

  // Renderização
  if (loading) {
    return <p className="text-center text-klin-azul">A carregar histórico...</p>;
  }
  
  if (historico.length === 0 && !error) {
    return (
      <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
        <p>Nenhum registo de abastecimento encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-klin-azul text-center mb-4">
        Histórico de Abastecimentos (Últimos 50)
      </h3>
      
      {/* Feedback de erro de deleção */}
      {error && <p className="text-center text-red-600 bg-red-100 p-3 rounded border border-red-400">{error}</p>}

      {/* Container para os cards com scroll */}
      <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2">
        {historico.map((ab) => (
          <div key={ab.id} className={`bg-white shadow border border-gray-200 rounded-lg p-4 transition-opacity ${deletingId === ab.id ? 'opacity-50' : 'opacity-100'}`}>
            
            {/* Linha 1: Data, Veículo e Foto */}
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-bold text-lg text-klin-azul">{formatDateTime(ab.dataHora)}</span>
                <p className="text-sm text-gray-700 font-semibold">{ab.veiculo.placa} ({ab.veiculo.modelo})</p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Link da Foto da Nota Fiscal */}
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

                {/* Botão de Remover (Apenas Admin) */}
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

            {/* Linha 2: Detalhes (KM, Operador, Posto) */}
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

            {/* Linha 3: Itens e Custo Total */}
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