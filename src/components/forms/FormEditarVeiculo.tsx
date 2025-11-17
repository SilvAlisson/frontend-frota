import { useState, useEffect } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { RENDER_API_BASE_URL } from '../../config';

// Estilos
const inputStyle = "shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-klin-azul focus:border-transparent disabled:bg-gray-200";
const buttonStyle = "bg-klin-azul hover:bg-klin-azul-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
const labelStyle = "block text-gray-700 text-sm font-bold mb-2";
const secondaryButton = "bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full";

// Tipos
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
  
  // (Campos como tipoCombustivel e capacidadeTanque podem ser adicionados aqui se necessário)

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
        // 1. Usar a nova rota GET /api/veiculo/:id
        const response = await api.get(`/veiculo/${veiculoId}`);
        const veiculo = response.data;
        
        // 2. Popular os estados (backend já formata as datas)
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
      // 3. Chamar a rota PUT
      await api.put(`/veiculo/${veiculoId}`, {
        placa: DOMPurify.sanitize(placa.toUpperCase()),
        modelo: DOMPurify.sanitize(modelo),
        ano: parseInt(ano),
        tipoVeiculo: DOMPurify.sanitize(tipoVeiculo),
        vencimentoCiv: vencimentoCiv || null,
        vencimentoCipp: vencimentoCipp || null,
        // (Outros campos como tipoCombustivel podem ser enviados aqui)
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

  // Renderização
  if (loadingData) {
    return <p className="text-center text-klin-azul">A carregar dados do veículo...</p>
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h4 className="text-lg font-semibold text-klin-azul text-center">
        Editar Veículo
      </h4>
      
      {/* Campos Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelStyle}>Placa</label>
          <input type="text" className={inputStyle} value={placa} onChange={(e) => setPlaca(e.target.value)} placeholder="ABC1D23" />
        </div>
        <div>
          <label className={labelStyle}>Modelo</label>
          <input type="text" className={inputStyle} value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Ex: VW Constellation" />
        </div>
        <div>
          <label className={labelStyle}>Tipo de Caminhão</label>
          <input type="text" className={inputStyle} value={tipoVeiculo} onChange={(e) => setTipoVeiculo(e.target.value)} placeholder="Poliguindaste, Munck..." />
        </div>
        <div>
          <label className={labelStyle}>Ano</label>
          <input type="number" className={inputStyle} value={ano} onChange={(e) => setAno(e.target.value)} placeholder="2020" />
        </div>
      </div>

      {/* Documentação */}
      <div className="pt-4 border-t">
        <h4 className="text-md font-semibold text-gray-700 mb-2 text-center">Controle de Documentação (Opcional)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className={labelStyle}>Vencimento CIV</label>
                <input type="date" className={inputStyle} value={vencimentoCiv} onChange={(e) => setVencimentoCiv(e.target.value)} />
            </div>
            <div>
                <label className={labelStyle}>Vencimento CIPP</label>
                <input type="date" className={inputStyle} value={vencimentoCipp} onChange={(e) => setVencimentoCipp(e.target.value)} />
            </div>
        </div>
      </div>

      {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center text-sm">{error}</p>}

      {/* Botões de ação */}
      <div className="flex gap-4 pt-4">
        <button type="button" className={secondaryButton} disabled={loading} onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className={buttonStyle} disabled={loading}>
          {loading ? 'A guardar...' : 'Guardar Alterações'}
        </button>
      </div>
    </form>
  );
}