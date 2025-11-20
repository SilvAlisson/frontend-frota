import { useState } from 'react';
import axios from 'axios';
import { RENDER_API_BASE_URL } from '../config';
import { Button } from './ui/Button'; // Componente Visual
import { Input } from './ui/Input';   // Componente Visual

// Tipos
interface Jornada {
  id: string;
  dataInicio: string;
  kmInicio: number;
  veiculo: { placa: string; modelo: string };
  operador: { nome: string };
  fotoInicioUrl: string | null;
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
      setError('KM Final é obrigatório.');
      setLoading(false);
      return;
    }
    
    const kmFimFloat = parseFloat(kmFim);
    if (isNaN(kmFimFloat) || kmFimFloat < jornada.kmInicio) {
      setError(`KM Final deve ser maior que o Início (${jornada.kmInicio}).`);
      setLoading(false);
      return;
    }

    const api = axios.create({
      baseURL: RENDER_API_BASE_URL,
      headers: { 'Authorization': `Bearer ${token}` }
    });

    try {
      // O back-end permite que ENCARREGADO/ADMIN finalize a jornada de outro user
      await api.put(`/jornada/finalizar/${jornada.id}`, {
        kmFim: kmFimFloat,
        // (Nota: A foto de fim não é pedida aqui, pois é um fecho manual administrativo)
        observacoes: `[Finalizado manualmente pelo Gestor/Admin]`
      });

      setLoading(false);
      // Avisa o componente pai para remover este item da lista
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
    <div className="bg-white p-5 rounded-card shadow-sm border border-gray-200 hover:border-primary/30 transition-colors">
      
      {/* Cabeçalho do Item: Informações Principais */}
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4">
        
        {/* Lado Esquerdo: Operador e Veículo */}
        <div>
            <h5 className="text-lg font-bold text-primary flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                {jornada.operador.nome}
            </h5>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
               <span className="font-semibold bg-gray-100 px-2 py-0.5 rounded text-gray-800">
                 {jornada.veiculo.placa}
               </span>
               <span className="text-text-secondary">
                 ({jornada.veiculo.modelo})
               </span>
            </p>
        </div>

        {/* Lado Direito: Detalhes de Tempo e KM */}
        <div className="text-left md:text-right bg-gray-50 p-3 rounded-lg border border-gray-100 min-w-[150px]">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Início da Jornada</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(jornada.dataInicio).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
            </p>
            <div className="mt-1 pt-1 border-t border-gray-200 flex justify-between md:justify-end gap-2">
               <span className="text-xs text-gray-500">KM Inicial:</span>
               <span className="text-xs font-bold text-gray-800">{jornada.kmInicio}</span>
            </div>
             {/* Link da Foto */}
            {jornada.fotoInicioUrl && (
              <div className="mt-2 text-right">
                <a
                    href={jornada.fotoInicioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:text-primary-hover font-medium underline inline-flex items-center gap-1"
                >
                    Ver Foto
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                </a>
              </div>
            )}
        </div>
      </div>

      {/* Área de Ação: Formulário de Finalização Manual */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <form onSubmit={handleSubmit}>
            <label className="block text-xs font-bold text-text-secondary mb-2 uppercase" htmlFor={`kmFim-gestao-${jornada.id}`}>
                Ação de Encarregado: Finalizar Jornada
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="w-full sm:max-w-xs">
                    <Input
                        id={`kmFim-gestao-${jornada.id}`}
                        type="number"
                        placeholder={`KM Final (> ${jornada.kmInicio})`}
                        value={kmFim}
                        onChange={(e) => setKmFim(e.target.value)}
                        disabled={loading}
                        // Sem label aqui pois já colocamos acima
                    />
                </div>
                <Button 
                    type="submit" 
                    variant="danger" // Vermelho para indicar ação de fechamento/administrativa
                    disabled={loading || !kmFim}
                    isLoading={loading}
                    className="w-full sm:w-auto whitespace-nowrap"
                >
                    Encerrar Turno
                </Button>
            </div>

            {error && (
                <p className="text-error text-xs mt-2 flex items-center gap-1 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}
        </form>
      </div>
    </div>
  );
}