import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { FormCadastrarCargo } from './forms/FormCadastrarCargo';
import { toast } from 'sonner';
import { Trash2, Plus, Briefcase, GraduationCap } from 'lucide-react';
import type { Cargo } from '../types';

export function GestaoCargos() {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [modo, setModo] = useState<'listando' | 'adicionando'>('listando');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCargos = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Cargo[]>('/cargos');
      setCargos(data);
    } catch (err) {
      console.error("Erro ao carregar cargos:", err);
      toast.error("Não foi possível carregar a lista de cargos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCargos();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("ATENÇÃO: Remover este cargo pode afetar o histórico de treinamentos. Continuar?")) return;

    setDeletingId(id);

    const promise = api.delete(`/cargos/${id}`);

    toast.promise(promise, {
      loading: 'Removendo cargo...',
      success: () => {
        setCargos(prev => prev.filter(c => c.id !== id));
        setDeletingId(null);
        return 'Cargo removido com sucesso.';
      },
      error: (err) => {
        setDeletingId(null);
        console.error("Erro ao deletar cargo:", err);
        return 'Erro ao remover. Verifique se há colaboradores vinculados.';
      }
    });
  };

  const handleSucesso = () => {
    setModo('listando');
    fetchCargos();
  };

  return (
    <div className="space-y-8 animate-enter">

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <h3 className="text-xl font-bold text-text-main tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Cargos & Requisitos
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            Gerencie as funções e os treinamentos obrigatórios para cada uma.
          </p>
        </div>

        {modo === 'listando' && (
          <Button
            onClick={() => setModo('adicionando')}
            className="shadow-button hover:shadow-float"
            icon={<Plus className="w-4 h-4" />}
          >
            Novo Cargo
          </Button>
        )}
      </div>

      {/* FORMULÁRIO DE CADASTRO */}
      {modo === 'adicionando' && (
        <div className="bg-surface p-8 rounded-2xl shadow-card border border-border max-w-2xl mx-auto transform transition-all animate-in zoom-in-95 duration-300">
          <FormCadastrarCargo onSuccess={handleSucesso} onCancelar={() => setModo('listando')} />
        </div>
      )}

      {/* LISTAGEM DE CARGOS */}
      {modo === 'listando' && (
        <>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-60">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-border border-t-primary mb-4"></div>
              <p className="text-primary font-medium animate-pulse">Sincronizando cargos...</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cargos.map(cargo => (
                <div key={cargo.id} className="group bg-surface p-5 rounded-2xl shadow-card border border-border hover:shadow-float transition-all duration-300 flex flex-col h-full hover:border-primary/20">

                  {/* Topo do Card */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-text-main text-lg tracking-tight group-hover:text-primary transition-colors">
                        {cargo.nome}
                      </h4>
                      <p className="text-xs text-text-secondary line-clamp-2 min-h-[2.5em]">
                        {cargo.descricao || 'Sem descrição definida.'}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      className="!p-2 h-8 w-8 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-all"
                      onClick={() => handleDelete(cargo.id)}
                      isLoading={deletingId === cargo.id}
                      title="Excluir Cargo"
                      icon={<Trash2 className="w-4 h-4" />}
                    />
                  </div>

                  {/* Lista de Requisitos */}
                  <div className="flex-1 bg-surface-hover rounded-xl p-3 border border-border mt-2">
                    <p className="text-[10px] font-bold text-text-muted uppercase mb-2 pl-1 tracking-wider flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      Requisitos Obrigatórios
                    </p>

                    {cargo.requisitos && cargo.requisitos.length > 0 ? (
                      <ul className="space-y-2">
                        {cargo.requisitos.map(req => (
                          <li key={req.id} className="flex justify-between items-center text-xs bg-surface px-3 py-2 rounded-lg border border-border shadow-sm">
                            <span className="font-medium text-text-main truncate max-w-[60%]" title={req.nome}>
                              {req.nome}
                            </span>
                            <span className="text-[10px] bg-info/10 text-info px-2 py-0.5 rounded-full font-bold border border-info/20">
                              {req.validadeMeses > 0 ? `${req.validadeMeses} meses` : 'Permanente'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-4 text-text-muted text-xs italic bg-surface/50 rounded-lg border border-dashed border-border">
                        Nenhum requisito cadastrado.
                      </div>
                    )}
                  </div>

                  {/* Rodapé do Card */}
                  <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                    <span className="text-xs text-text-muted font-medium">Colaboradores ativos</span>
                    <div className="flex items-center gap-1.5 bg-success/10 text-success px-2.5 py-1 rounded-full text-xs font-bold border border-success/20">
                      <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></span>
                      {cargo._count?.colaboradores || 0}
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {cargos.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-16 bg-surface rounded-2xl border-2 border-dashed border-border text-center">
                  <div className="p-4 bg-background rounded-full mb-4">
                    <Briefcase className="w-8 h-8 text-text-muted opacity-50" />
                  </div>
                  <h4 className="text-lg font-medium text-text-main">Nenhum cargo encontrado</h4>
                  <p className="text-text-secondary text-sm mt-1 max-w-xs mx-auto">
                    Comece cadastrando as funções e competências necessárias para a sua operação.
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => setModo('adicionando')}
                    className="mt-4 text-primary hover:bg-primary/10"
                  >
                    Criar Primeiro Cargo
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}