import { useState } from 'react';
import axios from 'axios';
import { RENDER_API_BASE_URL } from '../config';
import { supabase } from '../supabaseClient';
import { Button } from './ui/Button'; // Componente Visual

interface ModalProps {
  token: string;
  titulo: string; 
  kmParaConfirmar: number | null;
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
      setError('A foto é obrigatória para prosseguir.');
      setLoading(false);
      return;
    }

    const api = axios.create({
      baseURL: RENDER_API_BASE_URL,
      headers: { 'Authorization': `Bearer ${token}` }
    });

    try {
      // ==========================================================
      // PASSO 1: UPLOAD SUPABASE
      // ==========================================================
      const fileType = apiEndpoint.split('/')[1] || 'geral'; 
      const fileExt = foto.name.split('.').pop();
      const filePath = `public/${fileType}-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('fotos-frota') 
        .upload(filePath, foto);

      if (uploadError) throw new Error(`Erro no Supabase: ${uploadError.message}`);
      if (!uploadData) throw new Error('Erro no upload da imagem.');

      // ==========================================================
      // PASSO 2: URL PÚBLICA
      // ==========================================================
      const { data: publicUrlData } = supabase
        .storage
        .from('fotos-frota')
        .getPublicUrl(uploadData.path);

      const fotoUrl = publicUrlData.publicUrl;
      if (!fotoUrl) throw new Error('Erro ao gerar link da imagem.');

      // ==========================================================
      // PASSO 3: PREPARAR DADOS
      // ==========================================================
      let dadosCompletos = { ...dadosJornada };
      
      if (apiEndpoint === '/abastecimento') {
        dadosCompletos.fotoNotaFiscalUrl = fotoUrl; 
      }
      else if (apiEndpoint === '/ordem-servico') {
        dadosCompletos.fotoComprovanteUrl = fotoUrl;
      }
      else if (apiMethod === 'POST') { 
        dadosCompletos.fotoInicioUrl = fotoUrl;
      } 
      else { 
        dadosCompletos.fotoFimUrl = fotoUrl;
      }

      // ==========================================================
      // PASSO 4: ENVIAR AO BACKEND
      // ==========================================================
      let response;
      if (apiMethod === 'POST') {
        response = await api.post(apiEndpoint, dadosCompletos);
      } else {
        const endpoint = apiEndpoint.replace(':jornadaId', jornadaId || '');
        response = await api.put(endpoint, dadosCompletos);
      }
      
      onSuccess(response.data); 
      onClose(); 

    } catch (err) {
      console.error("Erro ao submeter:", err);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error); 
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Falha ao processar o envio. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose} 
    >
      <div 
        className="bg-white rounded-card shadow-2xl w-full max-w-md overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Cabeçalho */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 text-center">
            <h3 className="text-lg font-bold text-primary">{titulo}</h3>
        </div>

        <div className="p-6 space-y-6">
            
            {/* Confirmação de KM (Condicional) */}
            {kmParaConfirmar !== null && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-center shadow-sm">
                <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">
                    Confirmação de Odómetro
                </p>
                <p className="text-3xl font-bold text-primary">
                    {kmParaConfirmar} <span className="text-lg text-gray-500">KM</span>
                </p>
            </div>
            )}

            {/* Input de Arquivo Estilizado */}
            <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                    {titulo.toLowerCase().includes('fiscal') || titulo.toLowerCase().includes('comprovativo') 
                    ? 'Foto do Comprovativo / Nota' 
                    : 'Foto do Painel (Odómetro)'
                    } <span className="text-error">*</span>
                </label>
                
                <div className="relative">
                    <input 
                        type="file" 
                        accept="image/*"
                        capture="environment"
                        className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2.5 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-primary/10 file:text-primary
                            hover:file:bg-primary/20
                            cursor-pointer file:cursor-pointer
                            bg-gray-50 rounded-lg border border-gray-200
                        "
                        onChange={(e) => setFoto(e.target.files ? e.target.files[0] : null)}
                        disabled={loading}
                    />
                </div>
                {foto && (
                    <p className="mt-2 text-xs text-success font-medium flex items-center gap-1 justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                        Imagem selecionada
                    </p>
                )}
            </div>

            {/* Erro */}
            {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 text-error text-sm text-center animate-pulse">
                    {error}
                </div>
            )}
            
            {/* Botões de Ação */}
            <div className="flex gap-3 pt-2">
                <Button 
                    type="button" 
                    variant="secondary"
                    className="flex-1"
                    onClick={onClose}
                    disabled={loading}
                >
                    Cancelar
                </Button>
                <Button 
                    type="button" 
                    variant="primary"
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={loading || !foto} 
                    isLoading={loading}
                >
                    {loading ? 'Enviando...' : 'Confirmar Envio'}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}