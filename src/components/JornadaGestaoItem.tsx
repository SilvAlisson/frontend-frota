// frontend/src/components/JornadaGestaoItem.tsx
// Este é o sub-componente que o Encarregado usa para finalizar a jornada de um operador

import { useState } from 'react';
import axios from 'axios';

// Classes reutilizáveis do Tailwind
const inputStyle = "shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-klin-azul focus:border-transparent disabled:bg-gray-200";
const buttonStyle = "bg-klin-azul hover:bg-klin-azul-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
const labelStyle = "block text-gray-700 text-sm font-bold mb-2";

// Tipos
interface Jornada {
  id: string;
  dataInicio: string;
  kmInicio: number;
  veiculo: { placa: string; modelo: string };
  operador: { nome: string }; // O 'jornadas/abertas' já inclui isto
}
interface JornadaItemProps {
  token: string;
  jornada: Jornada;
  onFinalizada: (jornadaId: string) => void;
}

export function JornadaGestaoItem({ token, jornada, onFinalizada }: JornadaItemProps) {
  
  const [kmFim, setKmFim] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!kmFim) {
      setError('KM Final é obrigatório para fechar a jornada.');
      setLoading(false);
      return;
    }
    
    const kmFimFloat = parseFloat(kmFim);
    if (isNaN(kmFimFloat) || kmFimFloat < jornada.kmInicio) {
      setError(`KM Final deve ser um número maior que o KM Inicial (${jornada.kmInicio}).`);
      setLoading(false);
      return;
    }

    const api = axios.create({
      baseURL: 'https://api-frota-klin.onrender.com',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    try {
      // O back-end permite que ENCARREGADO/ADMIN finalize a jornada de outro user
      await api.put(`/jornada/finalizar/${jornada.id}`, {
        kmFim: kmFimFloat,
        observacoes: `[Finalizado manualmente pelo Encarregado]`
      });

      setLoading(false);
      // Avisa o App.tsx para remover este item da lista
      onFinalizada(jornada.id); 

    } catch (err) {
      console.error("Erro ao finalizar jornada (Encarregado):", err);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error); 
      } else {
        setError('Falha ao finalizar jornada.');
      }
      setLoading(false);
    }
  };


  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
      
      {/* Informações da Jornada */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          <strong>Operador:</strong> {jornada.operador.nome}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Veículo:</strong> {jornada.veiculo.placa} ({jornada.veiculo.modelo})
        </p>
        <p className="text-sm text-gray-600">
          <strong>Início:</strong> {new Date(jornada.dataInicio).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
        </p>
        <p className="text-sm text-gray-600">
          <strong>KM Inicial:</strong> {jornada.kmInicio}
        </p>
        {/* Futuramente, o link da foto do odómetro apareceria aqui */}
      </div>

      {/* Formulário de Finalização Manual */}
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className={labelStyle} htmlFor={`kmFim-gestao-${jornada.id}`}>
            KM Final (Manual)
          </label>
          <input
            id={`kmFim-gestao-${jornada.id}`}
            type="number"
            placeholder="Insira o KM Final correto"
            className={inputStyle + " py-2"} // py-2 mais pequeno
            value={kmFim}
            onChange={(e) => setKmFim(e.target.value)}
            disabled={loading}
          />
        </div>

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        <button 
          type="submit" 
          className={buttonStyle + " bg-red-600 hover:bg-red-700"} // Botão vermelho para ação de admin
          disabled={loading || !kmFim}
        >
          {loading ? 'Finalizando...' : 'Finalizar Jornada do Operador'}
        </button>
      </form>
    </div>
  );
}