import { useState, useEffect } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { RENDER_API_BASE_URL } from '../../config';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

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

  // Renderização do Loading Inicial (Dados do Servidor)
  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-text-secondary">A carregar dados do fornecedor...</p>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      
      {/* CABEÇALHO */}
      <div className="text-center">
         <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-3">
            {/* Ícone de Edição/Caneta sobreposto ao ícone de Loja */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
         </div>
         <h4 className="text-xl font-bold text-primary">
           Editar Fornecedor
         </h4>
         <p className="text-sm text-text-secondary mt-1">
           Atualize os dados cadastrais do parceiro.
         </p>
      </div>
      
      {/* CAMPOS */}
      <div className="space-y-4">
        <Input
          label="Nome do Fornecedor (Posto/Oficina)"
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do estabelecimento"
          disabled={loading}
        />
        
        <Input
          label="CNPJ (Opcional)"
          type="text"
          value={cnpj}
          onChange={(e) => setCnpj(e.target.value)}
          placeholder="00.000.000/0000-00"
          disabled={loading}
        />
      </div>

      {/* FEEDBACK DE ERRO */}
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-md bg-red-50 border border-red-200 text-error text-sm animate-pulse">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
             <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
           </svg>
           <span>{error}</span>
        </div>
      )}

      {/* BOTÕES */}
      <div className="flex gap-3 pt-2">
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
          {loading ? 'Salvando...' : 'Guardar Alterações'}
        </Button>
      </div>
    </form>
  );
}