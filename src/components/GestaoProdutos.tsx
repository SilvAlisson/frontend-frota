import { useState, useEffect, useRef } from 'react';
import { useProdutos, type Produto } from '../hooks/useProdutos';
import { useModalStore } from '../hooks/useModalStore';
import { FormCadastrarProduto } from './forms/FormCadastrarProduto';
import { FormEditarProduto } from './forms/FormEditarProduto';
import { Button } from './ui/Button';
import autoAnimate from '@formkit/auto-animate';

// Componentes e Ícones Padronizados
import { EmptyState } from './ui/EmptyState';
import { PageHeader } from './ui/PageHeader';
import { Callout } from './ui/Callout';
import { 
  Trash2, Edit2, Download, Plus, Loader2, 
  Fuel, Settings, Package, Droplets, AlertTriangle 
} from 'lucide-react';
import { PullToRefresh } from './ui/PullToRefresh';
import { SmartFAB } from './ui/SmartFAB';

// Helper para Ícones e Cores por Tipo (Glassmorphism e Dark Mode Ready)
const getTypeConfig = (tipo: string) => {
  switch (tipo) {
    case 'COMBUSTIVEL':
      return {
        icon: <Fuel className="w-5 h-5" />,
        bg: 'bg-orange-500/10',
        text: 'text-orange-600 dark:text-orange-500',
        border: 'border-orange-500/20'
      };
    case 'ADITIVO':
      return {
        icon: <Droplets className="w-5 h-5" />,
        bg: 'bg-info/10',
        text: 'text-info ',
        border: 'border-info/20'
      };
    case 'SERVICO':
      return {
        icon: <Settings className="w-5 h-5" />,
        bg: 'bg-primary/10',
        text: 'text-primary',
        border: 'border-primary/20'
      };
    default: // PEÇA ou OUTROS
      return {
        icon: <Package className="w-5 h-5" />,
        bg: 'bg-surface-hover/80',
        text: 'text-text-secondary',
        border: 'border-border/60'
      };
  }
};

