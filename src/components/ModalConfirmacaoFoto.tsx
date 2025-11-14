import { useState } from 'react';
import axios from 'axios';
import { RENDER_API_BASE_URL } from '../config';

// Classes reutilizáveis do Tailwind
const inputStyle = "shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-klin-azul focus:border-transparent disabled:bg-gray-200";
const buttonStyle = "bg-klin-azul hover:bg-klin-azul-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
const labelStyle = "block text-gray-700 text-sm font-bold mb-2";

interface ModalProps {
  token: string;
  titulo: string; 
  // ================== MUDANÇA 1 AQUI ==================
  kmParaConfirmar: number | null; // <-- Alterado de 'number' para 'number | null'
  // ================== FIM DA MUDANÇA ==================
  jornadaId: string | null; 
  dadosJornada: any; 
  apiEndpoint: string; 
  apiMethod: 'POST' | 'PUT';
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export function ModalConfirmacaoFoto({
  token,
  titulo,
  kmParaConfirmar,
  jornadaId,
  dadosJornada,
  apiEndpoint,
  apiMethod,
  onClose,
  onSuccess
}: ModalProps) {
  
  const [foto, setFoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    if (!foto) {
      setError('A foto é obrigatória.'); // Texto genérico
      setLoading(false);
      return;
    }

    const api = axios.create({
      baseURL: RENDER_API_BASE_URL,
      headers: { 'Authorization': `Bearer ${token}` }
    });

    try {
      // 1. Fazer o Upload da Foto (Rota genérica /upload)
      const formData = new FormData();
      formData.append('fotoOdometro', foto); // O backend espera 'fotoOdometro'

      const uploadResponse = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const fotoUrl = uploadResponse.data.url;
      if (!fotoUrl) throw new Error('Ocorreu um erro no upload da foto.');

      // 2. Preparar os dados com o URL da foto
      let dadosCompletos = { ...dadosJornada };
      
      // ================== MUDANÇA 2 AQUI (Lógica de API) ==================
      if (apiEndpoint === '/abastecimento') { // Se for Abastecimento
        dadosCompletos.fotoNotaFiscalUrl = fotoUrl; // Salva a foto da nota
      }
      else if (apiMethod === 'POST') { // 'iniciar' Jornada
        dadosCompletos.fotoInicioUrl = fotoUrl;
      } 
      else { // 'finalizar' Jornada
        dadosCompletos.fotoFimUrl = fotoUrl;
      }
      // ================== FIM DA MUDANÇA ==================
      
      // 3. Submeter a Jornada ou Abastecimento (POST ou PUT)
      let response;
      if (apiMethod === 'POST') {
        response = await api.post(apiEndpoint, dadosCompletos);
      } else {
        // Substitui o :jornadaId se existir no endpoint
        const endpoint = apiEndpoint.replace(':jornadaId', jornadaId || '');
        response = await api.put(endpoint, dadosCompletos);
      }
      
      onSuccess(response.data); 
      onClose(); 

    } catch (err) {
      console.error("Erro ao submeter com foto:", err);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error); 
      } else {
        setError('Falha ao submeter. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose} 
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()} 
      >
        <h3 className="text-xl font-semibold text-klin-azul text-center">{titulo}</h3>
        
        {/* ================== MUDANÇA 3 AQUI (Renderização Condicional) ================== */}
        {/* Este bloco só aparece se 'kmParaConfirmar' NÃO for nulo */}
        {kmParaConfirmar !== null && (
          <div className="bg-gray-100 p-4 rounded-md text-center">
            <p className="text-sm text-gray-600">Por favor, confirme o KM digitado:</p>
            <p className="text-2xl font-bold text-gray-900">{kmParaConfirmar} KM</p>
          </div>
        )}
        {/* ================== FIM DA MUDANÇA ================== */}

        {/* 2. Upload da Foto */}
        <div>
          {/* ================== MUDANÇA 4 AQUI (Label Dinâmico) ================== */}
          <label className={labelStyle}>
            {/* Título do campo de foto adaptável */}
            {titulo.includes('nota fiscal') ? 'Foto da Nota Fiscal (Obrigatória)' : 'Foto do Odómetro (Obrigatória)'}
          </label>
          {/* ================== FIM DA MUDANÇA ================== */}
          <input 
            type="file" 
            accept="image/*"
            capture="environment" // Força o uso da câmera em mobile
            className={inputStyle + " file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-klin-azul file:text-white hover:file:bg-klin-azul-hover"}
            onChange={(e) => setFoto(e.target.files ? e.target.files[0] : null)}
            disabled={loading}
          />
        </div>

        {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center text-sm">{error}</p>}
        
        <div className="flex gap-4">
          <button 
            type="button" 
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            className={buttonStyle}
            onClick={handleSubmit}
            disabled={loading || !foto} 
          >
            {loading ? 'Enviando...' : 'Confirmar e Enviar Foto'}
          </button>
        </div>
      </div>
    </div>
  );
}