import { useState } from 'react';
import { Users, Briefcase, AlertTriangle, ShieldCheck } from 'lucide-react';
import { GestaoUsuarios } from './GestaoUsuarios';
import { GestaoCargos } from './GestaoCargos';
import { PainelAlertas } from './PainelAlertas';
import type { User } from '../types';
import { Tabs, type TabItem } from './ui/Tabs';

interface DashboardRHProps {
  user: User;
}

export function DashboardRH({ user }: DashboardRHProps) {
  const [abaAtiva, setAbaAtiva] = useState('usuarios');

  // Estrutura de dados para as Abas
  const abas: TabItem[] = [
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
      icon: AlertTriangle,
      hasNotification: true // A bolinha vermelha animada!
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

        {/* ✨ O NOSSO NOVO COMPONENTE TABS */}
        <Tabs 
          tabs={abas}
          activeTab={abaAtiva}
          onChange={setAbaAtiva}
          variant="segmented"
        />
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