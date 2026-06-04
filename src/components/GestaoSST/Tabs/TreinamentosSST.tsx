import { useState } from 'react';
import { HeartPulse, GraduationCap } from 'lucide-react';
import type { User } from '../../../types';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { ModalTreinamentosUsuario } from '../../ModalTreinamentosUsuario';

interface TreinamentosSSTProps {
  usuarios: User[];
  isLoadingUsuarios: boolean;
}

export function TreinamentosSST({ usuarios, isLoadingUsuarios }: TreinamentosSSTProps) {
  const [usuarioSelecionadoTreino, setUsuarioSelecionadoTreino] = useState<User | null>(null);

  return (
    <>
      <div id="sst-tab-treinamentos" role="tabpanel" aria-label="Treinamentos e Saúde" className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
          <div>
            <h2 className="text-xl font-black text-text-main flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-primary" />
              Controle de Saúde Corporativa e Exames
            </h2>
            <p className="text-sm font-medium text-text-secondary mt-1">Gerencie certificados, NRs e atestados (ASO) individualmente por colaborador.</p>
          </div>
        </div>

        {isLoadingUsuarios ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-surface-hover/50 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {usuarios.map(u => (
              <div key={u.id} className="bg-surface border border-border/60 rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all gap-3 overflow-hidden">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 shrink-0 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black shadow-inner border border-primary/20">
                    {u.nome.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-text-main text-sm truncate" title={u.nome}>{u.nome}</p>
                    <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold bg-surface-hover px-1.5 py-0.5 border border-border/40 rounded mt-1 w-fit truncate max-w-full">
                      {u.role === 'OPERADOR' ? 'Condutor' : u.role}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  aria-label="Abrir Treinamentos"
                  onClick={() => setUsuarioSelecionadoTreino(u)}
                  className="shrink-0 rounded-full hover:bg-primary/10 hover:text-primary"
                >
                  <GraduationCap className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {usuarios.length === 0 && (
              <div className="col-span-full">
                <EmptyState icon={GraduationCap} title="Nenhum Colaborador" description="Não há colaboradores disponíveis para gerenciar." />
              </div>
            )}
          </div>
        )}
      </div>

      {usuarioSelecionadoTreino && (
        <ModalTreinamentosUsuario 
          usuario={usuarioSelecionadoTreino} 
          onClose={() => setUsuarioSelecionadoTreino(null)} 
        />
      )}
    </>
  );
}
