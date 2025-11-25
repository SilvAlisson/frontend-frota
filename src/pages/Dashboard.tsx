import { useAuth } from '../contexts/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { Button } from '../components/ui/Button';

// Componentes Separados
import { DashboardOperador } from '../components/DashboardOperador';
import { DashboardEncarregado } from '../components/DashboardEncarregado';
import { AdminDashboard } from '../components/AdminDashboard';

export function Dashboard() {
  const { user, logout } = useAuth();

  // Token recuperado apenas por compatibilidade com componentes que ainda não foram refatorados 100%
  // mas removido das chamadas que estavam dando erro de tipagem.
  const token = localStorage.getItem('authToken') || '';

  const { data, isLoading, isError, refetch } = useDashboardData();

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary mb-4"></div>
        <p className="text-text-secondary font-medium animate-pulse">A sincronizar frota...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="bg-red-50 p-6 rounded-card border border-red-100 text-center max-w-md">
          <h3 className="text-red-800 font-bold mb-2">Falha na Conexão</h3>
          <p className="text-red-600 text-sm mb-4">Não foi possível carregar os dados do sistema. Verifique sua internet.</p>
          <div className="flex gap-2 justify-center">
            <Button variant="secondary" onClick={() => window.location.reload()}>Recarregar Página</Button>
            <Button variant="primary" onClick={() => refetch()}>Tentar Novamente</Button>
          </div>
        </div>
      </div>
    );
  }

  const { usuarios, veiculos, produtos, fornecedores, jornadasEspecificas } = data;

  const handleJornadaIniciada = () => {
    refetch();
  };
  const handleJornadaFinalizada = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-white shadow-sm sticky top-0 z-30 border-b border-gray-100 h-16">
        <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
            <span className="font-bold text-xl tracking-tight text-primary hidden sm:block">KLIN Frota</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-text">{user.nome}</p>
              <span className="text-xs font-bold uppercase bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {user.role}
              </span>
            </div>
            <Button variant="secondary" onClick={logout} className="!py-2 text-xs">Sair</Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

        {/* 1. VISÃO DO OPERADOR */}
        {user.role === 'OPERADOR' && (
          <DashboardOperador
            token={token}
            user={user}
            usuarios={usuarios}
            veiculos={veiculos}
            jornadasAtivas={jornadasEspecificas}
            onJornadaIniciada={handleJornadaIniciada}
            onJornadaFinalizada={handleJornadaFinalizada}
          />
        )}

        {/* 2. VISÃO DO ENCARREGADO */}
        {user.role === 'ENCARREGADO' && (
          <DashboardEncarregado
            token={token}
            user={user}
            veiculos={veiculos}
            usuarios={usuarios}
            produtos={produtos}
            fornecedores={fornecedores}
            jornadasAbertas={jornadasEspecificas}
            onJornadaFinalizada={handleJornadaFinalizada}
          />
        )}

        {/* 3. VISÃO DO ADMIN */}
        {user.role === 'ADMIN' && (
          <AdminDashboard
            // CORREÇÃO: Removida a prop 'token' que causava erro de tipo
            adminUserId={user.id}
            veiculos={veiculos}
            produtos={produtos}
            fornecedores={fornecedores}
          />
        )}

      </main>
    </div>
  );
}