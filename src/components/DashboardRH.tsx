import { useState } from 'react';
import { Users, Briefcase, AlertTriangle } from 'lucide-react';
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
    <div className="space-y-6 animate-enter">
      
      {/* MENU DE NAVEGAÇÃO (DESIGN SYSTEM) */}
      <div className="bg-surface shadow-sm rounded-2xl p-1.5 border border-border overflow-x-auto custom-scrollbar">
        <div className="flex space-x-1 min-w-max">
          {abas.map((aba) => {
            const isActive = abaAtiva === aba.id;
            const Icon = aba.icon;
            
            return (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id as AbaRH)}
                className={`
                  relative flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 ease-out
                  ${isActive
                    ? 'text-primary bg-primary/10 shadow-sm ring-1 ring-primary/20'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-main'}
                `}
              >
                <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                {aba.label}
                {isActive && (
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <div className="bg-surface shadow-card rounded-2xl p-6 border border-border min-h-[500px] animate-enter">
        {abaAtiva === 'alertas' && <PainelAlertas />}
        {abaAtiva === 'usuarios' && <GestaoUsuarios adminUserId={user.id} />}
        {abaAtiva === 'cargos' && <GestaoCargos />}
      </div>
    </div>
  );
}