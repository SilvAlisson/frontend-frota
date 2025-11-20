import { useState, useEffect } from 'react';
import axios from 'axios';
import { RENDER_API_BASE_URL } from '../config';
import { FormCadastrarProduto } from './forms/FormCadastrarProduto';
import { FormEditarProduto } from './forms/FormEditarProduto';
import { exportarParaExcel } from '../utils';
import { Button } from './ui/Button'; // Componente de UI padronizado

// Tipos
interface Produto {
  id: string;
  nome: string;
  tipo: string;
  unidadeMedida: string;
}
interface GestaoProdutosProps {
  token: string;
}

// Estilos da Tabela (Padronizado)
const thStyle = "px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider bg-gray-50 border-b border-gray-100";
const tdStyle = "px-4 py-3 text-sm text-text border-b border-gray-50 align-middle";

// Ícones
function IconeLixo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" />
    </svg>
  );
}

function IconeEditar() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  );
}

export function GestaoProdutos({ token }: GestaoProdutosProps) {
  
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modo, setModo] = useState<'listando' | 'adicionando' | 'editando'>('listando');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [produtoIdSelecionado, setProdutoIdSelecionado] = useState<string | null>(null);

  const api = axios.create({
    baseURL: RENDER_API_BASE_URL,
    headers: { 'Authorization': `Bearer ${token}` }
  });

  // 1. Buscar produtos
  const fetchProdutos = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/produtos');
      setProdutos(response.data);
    } catch (err) {
      setError('Falha ao carregar produtos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []); // Apenas na montagem

  // 2. Apagar produto
  const handleDelete = async (produtoId: string) => {
    if (!window.confirm("Tem a certeza que quer REMOVER este produto? Esta ação pode falhar se ele estiver a ser usado em algum registo.")) {
      return;
    }

    setDeletingId(produtoId);
    setError('');
    setSuccess('');
    try {
      await api.delete(`/produto/${produtoId}`); // Rota DELETE
      setSuccess('Produto removido com sucesso.');
      fetchProdutos(); // Atualiza a lista
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Falha ao remover produto.');
      }
    } finally {
      setDeletingId(null);
    }
  };
  
  // 3. Controladores de estado (Modo)
  const handleAbrirEdicao = (produtoId: string) => {
    setProdutoIdSelecionado(produtoId);
    setModo('editando');
    setError('');
    setSuccess('');
  };

  const handleCancelarForm = () => {
    setModo('listando');
    setProdutoIdSelecionado(null);
    setError('');
    setSuccess('');
  };
  
  const handleProdutoAdicionado = () => {
    setSuccess('Produto adicionado com sucesso!');
    setModo('listando');
    fetchProdutos(); // Re-busca a lista
  };

  const handleProdutoEditado = () => {
    setSuccess('Produto atualizado com sucesso!');
    setModo('listando');
    setProdutoIdSelecionado(null);
    fetchProdutos(); // Re-busca a lista
  };

  // 4. Handler para o botão de exportar
  const handleExportar = () => {
    setError('');
    setSuccess('');
    try {
      // Formatar os dados (removendo o ID)
      const dadosFormatados = produtos.map(p => ({
        'Nome': p.nome,
        'Tipo': p.tipo,
        'Unidade de Medida': p.unidadeMedida,
      }));
      
      exportarParaExcel(dadosFormatados, "Lista_Produtos_Servicos.xlsx");
      setSuccess('Lista de produtos e serviços exportada com sucesso!');

    } catch (err) {
      setError('Ocorreu um erro ao preparar os dados para exportação.');
      console.error(err);
    }
  };


  // Renderização
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-primary text-center">
        Gestão de Produtos e Serviços
      </h3>

      {error && <p className="text-center text-error bg-red-50 p-3 rounded border border-red-200">{error}</p>}
      {success && <p className="text-center text-success bg-green-50 p-3 rounded border border-green-200">{success}</p>}

      {/* Modo de Adição (Formulário) */}
      {modo === 'adicionando' && (
        <div className="bg-surface p-6 rounded-card shadow-card border border-gray-100">
          <FormCadastrarProduto
            token={token} 
            onProdutoAdicionado={handleProdutoAdicionado}
            onCancelar={handleCancelarForm}
          />
        </div>
      )}

      {/* Modo de Edição (Formulário) */}
      {modo === 'editando' && produtoIdSelecionado && (
        <div className="bg-surface p-6 rounded-card shadow-card border border-gray-100">
          <FormEditarProduto
            token={token}
            produtoId={produtoIdSelecionado}
            onProdutoEditado={handleProdutoEditado}
            onCancelar={handleCancelarForm}
          />
        </div>
      )}

      {/* Modo de Listagem (Tabela) */}
      {modo === 'listando' && (
        <div>
          <div className="mb-4 flex justify-between items-center gap-2 flex-wrap">
            <Button
              variant="primary"
              onClick={() => { setModo('adicionando'); setSuccess(''); setError(''); }}
            >
              + Novo Produto/Serviço
            </Button>
            
            <Button
              variant="success"
              className="text-sm"
              onClick={handleExportar}
              disabled={produtos.length === 0}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              }
            >
              Exportar Excel
            </Button>
          </div>

          {loading ? (
            <p className="text-center text-primary py-8">A carregar produtos...</p>
          ) : (
            <div className="overflow-hidden shadow-card rounded-card border border-gray-100 bg-white">
              {produtos.length === 0 ? (
                 <div className="text-center py-10">
                    <p className="text-text-secondary">Nenhum produto cadastrado.</p>
                 </div>
              ) : (
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className={thStyle}>Nome</th>
                        <th className={thStyle}>Tipo</th>
                        <th className={thStyle}>Unidade de Medida</th>
                        <th className={thStyle}>Ações</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {produtos.map((produto) => (
                        <tr key={produto.id} className="hover:bg-gray-50 transition-colors">
                        <td className={tdStyle + " font-medium"}>{produto.nome}</td>
                        <td className={tdStyle}>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            produto.tipo === 'COMBUSTIVEL' ? 'bg-orange-100 text-orange-800' :
                            produto.tipo === 'ADITIVO' ? 'bg-blue-100 text-blue-800' :
                            produto.tipo === 'SERVICO' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-gray-100 text-gray-800'
                            }`}>
                            {produto.tipo}
                            </span>
                        </td>
                        <td className={tdStyle}>{produto.unidadeMedida}</td>
                        <td className={tdStyle}>
                            <div className="flex gap-2">
                            <Button 
                                variant="secondary"
                                className="!p-2 h-8 w-8"
                                onClick={() => handleAbrirEdicao(produto.id)}
                                title="Editar"
                                icon={<IconeEditar />}
                            />
                            <Button
                                variant="danger"
                                className="!p-2 h-8 w-8"
                                onClick={() => handleDelete(produto.id)}
                                disabled={deletingId === produto.id}
                                isLoading={deletingId === produto.id}
                                title="Remover"
                                icon={<IconeLixo />}
                            />
                            </div>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}