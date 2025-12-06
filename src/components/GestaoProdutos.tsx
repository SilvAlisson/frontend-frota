import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FormCadastrarProduto } from './forms/FormCadastrarProduto';
import { FormEditarProduto } from './forms/FormEditarProduto';
import { exportarParaExcel } from '../utils';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import { TableStyles } from '../styles/table';

interface Produto {
  id: string;
  nome: string;
  tipo: string;
  unidadeMedida: string;
}

function IconeLixo() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" /></svg>;
}

function IconeEditar() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>;
}

// Ícones por tipo
const getIconeTipo = (tipo: string) => {
  switch (tipo) {
    case 'COMBUSTIVEL': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-orange-600"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" /></svg>;
    case 'ADITIVO': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75v6.75m0 0-3-3m3 3 3-3m-8.25 6a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H3.75Z" /></svg>;
    case 'SERVICO': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-indigo-600"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.25 2.25 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.5 2.5 0 0 1-2.88 1.132l-3.128-.686a1 1 0 0 1-.602-.602l-.686-3.128a2.5 2.5 0 0 1 1.132-2.88L6.25 10" /></svg>;
    default: return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-600"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>;
  }
}

const getBgTipo = (tipo: string) => {
  switch (tipo) {
    case 'COMBUSTIVEL': return 'bg-orange-50';
    case 'ADITIVO': return 'bg-blue-50';
    case 'SERVICO': return 'bg-indigo-50';
    default: return 'bg-gray-50';
  }
}

export function GestaoProdutos() {

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState<'listando' | 'adicionando' | 'editando'>('listando');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [produtoIdSelecionado, setProdutoIdSelecionado] = useState<string | null>(null);

  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/produto');
      setProdutos(response.data);
    } catch (err) {
      console.error(err);
      toast.error('Falha ao carregar estoque.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  const handleDelete = async (produtoId: string) => {
    if (!window.confirm("Tem certeza que quer REMOVER este produto?")) return;

    setDeletingId(produtoId);

    const promise = api.delete(`/produto/${produtoId}`);

    toast.promise(promise, {
      loading: 'Removendo item...',
      success: () => {
        setProdutos(prev => prev.filter(p => p.id !== produtoId));
        setDeletingId(null);
        return 'Produto removido.';
      },
      error: (err) => {
        setDeletingId(null);
        return err.response?.data?.error || 'Erro ao remover produto.';
      }
    });
  };

  const handleSucesso = () => {
    setModo('listando');
    setProdutoIdSelecionado(null);
    fetchProdutos();
  };

  const handleCancelarForm = () => {
    setModo('listando');
    setProdutoIdSelecionado(null);
  };

  const handleExportar = () => {
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
      } catch (err) { reject(err); }
    });

    toast.promise(promessaExport, {
      loading: 'Gerando Excel...',
      success: 'Planilha baixada com sucesso!',
      error: 'Erro ao exportar.'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">
            Estoque e Serviços
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            Gerencie os itens utilizados em abastecimentos e manutenções.
          </p>
        </div>

        {modo === 'listando' && (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="success"
              className="flex-1 sm:flex-none shadow-sm bg-green-600 text-white border-transparent"
              onClick={handleExportar}
              disabled={produtos.length === 0}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              }
            >
              Excel
            </Button>
            <Button
              variant="primary"
              onClick={() => setModo('adicionando')}
              className="flex-1 sm:flex-none shadow-lg shadow-primary/20"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              }
            >
              Novo Item
            </Button>
          </div>
        )}
      </div>

      {/* FORMULÁRIOS */}
      {modo === 'adicionando' && (
        <div className="bg-white p-8 rounded-2xl shadow-card border border-gray-100 max-w-xl mx-auto transform transition-all animate-in zoom-in-95 duration-300">
          <FormCadastrarProduto
            onSuccess={handleSucesso}
            onCancelar={handleCancelarForm}
          />
        </div>
      )}

      {modo === 'editando' && produtoIdSelecionado && (
        <div className="bg-white p-8 rounded-2xl shadow-card border border-gray-100 max-w-xl mx-auto transform transition-all animate-in zoom-in-95 duration-300">
          <FormEditarProduto
            produtoId={produtoIdSelecionado}
            onSuccess={handleSucesso}
            onCancelar={handleCancelarForm}
          />
        </div>
      )}

      {/* LISTAGEM (GRID DE CARDS) */}
      {modo === 'listando' && (
        <>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-60">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary mb-4"></div>
              <p className="text-primary font-medium animate-pulse">Carregando estoque...</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {produtos.map((produto) => (
                <div key={produto.id} className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition-all duration-200 flex flex-col relative overflow-hidden">

                  <div className="flex justify-between items-start mb-3">
                    <div className={`h-12 w-12 rounded-xl ${getBgTipo(produto.tipo)} flex items-center justify-center shadow-sm transition-transform group-hover:scale-105`}>
                      {getIconeTipo(produto.tipo)}
                    </div>

                    {/* Ações (Hover) */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => { setProdutoIdSelecionado(produto.id); setModo('editando'); }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Editar"
                      >
                        <IconeEditar />
                      </button>
                      <button
                        onClick={() => handleDelete(produto.id)}
                        disabled={deletingId === produto.id}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Excluir"
                      >
                        {deletingId === produto.id ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /> : <IconeLixo />}
                      </button>
                    </div>
                  </div>

                  <h4 className="font-bold text-gray-900 text-lg truncate mb-1" title={produto.nome}>
                    {produto.nome}
                  </h4>

                  <div className="mt-auto pt-2 flex items-center justify-between text-xs">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold tracking-wide border ${produto.tipo === 'COMBUSTIVEL' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                      produto.tipo === 'ADITIVO' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        produto.tipo === 'SERVICO' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                          'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                      {produto.tipo}
                    </span>

                    <span className="text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded border border-gray-100">
                      {produto.unidadeMedida}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && produtos.length === 0 && (
            <div className={TableStyles.emptyState}>
              <p>Nenhum produto cadastrado.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}