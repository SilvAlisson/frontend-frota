import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FormCadastrarFornecedor } from './forms/FormCadastrarFornecedor';
import { FormEditarFornecedor } from './forms/FormEditarFornecedor';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import type { Fornecedor } from '../types';

function IconeLixo() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" /></svg>;
}

function IconeEditar() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>;
}

export function GestaoFornecedores() {

  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState<'listando' | 'adicionando' | 'editando'>('listando');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [fornecedorIdSelecionado, setFornecedorIdSelecionado] = useState<string | null>(null);

  const fetchFornecedores = async () => {
    setLoading(true);
    try {
      const response = await api.get<Fornecedor[]>('/fornecedor');
      setFornecedores(response.data);
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível carregar a lista de fornecedores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFornecedores();
  }, []);

  const handleDelete = async (fornecedorId: string) => {
    // Usando confirm nativo por enquanto, mas idealmente seria o ConfirmModal
    if (!window.confirm("Tem certeza que deseja remover este fornecedor?")) return;

    setDeletingId(fornecedorId);

    const promise = api.delete(`/fornecedor/${fornecedorId}`);

    toast.promise(promise, {
      loading: 'Removendo fornecedor...',
      success: () => {
        setFornecedores(prev => prev.filter(f => f.id !== fornecedorId));
        setDeletingId(null);
        return 'Fornecedor removido com sucesso.';
      },
      error: (err) => {
        console.error(err);
        setDeletingId(null);
        return err.response?.data?.error || 'Erro ao remover. Verifique se há vínculos.';
      }
    });
  };

  const handleSucesso = () => {
    setModo('listando');
    setFornecedorIdSelecionado(null);
    fetchFornecedores();
  };

  const handleCancelarForm = () => {
    setModo('listando');
    setFornecedorIdSelecionado(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">
            Parceiros & Fornecedores
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            Gerencie oficinas, postos de combustível e prestadores de serviço.
          </p>
        </div>

        {modo === 'listando' && (
          <Button
            variant="primary"
            onClick={() => setModo('adicionando')}
            className="shadow-lg shadow-primary/20"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            }
          >
            Novo Parceiro
          </Button>
        )}
      </div>

      {/* FORMULÁRIOS */}
      {modo === 'adicionando' && (
        <div className="bg-white p-8 rounded-2xl shadow-card border border-gray-100 max-w-xl mx-auto transform transition-all animate-in zoom-in-95 duration-300">
          <FormCadastrarFornecedor
            onSuccess={handleSucesso}
            onCancelar={handleCancelarForm}
          />
        </div>
      )}

      {modo === 'editando' && fornecedorIdSelecionado && (
        <div className="bg-white p-8 rounded-2xl shadow-card border border-gray-100 max-w-xl mx-auto transform transition-all animate-in zoom-in-95 duration-300">
          <FormEditarFornecedor
            fornecedorId={fornecedorIdSelecionado}
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
              <p className="text-primary font-medium animate-pulse">Buscando parceiros...</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {fornecedores.map((f) => (
                <div key={f.id} className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition-all duration-200 flex flex-col relative overflow-hidden">

                  {/* Detalhe decorativo */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gray-50 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:bg-blue-50 transition-colors"></div>

                  <div className="flex justify-between items-start mb-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72m-13.5 8.65h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                      </svg>
                    </div>

                    {/* Ações (Hover) */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => { setFornecedorIdSelecionado(f.id); setModo('editando'); }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Editar"
                      >
                        <IconeEditar />
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
                        disabled={deletingId === f.id}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Excluir"
                      >
                        {deletingId === f.id ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /> : <IconeLixo />}
                      </button>
                    </div>
                  </div>

                  <h4 className="font-bold text-gray-900 text-lg truncate mb-1" title={f.nome}>
                    {f.nome}
                  </h4>

                  <div className="mt-auto pt-2">
                    {f.cnpj ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-gray-50 text-gray-600 text-xs font-mono border border-gray-200">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        {f.cnpj}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic pl-1">CNPJ não informado</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && fornecedores.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200 text-center">
              <div className="p-4 bg-gray-50 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72m-13.5 8.65h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900">Nenhum parceiro cadastrado</h4>
              <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
                Adicione fornecedores para registrar manutenções e abastecimentos.
              </p>
              <Button
                variant="ghost"
                onClick={() => setModo('adicionando')}
                className="mt-4 text-primary hover:bg-primary/5"
              >
                Cadastrar Primeiro
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}