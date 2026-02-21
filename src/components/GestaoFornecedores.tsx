import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FormCadastrarFornecedor } from './forms/FormCadastrarFornecedor';
import { FormEditarFornecedor } from './forms/FormEditarFornecedor';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import { Trash2, Edit2, Store, Plus, Loader2 } from 'lucide-react';
import type { Fornecedor } from '../types';

// ✨ Novos Componentes Elite
import { ConfirmModal } from './ui/ConfirmModal';
import { EmptyState } from './ui/EmptyState';

export function GestaoFornecedores() {

  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState<'listando' | 'adicionando' | 'editando'>('listando');
  
  // Estados para exclusão segura
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [fornecedorParaExcluir, setFornecedorParaExcluir] = useState<Fornecedor | null>(null);
  const [fornecedorIdSelecionado, setFornecedorIdSelecionado] = useState<string | null>(null);

  const fetchFornecedores = async () => {
    setLoading(true);
    try {
      const response = await api.get<Fornecedor[]>('/fornecedores');
      setFornecedores(response.data);
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível carregar a lista de parceiros.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFornecedores();
  }, []);

  // --- NOVA LÓGICA DE EXCLUSÃO (ConfirmModal) ---
  const handleExecuteDelete = async () => {
    if (!fornecedorParaExcluir) return;

    setDeletingId(fornecedorParaExcluir.id);
    try {
      await api.delete(`/fornecedores/${fornecedorParaExcluir.id}`);
      setFornecedores(prev => prev.filter(f => f.id !== fornecedorParaExcluir.id));
      toast.success('Parceiro removido com sucesso.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao remover. Pode estar vinculado a históricos.');
    } finally {
      setDeletingId(null);
      setFornecedorParaExcluir(null); // Fecha o modal
    }
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

  // Helper para cor do ícone baseado no tipo (Glassmorphism adaptado)
  const getIconColor = (tipo?: string) => {
    if (tipo === 'POSTO') return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    if (tipo === 'LAVA_JATO') return 'bg-sky-500/10 text-sky-600 border-sky-500/20';
    return 'bg-surface-hover text-text-secondary border-border/60';
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-10">

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight leading-none">Parceiros & Fornecedores</h1>
          <p className="text-text-secondary font-medium mt-1.5 opacity-90">
            Gerencie oficinas, postos de combustível e prestadores de serviço.
          </p>
        </div>

        {modo === 'listando' && (
          <Button
            variant="primary"
            onClick={() => setModo('adicionando')}
            className="shadow-button hover:shadow-float-primary h-11 w-full sm:w-auto"
            icon={<Plus className="w-4 h-4" />}
          >
            Novo Parceiro
          </Button>
        )}
      </div>

      {/* FORMULÁRIOS (COM TRANSIÇÃO) */}
      {modo === 'adicionando' && (
        <div className="bg-surface p-6 sm:p-8 rounded-3xl shadow-sm border border-border/60 max-w-xl mx-auto animate-in slide-in-from-right-8 duration-300">
          <div className="mb-6 flex items-center gap-2 text-sm font-bold text-text-secondary cursor-pointer hover:text-primary transition-colors w-fit" onClick={handleCancelarForm}>
            <span className="p-1.5 bg-surface-hover rounded-lg">←</span> Voltar
          </div>
          <FormCadastrarFornecedor onSuccess={handleSucesso} onCancelar={handleCancelarForm} />
        </div>
      )}

      {modo === 'editando' && fornecedorIdSelecionado && (
        <div className="bg-surface p-6 sm:p-8 rounded-3xl shadow-sm border border-border/60 max-w-xl mx-auto animate-in slide-in-from-right-8 duration-300">
           <div className="mb-6 flex items-center gap-2 text-sm font-bold text-text-secondary cursor-pointer hover:text-primary transition-colors w-fit" onClick={handleCancelarForm}>
            <span className="p-1.5 bg-surface-hover rounded-lg">←</span> Voltar
          </div>
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
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-40 bg-surface-hover/50 rounded-3xl border border-border/40 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-max">
              {fornecedores.map((f) => (
                <div key={f.id} className="group bg-surface p-5 sm:p-6 rounded-3xl shadow-sm border border-border/60 hover:shadow-md hover:border-primary/40 transition-all duration-300 flex flex-col relative h-full">

                  {/* Topo: Ícone e Ações */}
                  <div className="flex justify-between items-start mb-5">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner border ${getIconColor(f.tipo)}`}>
                      <Store className="w-5 h-5" />
                    </div>

                    <div className="flex gap-1 bg-surface-hover/50 rounded-xl p-1 border border-border/40 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setFornecedorIdSelecionado(f.id); setModo('editando'); }}
                        className="p-1.5 text-text-muted hover:text-primary hover:bg-surface rounded-lg transition-all shadow-sm"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setFornecedorParaExcluir(f)}
                        disabled={deletingId === f.id}
                        className="p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-all shadow-sm"
                        title="Excluir"
                      >
                        {deletingId === f.id ? <Loader2 className="w-4 h-4 animate-spin text-error" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Informações */}
                  <div className="mb-4">
                    <h4 className="font-black text-text-main text-lg tracking-tight leading-tight mb-1.5 truncate" title={f.nome}>
                      {f.nome}
                    </h4>
                    {f.tipo && (
                      <span className="inline-block text-[9px] uppercase font-black tracking-widest text-text-secondary bg-surface-hover px-2 py-1 rounded-md border border-border/50">
                        {f.tipo.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Rodapé: CNPJ */}
                  <div className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between">
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">CNPJ</span>
                    {f.cnpj ? (
                      <span className="text-xs font-mono font-bold text-text-main bg-surface-hover/50 px-2 py-0.5 rounded border border-border/40">
                        {f.cnpj}
                      </span>
                    ) : (
                      <span className="text-xs text-text-muted/60 font-medium italic">Não informado</span>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}

          {!loading && fornecedores.length === 0 && (
            // ✨ NOSSO EMPTY STATE SUBSTITUINDO O CÓDIGO MANUAL
            <div className="pt-10">
              <EmptyState 
                icon={Store} 
                title="Sem Parceiros Registados" 
                description="Adicione oficinas, postos de combustível ou fornecedores de peças para começar a associar despesas."
                action={
                  <Button variant="secondary" onClick={() => setModo('adicionando')} icon={<Plus className="w-4 h-4"/>}>
                    Registar o Primeiro
                  </Button>
                }
              />
            </div>
          )}
        </>
      )}

      {/* ✨ O NOSSO CONFIRM MODAL ELEGANTE */}
      <ConfirmModal 
        isOpen={!!fornecedorParaExcluir}
        onCancel={() => setFornecedorParaExcluir(null)}
        onConfirm={handleExecuteDelete}
        title="Remover Parceiro"
        description={`Tem a certeza que deseja excluir "${fornecedorParaExcluir?.nome}"? Documentos e manutenções já associadas podem perder esta referência.`}
        variant="danger"
        confirmLabel={deletingId ? "A remover..." : "Sim, Excluir"}
      />

    </div>
  );
}