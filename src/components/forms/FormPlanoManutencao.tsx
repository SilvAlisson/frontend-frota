// frontend/src/components/forms/FormPlanoManutencao.tsx
// (Este é um ficheiro NOVO)

import { useState, useEffect } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';

// Tipos
interface FormPlanoProps {
  token: string;
  veiculos: any[]; // Para o dropdown de seleção
}
interface Plano {
  id: string;
  descricao: string;
  tipoIntervalo: 'KM' | 'TEMPO';
  valorIntervalo: number;
  kmProximaManutencao?: number | null;
  dataProximaManutencao?: string | null;
  veiculo: {
    placa: string;
    modelo: string;
  };
}

// Estilos
const inputStyle = "shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-klin-azul focus:border-transparent disabled:bg-gray-200";
const buttonStyle = "bg-klin-azul hover:bg-klin-azul-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
const labelStyle = "block text-gray-700 text-sm font-bold mb-2";

export function FormPlanoManutencao({ token, veiculos }: FormPlanoProps) {
  
  // Estados para o formulário
  const [veiculoId, setVeiculoId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipoIntervalo, setTipoIntervalo] = useState<'KM' | 'TEMPO'>('KM');
  const [valorIntervalo, setValorIntervalo] = useState('');

  // Estados para a lista
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // API (centralizada para este componente)
  const api = axios.create({
    baseURL: 'http://localhost:3001/api',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  // --- Funções de API ---

  // 1. Buscar os planos existentes
  const fetchPlanos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/planos-manutencao'); // Rota que criámos
      setPlanos(response.data);
    } catch (err) {
      setError('Falha ao buscar planos existentes.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Submeter o novo plano
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!veiculoId || !descricao || !tipoIntervalo || !valorIntervalo) {
      setError('Todos os campos são obrigatórios.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/plano-manutencao', { // Rota que criámos
        veiculoId,
        descricao: DOMPurify.sanitize(descricao),
        tipoIntervalo,
        valorIntervalo: parseFloat(valorIntervalo),
      });
      
      setSuccess('Plano criado com sucesso!');
      // Limpa o formulário
      setVeiculoId('');
      setDescricao('');
      setValorIntervalo('');
      
      // Atualiza a lista
      fetchPlanos(); 

    } catch (err) {
      console.error("Erro ao criar plano:", err);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error); 
      } else {
        setError('Falha ao criar o plano.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Deletar um plano
  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem a certeza que quer apagar este plano?")) {
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await api.delete(`/plano-manutencao/${id}`); // Rota que criámos
      // Atualiza a lista
      fetchPlanos();
    } catch (err) {
       console.error("Erro ao deletar plano:", err);
       setError('Falha ao apagar o plano.');
    } finally {
      setLoading(false);
    }
  };

  // Efeito para buscar os planos quando o componente carrega
  useEffect(() => {
    fetchPlanos();
  }, []); // [] = Apenas na primeira vez


  return (
    // Layout de 2 colunas
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* Coluna 1: Formulário de Criação */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <h4 className="text-lg font-semibold text-klin-azul text-center">
            Criar Novo Plano Preventivo
        </h4>
        
        <div>
          <label className={labelStyle}>Veículo</label>
          <select className={inputStyle} value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)}>
            <option value="">Selecione um veículo...</option>
            {veiculos.map(v => (
              <option key={v.id} value={v.id}>{v.placa} ({v.modelo})</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className={labelStyle}>Descrição do Plano</label>
          <input type="text" className={inputStyle} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Revisão 20.000km, Troca de Óleo" />
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div>
            <label className={labelStyle}>Tipo de Intervalo</label>
            <select className={inputStyle} value={tipoIntervalo} onChange={(e) => setTipoIntervalo(e.target.value as 'KM' | 'TEMPO')}>
              <option value="KM">KM</option>
              <option value="TEMPO">Tempo (Meses)</option>
            </select>
          </div>
           <div>
            <label className={labelStyle}>Intervalo (Valor)</label>
            <input type="number" className={inputStyle} value={valorIntervalo} onChange={(e) => setValorIntervalo(e.target.value)} placeholder={tipoIntervalo === 'KM' ? '20000' : '6'} />
          </div>
        </div>
        
        {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center text-sm">{error}</p>}
        {success && <p className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center text-sm">{success}</p>}

        <button type="submit" className={buttonStyle} disabled={loading}>
          {loading ? 'A guardar...' : 'Criar Plano'}
        </button>
      </form>

      {/* Coluna 2: Lista de Planos Atuais */}
      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-klin-azul text-center">
            Planos Atuais
        </h4>
        
        {loading && <p>A carregar lista...</p>}

        <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
          {planos.length === 0 && !loading && (
            <p className="text-center text-gray-500 py-4">Nenhum plano preventivo criado.</p>
          )}

          {planos.map(plano => (
            <div key={plano.id} className="bg-gray-50 p-3 rounded-lg shadow-sm border flex justify-between items-center">
              <div>
                <p className="font-semibold">{plano.descricao}</p>
                <p className="text-sm text-gray-600">
                  Veículo: {plano.veiculo.placa} ({plano.veiculo.modelo})
                </p>
                <p className="text-sm text-gray-600">
                  Regra: A cada {plano.valorIntervalo} {plano.tipoIntervalo === 'KM' ? 'KM' : 'Meses'}
                </p>
                {/* Próximo Alerta (a API já calculou) */}
                {plano.tipoIntervalo === 'KM' && plano.kmProximaManutencao && (
                   <p className="text-sm text-blue-600 font-medium">Próxima em: {plano.kmProximaManutencao} KM</p>
                )}
                {plano.tipoIntervalo === 'TEMPO' && plano.dataProximaManutencao && (
                   <p className="text-sm text-blue-600 font-medium">Próxima em: {new Date(plano.dataProximaManutencao).toLocaleDateString()}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(plano.id)}
                className="bg-red-100 text-red-700 hover:bg-red-200 text-xs font-bold py-2 px-3 rounded"
                disabled={loading}
              >
                Apagar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}