export function GestaoProdutos() {
  const { produtos, loading, fetchProdutos, deleteProduto, exportProdutosExcel } = useProdutos();
  const { openModal, closeModal } = useModalStore();

  const [modo, setModo] = useState<'listando' | 'adicionando' | 'editando'>('listando');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [produtoIdSelecionado, setProdutoIdSelecionado] = useState<string | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (parentRef.current) {
      autoAnimate(parentRef.current);
    }
  }, [parentRef, modo]);

  const confirmExclusao = (produto: Produto) => {
    const modalId = openModal('CONFIRM', {
      title: "Remover Item do Catálogo",
      description: (
        <div className="space-y-4">
          <p className="text-text-secondary text-sm font-medium">
            Tem certeza que deseja excluir <strong className="text-text-main font-black">"{produto.nome}"</strong> da base de dados?
          </p>
          <Callout variant="warning" title="Atenção ao Histórico" icon={AlertTriangle}>
            Se este item já tiver sido utilizado em alguma fatura de abastecimento ou ordem de serviço de oficina, a sua exclusão será bloqueada para preservar o histórico financeiro.
          </Callout>
        </div>
      ) as unknown as string, // ReactNode passado como string — válido em runtime neste contexto
      variant: "danger",
      confirmLabel: "Sim, Excluir Item",
      onConfirm: async () => {
        setDeletingId(produto.id);
        try {
          await deleteProduto(produto.id);
        } finally {
          setDeletingId(null);
          closeModal(modalId);
        }
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

  return (
    <PullToRefresh onRefresh={async () => { await fetchProdutos(); }}>
      <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-10">

        {/* CABEÇALHO */}
        <PageHeader
          title={
            <div className="flex items-center gap-3">
              Catálogo Central
              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20 mt-1">
                {produtos.length} Itens
              </span>
            </div>
          }
          subtitle="Gestão de serviços de oficina, consumíveis e peças para a frota."
          extraAction={
            modo === 'listando' ? (
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <Button
                  variant="secondary"
                  className="flex-1 sm:flex-none h-11"
                  onClick={exportProdutosExcel}
                  disabled={produtos.length === 0}
                  icon={<Download className="w-4 h-4" />}
                >
                  Excel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setModo('adicionando')}
                  className="hidden sm:flex flex-1 sm:flex-none h-11 shadow-button hover:shadow-float-primary"
                  icon={<Plus className="w-4 h-4" />}
                >
                  Novo Item
                </Button>
              </div>
            ) : undefined
          }
        />

        {/* FORMULÁRIOS (COM TRANSIÇÕES) */}
        {modo === 'adicionando' && (
          <div className="bg-surface p-6 sm:p-8 rounded-3xl shadow-sm border border-border/60 max-w-xl mx-auto animate-in slide-in-from-right-8 duration-300">
            <div className="mb-6 flex items-center gap-2 text-sm font-bold text-text-secondary cursor-pointer hover:text-primary transition-colors w-fit" onClick={handleCancelarForm}>
              <span className="p-1.5 bg-surface-hover rounded-lg">←</span> Voltar
            </div>
            <FormCadastrarProduto onSuccess={handleSucesso} onCancelar={handleCancelarForm} />
          </div>
        )}

        {modo === 'editando' && produtoIdSelecionado && (
          <div className="bg-surface p-6 sm:p-8 rounded-3xl shadow-sm border border-border/60 max-w-xl mx-auto animate-in slide-in-from-right-8 duration-300">
            <div className="mb-6 flex items-center gap-2 text-sm font-bold text-text-secondary cursor-pointer hover:text-primary transition-colors w-fit" onClick={handleCancelarForm}>
              <span className="p-1.5 bg-surface-hover rounded-lg">←</span> Voltar
            </div>
            <FormEditarProduto
              produtoId={produtoIdSelecionado}
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
                  <div key={i} className="h-36 bg-surface-hover/50 rounded-3xl border border-border/40 animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div ref={parentRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-max">
                {produtos.map((produto) => {
                  const style = getTypeConfig(produto.tipo);
                  return (
                    <div key={produto.id} className="group bg-surface p-5 sm:p-6 rounded-3xl shadow-sm border border-border/60 hover:shadow-md hover:border-primary/40 transition-all duration-300 flex flex-col relative overflow-hidden h-full">

                      {/* Topo: Ícone e Ações */}
                      <div className="flex justify-between items-start mb-4">
                        <div className={`h-12 w-12 rounded-2xl ${style.bg} ${style.text} flex items-center justify-center shadow-inner border ${style.border} transition-transform group-hover:scale-110`}>
                          {style.icon}
                        </div>

                        {/* Ações (Hover no Desktop, sempre visível no Mobile) */}
                        <div className="flex gap-1 bg-surface-hover/50 rounded-xl p-1 border border-border/40 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setProdutoIdSelecionado(produto.id); setModo('editando'); }}
                            aria-label={`Editar produto ${produto.nome}`}
                            className="h-8 w-8 text-text-muted hover:text-primary hover:bg-surface"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmExclusao(produto)}
                            disabled={deletingId === produto.id}
                            aria-label={`Excluir produto ${produto.nome}`}
                            className="h-8 w-8 text-text-muted hover:text-error hover:bg-error/10"
                          >
                            {deletingId === produto.id
                              ? <Loader2 className="w-4 h-4 animate-spin text-error" />
                              : <Trash2 className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>

                      {/* Informações */}
                      <h4 className="font-black text-text-main text-lg truncate mb-1.5" title={produto.nome}>
                        {produto.nome}
                      </h4>

                      {/* Rodapé do Card */}
                      <div className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between text-xs">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${style.bg} ${style.text} ${style.border}`}>
                          {produto.tipo.replace('_', ' ')}
                        </span>

                        <span className="text-text-secondary font-mono font-bold bg-surface-hover px-2 py-1 rounded-lg border border-border/60">
                          {produto.unidadeMedida}
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {/* EMPTY STATE ELEGANTE */}
            {!loading && produtos.length === 0 && (
              <div className="pt-10">
                <EmptyState 
                  icon={Package} 
                  title="Catálogo Vazio" 
                  description="Cadastre serviços (ex: Mão de Obra) ou itens (ex: Filtro de Óleo) para poder utilizá-los no lançamento de manutenções e abastecimentos."
                  action={
                    <Button variant="secondary" onClick={() => setModo('adicionando')} icon={<Plus className="w-4 h-4"/>}>
                      Cadastrar Primeiro Item
                    </Button>
                  }
                />
              </div>
            )}
          </>
        )}

        {modo === 'listando' && (
          <SmartFAB 
            onClick={() => setModo('adicionando')} 
            label="Novo Item" 
          />
        )}

      </div>
    </PullToRefresh>
  );
}
