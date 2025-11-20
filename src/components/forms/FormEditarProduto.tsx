import { useState, useEffect } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { RENDER_API_BASE_URL } from '../../config';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// Tipos de Produto (do schema.prisma)
const tiposDeProduto = ["COMBUSTIVEL", "ADITIVO", "SERVICO", "OUTRO"];

// Tipos
interface FormEditarProdutoProps {
  token: string;
  produtoId: string;
  onProdutoEditado: () => void;
  onCancelar: () => void;
}

export function FormEditarProduto({ token, produtoId, onProdutoEditado, onCancelar }: FormEditarProdutoProps) {
  // Estados do formulário
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('COMBUSTIVEL');
  const [unidadeMedida, setUnidadeMedida] = useState('Litro');

  // Estados de controlo
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  // API com token
  const api = axios.create({
    baseURL: RENDER_API_BASE_URL,
    headers: { 'Authorization': `Bearer ${token}` }
  });

  // Efeito para buscar os dados do produto ao carregar
  useEffect(() => {
    if (!produtoId) return;
    
    const fetchProduto = async () => {
      setLoadingData(true);
      setError('');
      try {
        // 1. Usar a nova rota GET /api/produto/:id
        const response = await api.get(`/produto/${produtoId}`);
        const produto = response.data;
        
        // 2. Popular os estados do formulário
        setNome(produto.nome || '');
        setTipo(produto.tipo || 'OUTRO');
        setUnidadeMedida(produto.unidadeMedida || 'Litro');
        
      } catch (err) {
        console.error("Erro ao buscar dados do produto:", err);
        setError('Falha ao carregar os dados do produto para edição.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchProduto();
  }, [produtoId, token]);

  // Função de submissão (PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!nome || !tipo) {
      setError('Nome e Tipo são obrigatórios.');
      setLoading(false);
      return;
    }

    try {
      // 3. Chamar a rota PUT
      await api.put(`/produto/${produtoId}`, {
        nome: DOMPurify.sanitize(nome),
        tipo: tipo,
        unidadeMedida: DOMPurify.sanitize(unidadeMedida) || 'Litro',
      });
      
      onProdutoEditado(); // Chama o callback de sucesso

    } catch (err) {
      console.error("Erro ao atualizar produto:", err);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error); 
      } else {
        setError('Falha ao atualizar produto.');
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
        <p className="text-sm text-text-secondary">A carregar dados do produto...</p>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      
      {/* CABEÇALHO COM ÍCONE */}
      <div className="text-center">
         <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-50 mb-3">
            {/* Ícone de Edição sobreposto a Caixa/Produto */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-orange-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
         </div>
         <h4 className="text-xl font-bold text-primary">
           Editar Item de Estoque
         </h4>
         <p className="text-sm text-text-secondary mt-1">
           Atualize informações de combustíveis ou serviços.
         </p>
      </div>
      
      {/* CAMPOS */}
      <div className="space-y-4">
        <Input
          label="Nome do Produto / Serviço"
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: DIESEL S10"
          disabled={loading}
        />
        
        <div>
          <label className="block mb-1.5 text-sm font-medium text-text-secondary">Tipo</label>
          <div className="relative">
            <select 
              className="w-full px-4 py-2 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none"
              value={tipo} 
              onChange={(e) => setTipo(e.target.value)}
              disabled={loading}
            >
              {tiposDeProduto.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
             {/* Seta customizada */}
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
             </div>
          </div>
        </div>

        <Input
          label="Unidade de Medida"
          type="text"
          value={unidadeMedida}
          onChange={(e) => setUnidadeMedida(e.target.value)}
          placeholder="Ex: Litro"
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
          {loading ? 'A guardar...' : 'Guardar Alterações'}
        </Button>
      </div>
    </form>
  );
}