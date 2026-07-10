import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { exportarParaExcel } from '../utils';
import axios from 'axios';
import { logger } from '../lib/logger';

export interface Produto {
  id: string;
  nome: string;
  tipo: string;
  unidadeMedida: string;
}

export interface AddProdutoData {
  nome: string;
  tipo: string;
  unidadeMedida: string;
}

export function useProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/produtos');
      setProdutos(response.data);
    } catch (err: unknown) {
      logger.debug('Erro ao carregar produtos:', err);
      // toast.error('Falha ao carregar catálogo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  const deleteProduto = async (id: string): Promise<void> => {
    try {
      await api.delete(`/produtos/${id}`);
      setProdutos(prev => prev.filter(p => p.id !== id));
      toast.success('Produto removido com sucesso.');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        // toast.error(err.response?.data?.error || 'Erro: O item pode estar em uso numa fatura de manutenção.');
      } else {
        // toast.error('Erro desconhecido ao excluir produto.');
      }
      throw err; // Re-throw to handle loading states in UI if needed
    }
  };

  const exportProdutosExcel = () => {
    if (produtos.length === 0) return;

    const promessaExport = new Promise((resolve, reject) => {
      try {
        const dadosFormatados = produtos.map(p => ({
          'Nome': p.nome,
          'Tipo': p.tipo,
          'Unidade de Medida': p.unidadeMedida,
        }));
        exportarParaExcel(dadosFormatados, "Lista_Produtos_Servicos.xlsx");
        resolve(true);
      } catch (err: unknown) {
        reject(err);
      }
    });

    toast.promise(promessaExport, {
      loading: 'Gerando folha de cálculo...',
      success: 'Transferência concluída com sucesso!',
      error: 'Erro ao exportar Arquivo.'
    });
  };

  const addProduto = async (data: AddProdutoData): Promise<Produto> => {
    try {
      const response = await api.post<Produto>('/produtos', data);
      toast.success(`Catálogo atualizado com sucesso!`);
      fetchProdutos();
      return response.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        // toast.error('Este item já existe no catálogo.');
      } else {
        // toast.error('Ocorreu um erro ao registar o item.');
      }
      throw err;
    }
  };

  return {
    produtos,
    loading,
    fetchProdutos,
    deleteProduto,
    exportProdutosExcel,
    addProduto
  };
}
