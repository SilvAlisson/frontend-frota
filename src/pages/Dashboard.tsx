import { useAuth } from '../contexts/AuthContext';

// Componentes de Painel por Perfil
import { DashboardOperador } from '../components/DashboardOperador';
import { DashboardEncarregado } from '../components/DashboardEncarregado';
import { DashboardRH } from '../components/DashboardRH';
import { DashboardRelatorios } from '../components/DashboardRelatorios';

export function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    // O wrapper agora garante uma entrada com 'fade' e deslize suave vindo de baixo
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 h-full w-full">
      
      {/* 1. VISÃO DO OPERADOR */}
      {user.role === 'OPERADOR' && (
        <DashboardOperador user={user} />
      )}

      {/* 2. VISÃO DO ENCARREGADO E COORDENADOR */}
      {(user.role === 'ENCARREGADO' || user.role === 'COORDENADOR') && (
        <DashboardEncarregado user={user} />
      )}

      {/* 3. VISÃO DO RH */}
      {user.role === 'RH' && (
        <DashboardRH user={user} />
      )}

      {/* 4. VISÃO DO ADMIN (O Cérebro Analítico) */}
      {user.role === 'ADMIN' && (
        <DashboardRelatorios />
      )}
      
    </div>
  );
}