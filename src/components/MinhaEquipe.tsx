import { useState } from 'react';
import { Button } from './ui/Button';
import { ModalQrCode } from './ModalQrCode';
import type { User, Jornada } from '../types';

interface MinhaEquipeProps {
  usuarios: User[];
  jornadasAbertas: Jornada[];
  onUpdate?: () => void; // Opcional: para recarregar a lista se gerar token novo
}

function IconeQrCode() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5A.75.75 0 0 1 4.5 3.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5ZM3.75 15A.75.75 0 0 1 4.5 14.25h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5ZM15 3.75A.75.75 0 0 0 14.25 3h-4.5a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 .75.75h4.5a.75.75 0 0 0 .75-.75v-4.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 11.25v3M11.25 17.25h3" />
    </svg>
  );
}

export function MinhaEquipe({ usuarios, jornadasAbertas, onUpdate }: MinhaEquipeProps) {
  //  Armazenamos o usuário inteiro para passar ao Modal atualizado
  const [usuarioParaQr, setUsuarioParaQr] = useState<User | null>(null);

  // Filtra apenas operadores
  const operadores = usuarios.filter(u => u.role === 'OPERADOR');

  const handleAbrirModal = (user: User) => {
    setUsuarioParaQr(user);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Minha Equipe</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie o acesso e status dos motoristas.
          </p>
        </div>
        <span className="bg-background text-foreground/70 text-xs font-bold px-3 py-1 rounded-full border border-border shadow-sm">
          {operadores.length} Motoristas
        </span>
      </div>

      {/* Lista de Cards */}
      <div className="grid gap-4">
        {operadores.map(op => {
          // [CORREÇÃO 1] Uso de Optional Chaining (?.id) caso o operador venha nulo na jornada
          const jornadaAtiva = jornadasAbertas.find(j => j.operador?.id === op.id);

          return (
            <div
              key={op.id}
              className="group bg-card text-card-foreground p-4 rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >

              {/* Info Motorista COM FOTO */}
              <div className="flex items-center gap-4">
                <div className="relative h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary border border-primary/10 shadow-sm group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                  {op.fotoUrl ? (
                    <img src={op.fotoUrl} alt={op.nome} className="w-full h-full object-cover" />
                  ) : (
                    <span>{op.nome.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="font-bold text-foreground truncate">{op.nome}</h4>
                  <p className="text-xs text-muted-foreground truncate max-w-[180px] sm:max-w-[250px]">
                    {op.email}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex-1 flex justify-start sm:justify-center w-full sm:w-auto pl-16 sm:pl-0">
                {jornadaAtiva ? (
                  <div className="flex flex-col items-start sm:items-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Em Rota
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-1.5 font-mono bg-background px-2 py-0.5 rounded border border-border">
                      {/* [CORREÇÃO 2] Fallback seguro se o veículo não vier preenchido */}
                      {jornadaAtiva.veiculo?.placa || 'Veículo N/D'}
                    </span>
                  </div>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-background text-muted-foreground border border-border">
                    Disponível
                  </span>
                )}
              </div>

              {/* Ação */}
              <div className="w-full sm:w-auto flex justify-end">
                <Button
                  variant="secondary"
                  className="text-xs h-9 w-full sm:w-auto shadow-sm border border-border bg-background hover:bg-muted/50 hover:text-primary transition-colors"
                  onClick={() => handleAbrirModal(op)}
                  icon={<IconeQrCode />}
                >
                  Acesso QR
                </Button>
              </div>
            </div>
          );
        })}

        {operadores.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/20">
            <p className="text-muted-foreground font-medium">Nenhum operador encontrado.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Cadastre novos motoristas no menu de usuários.
            </p>
          </div>
        )}
      </div>

      {/* Modal agora recebe o objeto user inteiro */}
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