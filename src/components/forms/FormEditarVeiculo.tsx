import { useState, useEffect } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { RENDER_API_BASE_URL } from '../../config';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface FormEditarVeiculoProps {
  token: string;
  veiculoId: string;
  onVeiculoEditado: () => void;
  onCancelar: () => void;
}

export function FormEditarVeiculo({ token, veiculoId, onVeiculoEditado, onCancelar }: FormEditarVeiculoProps) {
  // Estados do formulário
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [tipoVeiculo, setTipoVeiculo] = useState('');
  const [vencimentoCiv, setVencimentoCiv] = useState('');
  const [vencimentoCipp, setVencimentoCipp] = useState('');
  
  // Estados de controlo
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  
  // API com token
  const api = axios.create({
    baseURL: RENDER_API_BASE_URL,
    headers: { 'Authorization': `Bearer ${token}` }
  });

  // Efeito para buscar os dados do veículo
  useEffect(() => {
    if (!veiculoId) return;
    
    const fetchVeiculo = async () => {
      setLoadingData(true);
      setError('');
      try {
        const response = await api.get(`/veiculo/${veiculoId}`);
        const veiculo = response.data;
        
        setPlaca(veiculo.placa || '');
        setModelo(veiculo.modelo || '');
        setAno(veiculo.ano?.toString() || '');
        setTipoVeiculo(veiculo.tipoVeiculo || '');
        setVencimentoCiv(veiculo.vencimentoCiv || '');
        setVencimentoCipp(veiculo.vencimentoCipp || '');
        
      } catch (err) {
        console.error("Erro ao buscar dados do veículo:", err);
        setError('Falha ao carregar os dados do veículo para edição.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchVeiculo();
  }, [veiculoId, token]);

  // Função de submissão (PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!placa || !modelo || !ano) {
      setError('Campos principais (Placa, Modelo, Ano) são obrigatórios.');
      setLoading(false);
      return;
    }

    try {
      await api.put(`/veiculo/${veiculoId}`, {
        placa: DOMPurify.sanitize(placa.toUpperCase()),
        modelo: DOMPurify.sanitize(modelo),
        ano: parseInt(ano),
        tipoVeiculo: DOMPurify.sanitize(tipoVeiculo),
        vencimentoCiv: vencimentoCiv || null,
        vencimentoCipp: vencimentoCipp || null,
      });
      
      onVeiculoEditado(); // Chama o callback de sucesso

    } catch (err) {
      console.error("Erro ao atualizar veículo:", err);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error); 
      } else {
        setError('Falha ao atualizar veículo.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Renderização do Loading Inicial
  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <p className="text-sm text-text-secondary">A carregar dados do veículo...</p>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      
      {/* CABEÇALHO COM ÍCONE */}
      <div className="text-center mb-6">
         <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 mb-3">
            {/* Ícone de Edição/Caminhão */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
         </div>
         <h4 className="text-xl font-bold text-primary">
           Editar Veículo
         </h4>
         <p className="text-sm text-text-secondary mt-1">
           Atualize as informações da frota.
         </p>
      </div>

      {/* Grid Responsivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Placa"
          value={placa}
          onChange={(e) => setPlaca(e.target.value)}
          placeholder="ABC1D23"
          disabled={loading}
        />
        <Input
          label="Modelo"
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          placeholder="Ex: VW Constellation"
          disabled={loading}
        />
        <Input
          label="Tipo de Caminhão"
          value={tipoVeiculo}
          onChange={(e) => setTipoVeiculo(e.target.value)}
          placeholder="Poliguindaste, Munck..."
          disabled={loading}
        />
        <Input
          label="Ano"
          type="number"
          value={ano}
          onChange={(e) => setAno(e.target.value)}
          placeholder="2020"
          disabled={loading}
        />
      </div>

      {/* Secção de Documentação */}
      <div className="pt-4 border-t border-gray-100 mt-6">
        <h4 className="text-sm font-bold text-text-secondary mb-4 uppercase tracking-wide text-center md:text-left flex items-center gap-2">
            <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Controle de Documentação (Opcional)
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Vencimento CIV"
              type="date"
              value={vencimentoCiv}
              onChange={(e) => setVencimentoCiv(e.target.value)}
              disabled={loading}
            />
            <Input
              label="Vencimento CIPP"
              type="date"
              value={vencimentoCipp}
              onChange={(e) => setVencimentoCipp(e.target.value)}
              disabled={loading}
            />
        </div>
      </div>

      {/* Feedback de Erro */}
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-md bg-red-50 border border-red-200 text-error text-sm animate-pulse mt-4">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
             <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
           </svg>
           <span>{error}</span>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex gap-3 pt-4">
        <Button 
          type="button" 
          variant="secondary" 
          className="flex-1" 
          disabled={loading} 
          onClick={onCancelar}
        >
          Cancelar
        </Button>
        
        <Button 
          type="submit" 
          variant="primary" 
          className="flex-1" 
          disabled={loading}
          isLoading={loading}
        >
          {loading ? 'A guardar...' : 'Guardar Alterações'}
        </Button>
      </div>
    </form>
  );
}