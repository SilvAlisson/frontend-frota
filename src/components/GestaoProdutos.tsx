import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FormCadastrarProduto } from './forms/FormCadastrarProduto';
import { FormEditarProduto } from './forms/FormEditarProduto';
import { exportarParaExcel } from '../utils';
import { Button } from './ui/Button';
import { toast } from 'sonner';

// ✨ Novos Componentes Elite e Ícones Padronizados
import { ConfirmModal } from './ui/ConfirmModal';
import { EmptyState } from './ui/EmptyState';
import { Callout } from './ui/Callout';
import { 
  Trash2, Edit2, Download, Plus, Loader2, 
  Fuel, Settings, Package, Droplets, AlertTriangle 
} from 'lucide-react';

interface Produto {
  id: string;
  nome: string;
  tipo: string;
  unidadeMedida: string;
}

// Helper para Ícones e Cores por Tipo (Glassmorphism e Lucide)
const getTypeConfig = (tipo: string) => {
  switch (tipo) {
    case 'COMBUSTIVEL':
      return {
        icon: <Fuel className="w-5 h-5" />,
        bg: 'bg-amber-500/10',
        text: 'text-amber-600',
        border: 'border-amber-500/20'
      };
    case 'ADITIVO':
      return {
        icon: <Droplets className="w-5 h-5" />,
        bg: 'bg-sky-500/10',
        text: 'text-sky-600',
        border: 'border-sky-500/20'
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

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState<'listando' | 'adicionando' | 'editando'>('listando');
  
  // ✨ Estados para a Exclusão Segura
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<Produto | null>(null);
  const [produtoIdSelecionado, setProdutoIdSelecionado] = useState<string | null>(null);

  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/produtos');
      setProdutos(response.data);
    } catch (err) {
      console.error(err);
      toast.error('Falha ao carregar catálogo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  // --- NOVA LÓGICA DE EXCLUSÃO (ConfirmModal) ---
  const handleExecuteDelete = async () => {
    if (!produtoParaExcluir) return;

    setDeletingId(produtoParaExcluir.id);
    try {
      await api.delete(`/produtos/${produtoParaExcluir.id}`);
      setProdutos(prev => prev.filter(p => p.id !== produtoParaExcluir.id));
      toast.success('Produto removido com sucesso.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro: O item pode estar em uso numa fatura de manutenção.');
    } finally {
      setDeletingId(null);
      setProdutoParaExcluir(null); // Fecha o modal
    }
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
      loading: 'A gerar folha de cálculo...',
      success: 'Transferência concluída com sucesso!',
      error: 'Erro ao exportar ficheiro.'
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-10">

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight leading-none flex items-center gap-3">
             Catálogo Central
             <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
               {produtos.length} Itens
             </span>
          </h1>
          <p className="text-text-secondary font-medium mt-1.5 opacity-90">
             Gestão de serviços de oficina, consumíveis e peças para a frota.
          </p>
        </div>

        {modo === 'listando' && (
          <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <Button
              variant="secondary"
              className="flex-1 sm:flex-none h-11"
              onClick={handleExportar}
              disabled={produtos.length === 0}
              icon={<Download className="w-4 h-4" />}
            >
              Excel
            </Button>
            <Button
              variant="primary"
              onClick={() => setModo('adicionando')}
              className="flex-1 sm:flex-none h-11 shadow-button hover:shadow-float-primary"
              icon={<Plus className="w-4 h-4" />}
            >
              Novo Item
            </Button>
          </div>
        )}
      </div>

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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-max">
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
                        <button
                          onClick={() => { setProdutoIdSelecionado(produto.id); setModo('editando'); }}
                          className="p-1.5 text-text-muted hover:text-primary hover:bg-surface rounded-lg transition-all shadow-sm"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setProdutoParaExcluir(produto)}
                          disabled={deletingId === produto.id}
                          className="p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-all shadow-sm"
                          title="Excluir"
                        >
                          {deletingId === produto.id ? <Loader2 className="w-4 h-4 animate-spin text-error" /> : <Trash2 className="w-4 h-4" />}
                        </button>
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

          {/* ✨ EMPTY STATE ELEGANTE */}
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

      {/* ✨ CONFIRM MODAL COM CALLOUT INTEGRADO */}
      <ConfirmModal 
        isOpen={!!produtoParaExcluir}
        onCancel={() => setProdutoParaExcluir(null)}
        onConfirm={handleExecuteDelete}
        title="Remover Item do Catálogo"
        description={
          <div className="space-y-4">
             <p className="text-text-secondary text-sm font-medium">
                 Tem a certeza que deseja excluir <strong className="text-text-main font-black">"{produtoParaExcluir?.nome}"</strong> da base de dados?
             </p>
             <Callout variant="warning" title="Atenção ao Histórico" icon={AlertTriangle}>
                 Se este item já tiver sido utilizado em alguma fatura de abastecimento ou ordem de serviço de oficina, a sua exclusão será bloqueada para preservar o histórico financeiro.
             </Callout>
          </div>
        }
        variant="danger"
        confirmLabel={deletingId ? "A Remover..." : "Sim, Excluir Item"}
      />

    </div>
  );
}