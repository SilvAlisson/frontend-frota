import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { FormCadastrarCargo } from './forms/FormCadastrarCargo';
import { toast } from 'sonner';
import { Trash2, Plus, Briefcase, GraduationCap, AlertTriangle, Loader2 } from 'lucide-react';
import type { Cargo } from '../types';

// ✨ Nossos Componentes de Elite
import { ConfirmModal } from './ui/ConfirmModal';
import { EmptyState } from './ui/EmptyState';
import { Callout } from './ui/Callout';

export function GestaoCargos() {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [modo, setModo] = useState<'listando' | 'adicionando'>('listando');
  const [loading, setLoading] = useState(true);
  
  // Estados para a Exclusão Segura
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cargoParaExcluir, setCargoParaExcluir] = useState<Cargo | null>(null);

  const fetchCargos = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Cargo[]>('/cargos');
      setCargos(data);
    } catch (err) {
      console.error("Erro ao carregar cargos:", err);
      toast.error("Não foi possível carregar o diretório de cargos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCargos();
  }, []);

  // --- NOVA LÓGICA DE EXCLUSÃO (ConfirmModal) ---
  const handleExecuteDelete = async () => {
    if (!cargoParaExcluir) return;

    setDeletingId(cargoParaExcluir.id);

    const promise = api.delete(`/cargos/${cargoParaExcluir.id}`);

    toast.promise(promise, {
      loading: 'A remover cargo do sistema...',
      success: () => {
        setCargos(prev => prev.filter(c => c.id !== cargoParaExcluir.id));
        setDeletingId(null);
        setCargoParaExcluir(null); // Fecha o modal
        return 'Cargo removido com sucesso.';
      },
      error: (err) => {
        setDeletingId(null);
        setCargoParaExcluir(null);
        console.error("Erro ao deletar cargo:", err);
        return 'Erro: Não é possível remover cargos com colaboradores ou treinos ativos vinculados.';
      }
    });
  };

  const handleSucesso = () => {
    setModo('listando');
    fetchCargos();
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-10">

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <h3 className="text-2xl font-black text-text-main tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary shadow-sm">
              <Briefcase className="w-6 h-6" />
            </div>
            Cargos & Requisitos
          </h3>
          <p className="text-sm text-text-secondary font-medium mt-2">
            Estruture as funções da equipa e defina os treinamentos obrigatórios (Matriz de Qualificação).
          </p>
        </div>

        {modo === 'listando' && (
          <Button
            onClick={() => setModo('adicionando')}
            className="shadow-button hover:shadow-float-primary h-11 w-full sm:w-auto"
            icon={<Plus className="w-4 h-4" />}
          >
            Novo Cargo
          </Button>
        )}
      </div>

      {/* FORMULÁRIO DE CADASTRO COM TRANSIÇÃO */}
      {modo === 'adicionando' && (
        <div className="bg-surface p-6 sm:p-8 rounded-3xl shadow-sm border border-border/60 max-w-2xl mx-auto transform transition-all animate-in slide-in-from-right-8 duration-300">
           <div className="mb-6 flex items-center gap-2 text-sm font-bold text-text-secondary cursor-pointer hover:text-primary transition-colors w-fit" onClick={() => setModo('listando')}>
            <span className="p-1.5 bg-surface-hover rounded-lg">←</span> Voltar para a listagem
          </div>
          <FormCadastrarCargo onSuccess={handleSucesso} onCancelar={() => setModo('listando')} />
        </div>
      )}

      {/* LISTAGEM DE CARGOS */}
      {modo === 'listando' && (
        <>
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
               {[1, 2, 3].map(i => <div key={i} className="h-48 bg-surface-hover/50 rounded-3xl border border-border/40 animate-pulse"></div>)}
            </div>
          ) : cargos.length === 0 ? (
            
            // ✨ NOSSO EMPTY STATE SUBSTITUINDO O CÓDIGO MANUAL
            <div className="pt-8">
                <EmptyState 
                    icon={Briefcase} 
                    title="Nenhum cargo estruturado" 
                    description="Comece a estruturar a sua equipa definindo as funções e as respetivas exigências de formação."
                    action={
                        <Button variant="secondary" onClick={() => setModo('adicionando')} icon={<Plus className="w-4 h-4"/>}>
                            Estruturar Primeiro Cargo
                        </Button>
                    }
                />
            </div>

          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-max">
              {cargos.map(cargo => (
                <div key={cargo.id} className="group bg-surface p-5 sm:p-6 rounded-3xl shadow-sm border border-border/60 hover:shadow-md hover:border-primary/40 transition-all duration-300 flex flex-col h-full">

                  {/* Topo do Card */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-black text-text-main text-xl tracking-tight group-hover:text-primary transition-colors leading-tight">
                        {cargo.nome}
                      </h4>
                      <p className="text-xs font-medium text-text-secondary line-clamp-2 min-h-[2.5em] mt-1 opacity-90">
                        {cargo.descricao || 'Sem descrição definida.'}
                      </p>
                    </div>

                    <div className="flex gap-1 bg-surface-hover/50 rounded-xl p-1 border border-border/40 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-4">
                        <button
                          className="p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-all shadow-sm"
                          onClick={() => setCargoParaExcluir(cargo)}
                          disabled={deletingId === cargo.id}
                          title="Remover Cargo"
                        >
                          {deletingId === cargo.id ? <Loader2 className="w-4 h-4 animate-spin text-error" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                    </div>
                  </div>

                  {/* Lista de Requisitos (Matriz de Qualificação) */}
                  <div className="flex-1 bg-surface-hover/50 rounded-2xl p-4 border border-border/40 mt-2 shadow-inner">
                    <p className="text-[9px] font-black text-text-muted uppercase mb-3 pl-1 tracking-[0.2em] flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" />
                      Matriz de Qualificação
                    </p>

                    {cargo.requisitos && cargo.requisitos.length > 0 ? (
                      <ul className="space-y-2">
                        {cargo.requisitos.map(req => (
                          <li key={req.id} className="flex justify-between items-center text-xs bg-surface px-3 py-2.5 rounded-xl border border-border/60 shadow-sm transition-all hover:border-primary/20">
                            <span className="font-bold text-text-main truncate max-w-[65%]" title={req.nome}>
                              {req.nome}
                            </span>
                            <span className="text-[9px] bg-info/10 text-info px-2 py-1 rounded-md font-black uppercase tracking-widest border border-info/20 shrink-0">
                              {req.validadeMeses > 0 ? `${req.validadeMeses} M` : 'Vitalício'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-5 text-text-muted/60 text-xs font-bold uppercase tracking-widest bg-surface/30 rounded-xl border border-dashed border-border/50">
                        Isento de Exigências
                      </div>
                    )}
                  </div>

                  {/* Rodapé do Card */}
                  <div className="mt-5 pt-4 border-t border-border/60 flex justify-between items-center">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.1em]">Colaboradores Alocados</span>
                    <div className="flex items-center gap-2 bg-success/10 text-success px-3 py-1 rounded-lg text-xs font-black border border-success/20 shadow-sm">
                      <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse shadow-[0_0_4px_rgba(16,185,129,0.8)]"></span>
                      {cargo._count?.colaboradores || 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ✨ CONFIRM MODAL COM CALLOUT INTEGRADO */}
      <ConfirmModal 
        isOpen={!!cargoParaExcluir}
        onCancel={() => setCargoParaExcluir(null)}
        onConfirm={handleExecuteDelete}
        title="Excluir Cargo do Sistema"
        description={
          <div className="space-y-4">
             <p className="text-text-secondary text-sm">
                 Tem a certeza que deseja remover a função <strong className="text-text-main font-black">"{cargoParaExcluir?.nome}"</strong> da estrutura da empresa?
             </p>
             <Callout variant="warning" title="Impacto Estrutural" icon={AlertTriangle}>
                 Se houverem colaboradores atualmente vinculados a este cargo, a exclusão será bloqueada pela base de dados. Caso contrário, todos os requisitos e matrizes de qualificação desta função serão perdidos.
             </Callout>
          </div>
        }
        variant="danger"
        confirmLabel={deletingId ? "A remover..." : "Sim, Excluir Função"}
      />

    </div>
  );
}