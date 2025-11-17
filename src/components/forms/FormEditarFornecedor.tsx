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
interface FormEditarFornecedorProps {
  token: string;
  fornecedorId: string;
  onFornecedorEditado: () => void;
  onCancelar: () => void;
}

export function FormEditarFornecedor({ token, fornecedorId, onFornecedorEditado, onCancelar }: FormEditarFornecedorProps) {
  // Estados do formulário
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');

  // Estados de controlo
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  // API com token
  const api = axios.create({
    baseURL: RENDER_API_BASE_URL,
    headers: { 'Authorization': `Bearer ${token}` }
  });

  // Efeito para buscar os dados
  useEffect(() => {
    if (!fornecedorId) return;
    
    const fetchFornecedor = async () => {
      setLoadingData(true);
      setError('');
      try {
        const response = await api.get(`/fornecedor/${fornecedorId}`);
        const fornecedor = response.data;
        
        setNome(fornecedor.nome || '');
        setCnpj(fornecedor.cnpj || '');
        
      } catch (err) {
        console.error("Erro ao buscar dados do fornecedor:", err);
        setError('Falha ao carregar os dados do fornecedor para edição.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchFornecedor();
  }, [fornecedorId, token]);

  // Função de submissão (PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!nome) {
      setError('Nome é obrigatório.');
      setLoading(false);
      return;
    }

    try {
      await api.put(`/fornecedor/${fornecedorId}`, {
        nome: DOMPurify.sanitize(nome),
        cnpj: DOMPurify.sanitize(cnpj) || null,
      });
      
      onFornecedorEditado(); // Sucesso

    } catch (err) {
      console.error("Erro ao atualizar fornecedor:", err);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error); 
      } else {
        setError('Falha ao atualizar fornecedor.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Renderização
  if (loadingData) {
    return <p className="text-center text-klin-azul">A carregar dados do fornecedor...</p>
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h4 className="text-lg font-semibold text-klin-azul text-center">
        Editar Fornecedor
      </h4>
      
      <div>
        <label className={labelStyle}>Nome do Fornecedor (Posto/Oficina)</label>
        <input type="text" className={inputStyle} value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      
      <div>
        <label className={labelStyle}>CNPJ (Opcional)</label>
        <input type="text" className={inputStyle} value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
      </div>

      {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center text-sm">{error}</p>}

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