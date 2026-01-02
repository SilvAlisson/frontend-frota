import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from './services/api';
import { useAuth } from './contexts/AuthContext';
import { useVeiculos } from './hooks/useVeiculos';

// Imports de Dashboards Específicos
import { LoginScreen } from './pages/LoginScreen';
import { AdminLayout } from './layouts/AdminLayout';
import { DashboardOperador } from './components/DashboardOperador';
import { DashboardEncarregado } from './components/DashboardEncarregado';
import { DashboardRH } from './components/DashboardRH';
import { DashboardRelatorios } from './components/DashboardRelatorios';

// Outros componentes necessários para as sub-rotas admin
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
import { FormPlanoManutencao } from './components/forms/FormPlanoManutencao';

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary mb-4"></div>
    <p className="text-gray-500 font-medium animate-pulse">Carregando ambiente seguro...</p>
  </div>
);

// --- WRAPPERS DE ROTA PROTEGIDA ---

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

/**
 * Componente que decide qual dashboard mostrar na raiz (/) baseado na role do usuário.
 * Isso blinda o sistema contra erros 403, pois o Operador/RH nunca tentará carregar o dashboard administrativo.
 */
function RootDashboardRouter() {
  const { user } = useAuth();
  const { data: veiculos } = useVeiculos();
  const { refetch: refetchJornadas } = useQuery({ queryKey: ['jornadas', 'ativas'], queryFn: async () => (await api.get('/jornadas/ativas')).data, enabled: false });

  // Queries para alimentar os dashboards (Encarregado/Operador)
  const { data: usuarios } = useQuery({ queryKey: ['users'], queryFn: async () => (await api.get('/users')).data, enabled: !!user });
  const { data: produtos } = useQuery({ queryKey: ['produtos'], queryFn: async () => (await api.get('/produtos')).data, enabled: !!user });
  const { data: fornecedores } = useQuery({ queryKey: ['fornecedores'], queryFn: async () => (await api.get('/fornecedores')).data, enabled: !!user });
  const { data: jornadasAtivas } = useQuery({ queryKey: ['jornadas', 'ativas'], queryFn: async () => (await api.get('/jornadas/ativas')).data, enabled: !!user });

  if (!user) return <LoadingScreen />;

  const containerStyle = "p-4 md:p-8 max-w-[1600px] mx-auto";

  switch (user.role) {
    case 'OPERADOR':
      return (
        <div className={containerStyle}>
          <DashboardOperador
            user={user}
            usuarios={usuarios || []}
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
      return (
        <div className={containerStyle}>
          <DashboardRH user={user} />
        </div>
      );
    case 'ADMIN':
    case 'COORDENADOR':
      return <Navigate to="/admin" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

// --- WRAPPERS DE SUB-ROTAS ADMIN ---

function DashboardRoute() {
  const { data: veiculos, isLoading } = useVeiculos();
  if (isLoading) return <LoadingScreen />;
  return <DashboardRelatorios veiculos={veiculos || []} />;
}

function NovaManutencaoRoute() {
  const { data: veiculos } = useVeiculos();
  const { data: produtos } = useQuery({ queryKey: ['produtos'], queryFn: async () => (await api.get('/produtos')).data });
  const { data: fornecedores } = useQuery({ queryKey: ['fornecedores'], queryFn: async () => (await api.get('/fornecedores')).data });
  if (!veiculos || !produtos || !fornecedores) return <LoadingScreen />;
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 font-sans">Nova Manutenção</h2>
      <FormRegistrarManutencao veiculos={veiculos} produtos={produtos} fornecedores={fornecedores} />
    </div>
  );
}

function NovoAbastecimentoRoute() {
  const navigate = useNavigate();
  const { data: veiculos } = useVeiculos();
  const { data: produtos } = useQuery({ queryKey: ['produtos'], queryFn: async () => (await api.get('/produtos')).data });
  const { data: fornecedores } = useQuery({ queryKey: ['fornecedores'], queryFn: async () => (await api.get('/fornecedores')).data });
  const { data: usuarios } = useQuery({ queryKey: ['users'], queryFn: async () => (await api.get('/users')).data });
  if (!veiculos || !produtos || !fornecedores || !usuarios) return <LoadingScreen />;
  return (
    <RegistrarAbastecimento
      usuarios={usuarios}
      veiculos={veiculos}
      produtos={produtos}
      fornecedores={fornecedores}
      onClose={() => navigate('/admin/abastecimentos')}
      onSuccess={() => navigate('/admin/abastecimentos')}
    />
  );
}

export function Router() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />

      {/* Rota Raiz Decisora (Blinda o sistema redirecionando cada um para seu Dashboard) */}
      <Route path="/" element={<PrivateRoute><RootDashboardRouter /></PrivateRoute>} />

      {/* Rota Admin - Bloqueia acesso físico de OPERADORES e RH */}
      <Route path="/admin" element={
        <PrivateRoute>
          {user?.role === 'ADMIN' || user?.role === 'COORDENADOR' || user?.role === 'ENCARREGADO'
            ? <AdminLayout />
            : <Navigate to="/" replace />}
        </PrivateRoute>
      }>
        <Route index element={<DashboardRoute />} />
        <Route path="alertas" element={<PainelAlertas />} />
        <Route path="ranking" element={<RankingOperadores />} />

        <Route path="manutencoes">
          <Route index element={<HistoricoManutencoes userRole={user?.role || ''} veiculos={[]} produtos={[]} fornecedores={[]} />} />
          <Route path="nova" element={<NovaManutencaoRoute />} />
        </Route>

        <Route path="abastecimentos">
          <Route index element={<HistoricoAbastecimentos userRole={user?.role || ''} veiculos={[]} />} />
          <Route path="novo" element={<NovoAbastecimentoRoute />} />
        </Route>

        <Route path="jornadas" element={<HistoricoJornadas veiculos={[]} userRole={user?.role} />} />
        <Route path="planos" element={<FormPlanoManutencao veiculos={[]} />} />

        <Route path="veiculos">
          <Route index element={<GestaoVeiculos />} />
          <Route path=":id" element={<VeiculoDetalhes />} />
        </Route>

        <Route path="usuarios" element={<GestaoUsuarios adminUserId={user?.id || ''} />} />
        <Route path="produtos" element={<GestaoProdutos />} />
        <Route path="fornecedores" element={<GestaoFornecedores />} />
        <Route path="cargos" element={<GestaoCargos />} />
      </Route>

      {/* Fallback de segurança */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}