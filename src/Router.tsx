import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Telas de Acesso (Não-Lazy pois são os gatilhos iniciais)
import { LoginScreen } from './pages/LoginScreen';
import { EsqueceuSenha } from './pages/EsqueceuSenha';
import { RedefinirSenha } from './pages/RedefinirSenha';

// ✨ COMPONENTES DINÂMICOS (Lazy Loading) - Diminui Drasticamente o Payload
const AdminLayout = lazy(() => import('./layouts/AdminLayout').then(m => ({ default: m.AdminLayout })));
const DashboardOperador = lazy(() => import('./components/DashboardOperador').then(m => ({ default: m.DashboardOperador })));
const DashboardEncarregado = lazy(() => import('./components/DashboardEncarregado').then(m => ({ default: m.DashboardEncarregado })));
const DashboardRH = lazy(() => import('./components/DashboardRH').then(m => ({ default: m.DashboardRH })));
const DashboardRelatorios = lazy(() => import('./components/DashboardRelatorios').then(m => ({ default: m.DashboardRelatorios })));
const VeiculoDetalhes = lazy(() => import('./pages/VeiculoDetalhes').then(m => ({ default: m.VeiculoDetalhes })));
const PainelAlertas = lazy(() => import('./components/PainelAlertas').then(m => ({ default: m.PainelAlertas })));
const GestaoVeiculos = lazy(() => import('./components/GestaoVeiculos').then(m => ({ default: m.GestaoVeiculos })));
const GestaoUsuarios = lazy(() => import('./components/GestaoUsuarios').then(m => ({ default: m.GestaoUsuarios })));
const GestaoProdutos = lazy(() => import('./components/GestaoProdutos').then(m => ({ default: m.GestaoProdutos })));
const GestaoFornecedores = lazy(() => import('./components/GestaoFornecedores').then(m => ({ default: m.GestaoFornecedores })));
const GestaoCargos = lazy(() => import('./components/GestaoCargos').then(m => ({ default: m.GestaoCargos })));
const GestaoDocumentos = lazy(() => import('./components/GestaoDocumentos').then(m => ({ default: m.GestaoDocumentos })));
const RankingOperadores = lazy(() => import('./components/RankingOperadores').then(m => ({ default: m.RankingOperadores })));
const HistoricoManutencoes = lazy(() => import('./components/HistoricoManutencoes').then(m => ({ default: m.HistoricoManutencoes })));
const HistoricoAbastecimentos = lazy(() => import('./components/HistoricoAbastecimentos').then(m => ({ default: m.HistoricoAbastecimentos })));
const HistoricoJornadas = lazy(() => import('./components/HistoricoJornadas').then(m => ({ default: m.HistoricoJornadas })));
const FormRegistrarManutencao = lazy(() => import('./components/forms/FormRegistrarManutencao').then(m => ({ default: m.FormRegistrarManutencao })));
const FormRegistrarAbastecimento = lazy(() => import('./components/forms/FormRegistrarAbastecimento').then(m => ({ default: m.FormRegistrarAbastecimento })));
const FormPlanoManutencao = lazy(() => import('./components/forms/FormPlanoManutencao').then(m => ({ default: m.FormPlanoManutencao })));
const GestaoSST = lazy(() => import('./components/GestaoSST').then(m => ({ default: m.GestaoSST })));

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mb-4"></div>
    <p className="text-text-secondary font-bold uppercase tracking-widest text-xs animate-pulse italic">Klin Frota: Carregando...</p>
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

/**
 * RootDashboardRouter: Decide o que exibir na URL "/"
 * AGORA LIMPO: Não busca dados, apenas roteia!
 */
function RootDashboardRouter() {
  const { user, loading } = useAuth();

  if (loading || !user) return <LoadingScreen />;

  const containerStyle = "p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-background transition-colors duration-500";

  switch (user.role) {
    case 'OPERADOR':
      return (
        <div className={containerStyle}>
          <DashboardOperador user={user} />
        </div>
      );
    case 'ENCARREGADO':
      return (
        <div className={containerStyle}>
          <DashboardEncarregado user={user} />
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

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />

      {/* ✨ ROTAS PÚBLICAS DE RECUPERAÇÃO DE SENHA ✨ */}
      <Route path="/esqueceu-senha" element={<EsqueceuSenha />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />

      {/* Rota Raiz (Dashboards Operacionais) */}
      <Route path="/" element={
        <PrivateRoute>
          <RootDashboardRouter />
        </PrivateRoute>
      } />

      {/* Rotas de Admin */}
      <Route path="/admin" element={
        <PrivateRoute allowedRoles={['ADMIN', 'COORDENADOR', 'ENCARREGADO']}>
          {/* Removemos o AdminDataLayout que travava o sistema esperando veículos */}
          <AdminLayout />
        </PrivateRoute>
      }>
        <Route index element={<DashboardRelatorios />} />

        <Route path="alertas" element={<PainelAlertas />} />
        <Route path="ranking" element={<RankingOperadores />} />

        <Route path="manutencoes" element={<HistoricoManutencoes userRole={user?.role || ''} />} />
        <Route path="abastecimentos" element={<HistoricoAbastecimentos userRole={user?.role || ''} />} />

        <Route path="jornadas" element={<HistoricoJornadas userRole={user?.role} />} />

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
        <Route path="documentos" element={<GestaoDocumentos />} />
        <Route path="planos" element={<FormPlanoManutencao />} />
        <Route path="cargos" element={<GestaoCargos />} />

        {/* SST — restrita a ADMIN e COORDENADOR */}
        <Route path="sst" element={
          <PrivateRoute allowedRoles={['ADMIN', 'COORDENADOR']}>
            <GestaoSST />
          </PrivateRoute>
        } />
      </Route>

      {/* Fallback 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}


