import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FormCadastrarFornecedor } from './forms/FormCadastrarFornecedor';
import { FormEditarFornecedor } from './forms/FormEditarFornecedor';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import type { Fornecedor } from '../types';

// Ícones Minimalistas
function IconeLixo() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" /></svg>; }
function IconeEditar() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>; }
function IconePredio() { return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>; }

export function GestaoFornecedores() {

  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState<'listando' | 'adicionando' | 'editando'>('listando');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [fornecedorIdSelecionado, setFornecedorIdSelecionado] = useState<string | null>(null);

  const fetchFornecedores = async () => {
    setLoading(true);
    try {
      const response = await api.get<Fornecedor[]>('/fornecedores');
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
    if (!window.confirm("Tem certeza que deseja remover este parceiro?")) return;

    setDeletingId(fornecedorId);
    const promise = api.delete(`/fornecedores/${fornecedorId}`);

    toast.promise(promise, {
      loading: 'Removendo...',
      success: () => {
        setFornecedores(prev => prev.filter(f => f.id !== fornecedorId));
        setDeletingId(null);
        return 'Parceiro removido.';
      },
      error: (err) => {
        setDeletingId(null);
        return err.response?.data?.error || 'Erro ao remover.';
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

  // Helper para cor do ícone baseado no tipo (se existir no objeto)
  const getIconColor = (tipo?: string) => {
    if (tipo === 'POSTO') return 'bg-amber-50 text-amber-600 border-amber-100';
    if (tipo === 'LAVA_JATO') return 'bg-blue-50 text-blue-600 border-blue-100';
    // [PADRONIZAÇÃO] Default alinhado com o tema
    return 'bg-background text-gray-500 border-border';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* CABEÇALHO */}
      {/* [PADRONIZAÇÃO] border-gray-100 -> border-border */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">
            Parceiros & Fornecedores
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            Gerencie oficinas, postos de combustível e prestadores.
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
        // [PADRONIZAÇÃO] shadow-card, border-border
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-card border border-border max-w-xl mx-auto animate-in zoom-in-95 duration-200">
          <FormCadastrarFornecedor onSuccess={handleSucesso} onCancelar={handleCancelarForm} />
        </div>
      )}

      {modo === 'editando' && fornecedorIdSelecionado && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-card border border-border max-w-xl mx-auto animate-in zoom-in-95 duration-200">
          <FormEditarFornecedor
            fornecedorId={fornecedorIdSelecionado}
            onSuccess={handleSucesso}
            onCancelar={handleCancelarForm}
          />
        </div>
      )}

      {/* LISTAGEM (GRID INDUSTRIAL) */}
      {modo === 'listando' && (
        <>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                // [PADRONIZAÇÃO] border-gray-100 -> border-border, rounded-xl -> rounded-2xl
                <div key={i} className="h-40 bg-white rounded-2xl border border-border animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {fornecedores.map((f) => (
                // [PADRONIZAÇÃO] border-gray-200 -> border-border, rounded-xl -> rounded-2xl
                <div key={f.id} className="group bg-white p-5 rounded-2xl shadow-sm border border-border hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col relative">

                  {/* Topo: Ícone e Ações */}
                  <div className="flex justify-between items-start mb-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-sm border ${getIconColor(f.tipo)}`}>
                      <IconePredio />
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => { setFornecedorIdSelecionado(f.id); setModo('editando'); }}
                        // [PADRONIZAÇÃO] hover:text-primary
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <IconeEditar />
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
                        disabled={deletingId === f.id}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        {deletingId === f.id ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /> : <IconeLixo />}
                      </button>
                    </div>
                  </div>

                  {/* Informações */}
                  <div className="mb-2">
                    <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1 truncate" title={f.nome}>
                      {f.nome}
                    </h4>
                    {f.tipo && (
                      // [PADRONIZAÇÃO] bg-gray-100 -> bg-background, border-gray-200 -> border-border
                      <span className="inline-block text-[10px] uppercase font-bold tracking-wider text-gray-500 bg-background px-1.5 py-0.5 rounded border border-border">
                        {f.tipo.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Rodapé: CNPJ */}
                  {/* [PADRONIZAÇÃO] border-gray-50 -> border-background */}
                  <div className="mt-auto pt-3 border-t border-background flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">CNPJ</span>
                    {f.cnpj ? (
                      // [PADRONIZAÇÃO] bg-gray-50 -> bg-background, border-gray-100 -> border-border
                      <span className="text-xs font-mono text-gray-600 bg-background px-1.5 py-0.5 rounded border border-border">
                        {f.cnpj}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300 italic">Não informado</span>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}

          {!loading && fornecedores.length === 0 && (
            // [PADRONIZAÇÃO] border-gray-200 -> border-border
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-border text-center">
              {/* [PADRONIZAÇÃO] bg-gray-50 -> bg-background */}
              <div className="p-4 bg-background rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72m-13.5 8.65h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900">Nenhum parceiro cadastrado</h4>
              <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
                Adicione oficinas e postos para começar.
              </p>
              <Button
                variant="ghost"
                onClick={() => setModo('adicionando')}
                className="mt-4 text-primary bg-primary/5 hover:bg-primary/10"
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