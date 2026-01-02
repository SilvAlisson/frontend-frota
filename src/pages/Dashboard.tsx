import { useAuth } from '../contexts/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { Button } from '../components/ui/Button';

// Componentes de Painel por Perfil
import { DashboardOperador } from '../components/DashboardOperador';
import { DashboardEncarregado } from '../components/DashboardEncarregado';
import { DashboardRH } from '../components/DashboardRH';
import { DashboardRelatorios } from '../components/DashboardRelatorios';

export function Dashboard() {
  const { user, logout } = useAuth();

  // Hook inteligente que busca dados em paralelo e faz cache
  const { data, isLoading, isError, refetch } = useDashboardData();

  if (!user) return null;

  // --- TELA DE CARREGAMENTO ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-border border-t-primary mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Sincronizando dados da frota...</p>
      </div>
    );
  }

  // --- TELA DE ERRO ---
  if (isError || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="bg-white p-8 rounded-3xl shadow-card border border-red-100 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Falha na Conexão</h3>
          <p className="text-gray-500 text-sm mb-6">
            Não foi possível carregar os dados. Verifique sua conexão.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Recarregar
            </Button>
            <Button variant="primary" onClick={() => refetch()}>
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { usuarios, veiculos, produtos, fornecedores, jornadasAtivas } = data;
  const handleAtualizarDados = () => refetch();

  return (
    <div className="min-h-screen bg-background pb-12 overflow-x-hidden">

      {/* NAVBAR SUPERIOR - Visível para TODOS (incluindo ADMIN) */}
      <nav className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-border h-16 transition-all">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <img src="/logo.png" alt="Logo" className="h-6 sm:h-8 w-auto" onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>
            <span className="font-bold text-lg sm:text-xl tracking-tight text-gray-900 truncate">
              KLIN <span className="text-primary">Frota</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900">{user.nome}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/5 text-primary border border-primary/10 uppercase tracking-wider">
                {user.role}
              </span>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block"></div>
            <Button
              variant="ghost"
              onClick={logout}
              className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 sm:px-4"
            >
              Sair
            </Button>
          </div>
        </div>
      </nav>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="w-full py-4 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-[1920px] mx-auto">

        {/* 1. VISÃO DO OPERADOR */}
        {user.role === 'OPERADOR' && (
          <DashboardOperador
            user={user}
            usuarios={usuarios}
            veiculos={veiculos}
            produtos={produtos}
            fornecedores={fornecedores}
            jornadasAtivas={jornadasAtivas}
            onJornadaIniciada={handleAtualizarDados}
            onJornadaFinalizada={handleAtualizarDados}
          />
        )}

        {/* 2. VISÃO DO ENCARREGADO E COORDENADOR */}
        {(user.role === 'ENCARREGADO' || user.role === 'COORDENADOR') && (
          <DashboardEncarregado
            user={user}
            veiculos={veiculos}
            usuarios={usuarios}
            produtos={produtos}
            fornecedores={fornecedores}
            jornadasAbertas={jornadasAtivas}
            onJornadaFinalizada={handleAtualizarDados}
          />
        )}

        {/* 3. VISÃO DO RH */}
        {user.role === 'RH' && (
          <DashboardRH user={user} />
        )}

        {/* 4. VISÃO DO ADMIN */}
        {user.role === 'ADMIN' && (
          <DashboardRelatorios
            veiculos={veiculos}
          />
        )}
      </main>
    </div>
  );
}