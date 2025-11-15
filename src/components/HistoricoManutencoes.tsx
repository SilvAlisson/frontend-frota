import { useState, useEffect } from 'react';
import axios from 'axios';
import { RENDER_API_BASE_URL } from '../config';

// Tipos (baseados nos 'includes' da nova rota do backend)
interface ItemManutencao {
  produto: {
    nome: string;
  };
}
interface OrdemServico {
  id: string;
  data: string;
  kmAtual: number;
  custoTotal: number;
  tipo: string;
  fotoComprovanteUrl: string | null;
  veiculo: {
    placa: string;
    modelo: string;
  };
  encarregado: { // Quem registou
    nome: string;
  };
  fornecedor: { // Oficina
    nome: string;
  };
  itens: ItemManutencao[];
}

interface HistoricoManutencoesProps {
  token: string;
}

// Sub-componente para o ícone da foto (para usar no link)
function IconeFoto() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}

// Define cores para os Tipos de Manutenção
const tipoCores: { [key: string]: string } = {
  PREVENTIVA: 'bg-blue-100 text-blue-800',
  CORRETIVA: 'bg-yellow-100 text-yellow-800',
  LAVAGEM: 'bg-green-100 text-green-800',
};


export function HistoricoManutencoes({ token }: HistoricoManutencoesProps) {

  const [historico, setHistorico] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Efeito para buscar os dados na nova rota da API
  useEffect(() => {
    const fetchHistorico = async () => {
      setLoading(true);
      setError('');
      try {
        const api = axios.create({
          baseURL: RENDER_API_BASE_URL,
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Chama a nova rota do backend
        const response = await api.get('/ordens-servico/recentes');
        setHistorico(response.data);

      } catch (err) {
        console.error("Erro ao buscar histórico de manutenções:", err);
        setError('Falha ao carregar histórico.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistorico();
  }, [token]); // Recarrega se o token mudar

  // Funções de formatação
  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;
  const formatDate = (dateStr: string) => 
    new Date(dateStr).toLocaleDateString('pt-BR', { dateStyle: 'short' });

  // Renderização
  if (loading) {
    return <p className="text-center text-klin-azul">A carregar histórico...</p>;
  }
  if (error) {
    return <p className="text-center text-red-600">{error}</p>;
  }
  if (historico.length === 0) {
    return (
      <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
        <p>Nenhum registo de manutenção ou lavagem encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-klin-azul text-center mb-4">
        Histórico de Manutenções (Últimos 50)
      </h3>
      
      {/* Container para os cards com scroll */}
      <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2">
        {historico.map((os) => (
          <div key={os.id} className="bg-white shadow border border-gray-200 rounded-lg p-4">
            
            {/* Linha 1: Data, Veículo e Foto */}
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-bold text-lg text-klin-azul">{formatDate(os.data)}</span>
                <p className="text-sm text-gray-700 font-semibold">{os.veiculo.placa} ({os.veiculo.modelo})</p>
              </div>
              {/* Link da Foto do Comprovante */}
              {os.fotoComprovanteUrl ? (
                <a
                  href={os.fotoComprovanteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-klin-azul hover:text-klin-azul-hover font-medium underline inline-flex items-center gap-1 flex-shrink-0 ml-4"
                >
                  Ver Comprovativo
                  <IconeFoto />
                </a>
              ) : (
                 <span className="text-sm text-gray-500 italic flex-shrink-0 ml-4">(Sem foto)</span>
              )}
            </div>

            {/* Linha 2: Detalhes (KM, Tipo, Oficina) */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm border-t border-b py-2 my-2">
              <div>
                <span className="font-semibold text-gray-500 block">KM Veículo</span>
                <span className="text-gray-800">{os.kmAtual} KM</span>
              </div>
               <div>
                <span className="font-semibold text-gray-500 block">Oficina/Fornecedor</span>
                <span className="text-gray-800">{os.fornecedor.nome}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-500 block">Tipo</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tipoCores[os.tipo] || 'bg-gray-100 text-gray-800'}`}>
                  {os.tipo}
                </span>
              </div>
            </div>

            {/* Linha 3: Itens e Custo Total */}
            <div className="flex justify-between items-end">
              <div className="text-sm">
                <span className="font-semibold text-gray-500 block">Itens/Serviços:</span>
                <ul className="list-disc list-inside">
                  {os.itens.map((item, index) => (
                    <li key={index} className="text-gray-700">
                      {item.produto.nome}
                    </li>
                  ))}
                </ul>
                <span className="text-xs text-gray-500 mt-1 block">Registado por: {os.encarregado.nome}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-gray-500 block">Custo Total</span>
                <span className="text-xl font-bold text-red-600">{formatCurrency(os.custoTotal)}</span>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}