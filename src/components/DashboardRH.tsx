import { useState } from 'react';
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
      id: 'usuarios', label: 'Colaboradores', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
      )
    },
    {
      id: 'cargos', label: 'Cargos & Treinamentos', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" /></svg>
      )
    },
    {
      id: 'alertas', label: 'Alertas & Vencimentos', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
      )
    },
  ];

  return (
    <div className="space-y-6">
      {/* MENU PREMIUM */}
      {/* [PADRONIZAÇÃO] bg-white -> bg-white (para menus flutuantes), border-gray-100 -> border-border */}
      <div className="bg-white shadow-sm rounded-2xl p-2 border border-border overflow-x-auto custom-scrollbar">
        <div className="flex space-x-1 min-w-max">
          {abas.map((aba) => {
            const isActive = abaAtiva === aba.id;
            return (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id as AbaRH)}
                className={`
                  relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ease-out
                  ${isActive
                    // [PADRONIZAÇÃO] Cores do tema
                    ? 'text-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                    // [PADRONIZAÇÃO] hover:bg-gray-50 -> hover:bg-background
                    : 'text-gray-500 hover:bg-background hover:text-gray-800'}
                `}
              >
                <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
                  {aba.icon}
                </span>
                {aba.label}
                {isActive && (
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTEÚDO COM ANIMAÇÃO */}
      {/* [PADRONIZAÇÃO] border-gray-100 -> border-border */}
      <div className="bg-white shadow-card rounded-2xl p-6 border border-border min-h-[500px] animate-in fade-in slide-in-from-bottom-2 duration-500">
        {abaAtiva === 'alertas' && <PainelAlertas />}
        {abaAtiva === 'usuarios' && <GestaoUsuarios adminUserId={user.id} />}
        {abaAtiva === 'cargos' && <GestaoCargos />}
      </div>
    </div>
  );
}