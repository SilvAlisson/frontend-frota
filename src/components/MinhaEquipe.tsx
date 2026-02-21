import { useState } from 'react';
import { Button } from './ui/Button';
import { ModalQrCode } from './ModalQrCode';
import { EmptyState } from './ui/EmptyState';
import { QrCode, Users } from 'lucide-react';
import type { User, Jornada } from '../types';

interface MinhaEquipeProps {
  usuarios: User[];
  jornadasAbertas: Jornada[];
  onUpdate?: () => void; 
}

export function MinhaEquipe({ usuarios, jornadasAbertas, onUpdate }: MinhaEquipeProps) {
  const [usuarioParaQr, setUsuarioParaQr] = useState<User | null>(null);

  // Filtra apenas operadores
  const operadores = usuarios.filter(u => u.role === 'OPERADOR');

  const handleAbrirModal = (user: User) => {
    setUsuarioParaQr(user);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div>
          <h3 className="text-xl font-black text-text-main tracking-tight">Equipa Operacional</h3>
          <p className="text-sm font-medium text-text-secondary mt-1">
            Supervisão e gestão de acesso dos motoristas.
          </p>
        </div>
        <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-primary/20 shadow-sm">
          {operadores.length} Motoristas
        </span>
      </div>

      {/* Lista de Cards */}
      <div className="grid gap-4">
        {operadores.map(op => {
          const jornadaAtiva = jornadasAbertas.find(j => j.operador?.id === op.id);

          return (
            <div
              key={op.id}
              className="group bg-surface p-4 sm:p-5 rounded-2xl border border-border/60 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >

              {/* Info Motorista COM FOTO */}
              <div className="flex items-center gap-4">
                <div className="relative h-12 w-12 rounded-2xl bg-surface-hover/80 flex items-center justify-center text-lg font-black text-text-muted border border-border/60 shadow-inner group-hover:border-primary/30 group-hover:text-primary transition-all overflow-hidden shrink-0">
                  {op.fotoUrl ? (
                    <img src={op.fotoUrl} alt={op.nome} className="w-full h-full object-cover" />
                  ) : (
                    <span>{op.nome.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="font-black text-text-main truncate text-base tracking-tight leading-none">{op.nome}</h4>
                  <p className="text-[11px] font-bold text-text-secondary truncate mt-1">
                    {op.email}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex-1 flex justify-start sm:justify-center w-full sm:w-auto pl-16 sm:pl-0">
                {jornadaAtiva ? (
                  <div className="flex flex-col items-start sm:items-center">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-success/10 text-success border border-success/20 shadow-sm">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success"></span>
                      </span>
                      Em Rota
                    </span>
                    <span className="text-[10px] text-text-muted mt-1.5 font-mono font-bold bg-surface-hover px-2 py-0.5 rounded-md border border-border/60">
                      {jornadaAtiva.veiculo?.placa || 'Veículo N/D'}
                    </span>
                  </div>
                ) : (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-surface-hover text-text-muted border border-border/60">
                    Disponível
                  </span>
                )}
              </div>

              {/* Ação */}
              <div className="w-full sm:w-auto flex justify-end pt-3 sm:pt-0 border-t border-dashed border-border/60 sm:border-none">
                <Button
                  variant="secondary"
                  className="text-xs h-9 w-full sm:w-auto shadow-sm bg-surface hover:bg-primary/10 hover:border-primary/20 hover:text-primary transition-all rounded-xl"
                  onClick={() => handleAbrirModal(op)}
                  icon={<QrCode className="w-4 h-4" />}
                >
                  Acesso QR
                </Button>
              </div>
            </div>
          );
        })}

        {/* ✨ O NOSSO NOVO EMPTY STATE */}
        {operadores.length === 0 && (
          <div className="pt-6">
            <EmptyState 
              icon={Users} 
              title="Equipa Vazia" 
              description="Nenhum motorista (operador) foi encontrado na base de dados para a sua unidade." 
            />
          </div>
        )}
      </div>

      {usuarioParaQr && (
        <ModalQrCode
          user={usuarioParaQr}
          onClose={() => setUsuarioParaQr(null)}
          onUpdate={() => {
            if (onUpdate) onUpdate();
          }}
        />
      )}
    </div>
  );
}