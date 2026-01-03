import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from './services/api';
import { useAuth } from './contexts/AuthContext';
import { useVeiculos } from './hooks/useVeiculos';

// Imports de Dashboards e Componentes
import { LoginScreen } from './pages/LoginScreen';
import { AdminLayout } from './layouts/AdminLayout';
import { DashboardOperador } from './components/DashboardOperador';
import { DashboardEncarregado } from './components/DashboardEncarregado';
import { DashboardRH } from './components/DashboardRH';
import { DashboardRelatorios } from './components/DashboardRelatorios';
import { VeiculoDetalhes } from './pages/VeiculoDetalhes';
import { PainelAlertas } from './components/PainelAlertas';
import { GestaoVeiculos } from './components/GestaoVeiculos';
import { GestaoUsuarios } from './components/GestaoUsuarios';
import { GestaoProdutos } from './components/GestaoProdutos';
import { GestaoFornecedores } from './components/GestaoFornecedores';
import { GestaoCargos } from './components/GestaoCargos';
import { RankingOperadores } from './components/RankingOperadores';
import { HistoricoManutencoes } from './components/HistoricoManutencoes';
import { HistoricoAbastecimentos } from './components/HistoricoAbastecimentos';
import { HistoricoJornadas } from './components/HistoricoJornadas';
import { FormRegistrarManutencao } from './components/forms/FormRegistrarManutencao';
import { RegistrarAbastecimento } from './components/RegistrarAbastecimento';

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-emerald-500 mb-4"></div>
    <p className="text-slate-500 font-medium animate-pulse">Carregando sistema...</p>
  </div>
);

// --- WRAPPERS DE ROTA PROTEGIDA ---
function PrivateRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// --- LAYOUT E DATA LOADER PARA ADMIN ---
// Garante que o cache de veículos esteja quente para as rotas administrativas
function AdminDataLayout() {
  const { isLoading: loadingVeiculos } = useVeiculos();

  if (loadingVeiculos) return <LoadingScreen />;

  return <AdminLayout />;
}

/**
 * RootDashboardRouter: Decide o que exibir na URL "/"
 */
function RootDashboardRouter() {
  const { user, loading } = useAuth();

  // 1. Buscamos os veículos aqui para passar aos Dashboards Operacionais
  const { data: veiculos } = useVeiculos();

  // Queries essenciais para os Dashboards
  const { data: usuarios } = useQuery({ queryKey: ['users'], queryFn: async () => (await api.get('/users')).data, enabled: !!user });
  const { data: produtos } = useQuery({ queryKey: ['produtos'], queryFn: async () => (await api.get('/produtos')).data, enabled: !!user });
  const { data: fornecedores } = useQuery({ queryKey: ['fornecedores'], queryFn: async () => (await api.get('/fornecedores')).data, enabled: !!user });
  const { data: jornadasAtivas, refetch: refetchJornadas } = useQuery({
    queryKey: ['jornadas', 'ativas'],
    queryFn: async () => (await api.get('/jornadas/ativas')).data,
    enabled: !!user
  });

  if (loading || !user) return <LoadingScreen />;

  const containerStyle = "p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-slate-50";

  switch (user.role) {
    case 'OPERADOR':
      return (
        <div className={containerStyle}>
          <DashboardOperador
            user={user}
            usuarios={usuarios || []}
            // AQUI está o uso da variável 'veiculos' que resolve o aviso:
            veiculos={veiculos || []}
            produtos={produtos || []}
            fornecedores={fornecedores || []}
            jornadasAtivas={jornadasAtivas || []}
            onJornadaIniciada={() => refetchJornadas()}
            onJornadaFinalizada={() => refetchJornadas()}
          />
        </div>
      );
    case 'ENCARREGADO':
      return (
        <div className={containerStyle}>
          <DashboardEncarregado
            user={user}
            // AQUI também usamos:
            veiculos={veiculos || []}
            usuarios={usuarios || []}
            produtos={produtos || []}
            fornecedores={fornecedores || []}
            jornadasAbertas={jornadasAtivas || []}
            onJornadaFinalizada={() => refetchJornadas()}
          />
        </div>
      );
    case 'RH':
      return <div className={containerStyle}><DashboardRH user={user} /></div>;

    case 'ADMIN':
    case 'COORDENADOR':
      return <Navigate to="/admin" replace />;

    default:
      return <Navigate to="/login" replace />;
  }
}

export function Router() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Hook auxiliar para buscar dados para as rotas de Admin que exigem props
  const { data: veiculos } = useVeiculos();
  const veiculosSafe = veiculos || [];

  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />

      {/* Rota Raiz (Dashboards Operacionais) */}
      <Route path="/" element={
        <PrivateRoute>
          <RootDashboardRouter />
        </PrivateRoute>
      } />

      {/* Rotas de Admin */}
      <Route path="/admin" element={
        <PrivateRoute allowedRoles={['ADMIN', 'COORDENADOR', 'ENCARREGADO']}>
          <AdminDataLayout />
        </PrivateRoute>
      }>
        {/* Passamos veiculosSafe para evitar erro de prop vazia */}
        <Route index element={<DashboardRelatorios veiculos={veiculosSafe} />} />

        <Route path="alertas" element={<PainelAlertas />} />
        <Route path="ranking" element={<RankingOperadores />} />

        <Route path="manutencoes">
          <Route index element={
            <HistoricoManutencoes
              userRole={user?.role || ''}
              veiculos={veiculosSafe}
              produtos={[]}
              fornecedores={[]}
            />
          } />
          <Route path="nova" element={<FormRegistrarManutencao veiculos={veiculosSafe} produtos={[]} fornecedores={[]} />} />
        </Route>

        <Route path="abastecimentos">
          <Route index element={<HistoricoAbastecimentos userRole={user?.role || ''} veiculos={veiculosSafe} />} />
          <Route path="novo" element={
            <RegistrarAbastecimento
              usuarios={[]}
              veiculos={veiculosSafe}
              produtos={[]}
              fornecedores={[]}
              onClose={() => navigate('/admin/abastecimentos')}
              onSuccess={() => navigate('/admin/abastecimentos')}
            />
          } />
        </Route>

        <Route path="jornadas" element={<HistoricoJornadas veiculos={veiculosSafe} userRole={user?.role} />} />

        <Route path="veiculos">
          <Route index element={<GestaoVeiculos />} />
          <Route path=":id" element={<VeiculoDetalhes />} />
        </Route>

        <Route path="usuarios" element={
          <PrivateRoute allowedRoles={['ADMIN', 'COORDENADOR']}>
            <GestaoUsuarios adminUserId={user?.id || ''} />
          </PrivateRoute>
        } />

        <Route path="produtos" element={<GestaoProdutos />} />
        <Route path="fornecedores" element={<GestaoFornecedores />} />
        <Route path="cargos" element={<GestaoCargos />} />
      </Route>

      {/* Fallback 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}