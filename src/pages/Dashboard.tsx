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
    <div className="animate-enter pb-12">
      {/* NOTA: Removemos a <nav> (Header) daqui. 
        O Header e Sidebar agora são responsabilidade do `AdminLayout.tsx`.
        Isso evita duplicação de menus.
      */}

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

      {/* 4. VISÃO DO ADMIN */}
      {user.role === 'ADMIN' && (
        <DashboardRelatorios />
      )}
    </div>
  );
}