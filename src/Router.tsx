import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

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
import { GestaoDocumentos } from './components/GestaoDocumentos';
import { RankingOperadores } from './components/RankingOperadores';
import { HistoricoManutencoes } from './components/HistoricoManutencoes';
import { HistoricoAbastecimentos } from './components/HistoricoAbastecimentos';
import { HistoricoJornadas } from './components/HistoricoJornadas';
import { FormRegistrarManutencao } from './components/forms/FormRegistrarManutencao';
import { FormRegistrarAbastecimento } from './components/forms/FormRegistrarAbastecimento';
import { FormPlanoManutencao } from './components/forms/FormPlanoManutencao';

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

/**
 * RootDashboardRouter: Decide o que exibir na URL "/"
 * AGORA LIMPO: Não busca dados, apenas roteia!
 */
function RootDashboardRouter() {
  const { user, loading } = useAuth();

  if (loading || !user) return <LoadingScreen />;

  const containerStyle = "p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-slate-50";

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
          {/* Removemos o AdminDataLayout que travava o sistema esperando veículos */}
          <AdminLayout />
        </PrivateRoute>
      }>
        <Route index element={<DashboardRelatorios />} />

        <Route path="alertas" element={<PainelAlertas />} />
        <Route path="ranking" element={<RankingOperadores />} />

        <Route path="manutencoes">
          <Route index element={<HistoricoManutencoes userRole={user?.role || ''} />} />
          {/* REMOVIDAS AS GAMBIARRAS DOS ARRAYS VAZIOS [] */}
          <Route path="nova" element={<FormRegistrarManutencao onSuccess={() => navigate('/admin/manutencoes')} onClose={() => navigate('/admin/manutencoes')} />} />
        </Route>

        <Route path="abastecimentos">
          <Route index element={<HistoricoAbastecimentos userRole={user?.role || ''} />} />
          <Route path="novo" element={
            <FormRegistrarAbastecimento
              usuarioLogado={user || undefined}
              onCancelar={() => navigate('/admin/abastecimentos')}
              onSuccess={() => navigate('/admin/abastecimentos')}
            />
          } />
        </Route>

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
      </Route>

      {/* Fallback 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}