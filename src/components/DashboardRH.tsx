import { useState } from 'react';
import { Users, Briefcase, AlertTriangle, ShieldCheck } from 'lucide-react';
import { GestaoUsuarios } from './GestaoUsuarios';
import { GestaoCargos } from './GestaoCargos';
import { PainelAlertas } from './PainelAlertas';
import type { User } from '../types';

interface DashboardRHProps {
  user: User;
}

type AbaRH = 'alertas' | 'usuarios' | 'cargos';

export function DashboardRH({ user }: DashboardRHProps) {
  const [abaAtiva, setAbaAtiva] = useState<AbaRH>('usuarios');

  const abas = [
    {
      id: 'usuarios', 
      label: 'Colaboradores', 
      icon: Users
    },
    {
      id: 'cargos', 
      label: 'Cargos & Treinamentos', 
      icon: Briefcase
    },
    {
      id: 'alertas', 
      label: 'Alertas & Vencimentos', 
      icon: AlertTriangle
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-24">
      
      {/* HEADER PREMIUM & FILTROS (Estilo macOS / Flutuante) */}
      <div className="flex flex-col xl:flex-row items-start xl:items-end justify-between gap-6 border-b border-border/60 pb-6 sticky top-0 bg-background/90 backdrop-blur-xl z-20 pt-2 -mt-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight leading-none flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-xl text-primary shadow-sm">
                <ShieldCheck className="w-7 h-7" />
             </div>
             Gestão de Pessoas
          </h2>
          <p className="text-sm text-text-secondary font-medium mt-2">
             Administração de equipas, cargos operacionais e documentação legal.
          </p>
        </div>

        {/* MENU DE NAVEGAÇÃO (Segmented Control Premium) */}
        <div className="bg-surface-hover/50 p-1.5 rounded-2xl border border-border/60 inline-flex overflow-x-auto custom-scrollbar w-full xl:w-auto shadow-inner">
          <div className="flex space-x-1 min-w-max w-full xl:w-auto">
            {abas.map((aba) => {
              const isActive = abaAtiva === aba.id;
              const Icon = aba.icon;
              
              return (
                <button
                  key={aba.id}
                  onClick={() => setAbaAtiva(aba.id as AbaRH)}
                  className={`
                    relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ease-out flex-1 xl:flex-none
                    ${isActive
                      ? 'text-primary bg-surface shadow-sm ring-1 ring-border/60'
                      : 'text-text-secondary hover:bg-surface hover:text-text-main'}
                  `}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110 text-primary' : 'text-text-muted'}`} />
                  {aba.label}
                  
                  {/* Ponto de notificação elegante na aba de alertas */}
                  {aba.id === 'alertas' && (
                     <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-error rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.6)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO COM TRANSIÇÃO SUAVE */}
      <div className="bg-surface shadow-sm rounded-3xl p-6 sm:p-8 border border-border/60 min-h-[600px] relative overflow-hidden transition-all duration-500">
        
        {/* Usamos a chave (key) no wrapper de animação para forçar o React a re-renderizar a animação de entrada quando a aba muda */}
        <div key={abaAtiva} className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
            {abaAtiva === 'alertas' && <PainelAlertas />}
            {abaAtiva === 'usuarios' && <GestaoUsuarios adminUserId={user.id} />}
            {abaAtiva === 'cargos' && <GestaoCargos />}
        </div>

      </div>
    </div>
  );
}