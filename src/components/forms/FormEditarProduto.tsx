import { useState, useEffect } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { RENDER_API_BASE_URL } from '../../config';

// Estilos
const inputStyle = "shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-klin-azul focus:border-transparent disabled:bg-gray-200";
const buttonStyle = "bg-klin-azul hover:bg-klin-azul-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
const labelStyle = "block text-gray-700 text-sm font-bold mb-2";
const secondaryButton = "bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full";

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

  // Renderização
  if (loadingData) {
    return <p className="text-center text-klin-azul">A carregar dados do produto...</p>
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h4 className="text-lg font-semibold text-klin-azul text-center">
        Editar Produto
      </h4>
      
      <div>
        <label className={labelStyle}>Nome do Produto</label>
        <input type="text" className={inputStyle} value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      
      <div>
        <label className={labelStyle}>Tipo de Produto</label>
        <select className={inputStyle} value={tipo} onChange={(e) => setTipo(e.target.value)}>
          {tiposDeProduto.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelStyle}>Unidade de Medida</label>
        <input type="text" className={inputStyle} value={unidadeMedida} onChange={(e) => setUnidadeMedida(e.target.value)} />
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