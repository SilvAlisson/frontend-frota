import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
const GestaoAuditoria = lazy(() => import('./components/GestaoAuditoria').then(m => ({ default: m.GestaoAuditoria })));
const GestaoConfiguracoes = lazy(() => import('./components/GestaoConfiguracoes').then(m => ({ default: m.GestaoConfiguracoes })));
const DossiePublico = lazy(() => import('./pages/DossiePublico').then(m => ({ default: m.DossiePublico })));

// Telas de Acesso (Não-Lazy pois são os gatilhos iniciais)
import { LoginScreen } from './pages/LoginScreen';
import { RedefinirSenha } from './pages/RedefinirSenha';
// COMPONENTES DINÂMICOS (Lazy Loading)
const AdminLayout = lazy(() => import('./layouts/AdminLayout').then(m => ({ default: m.AdminLayout })));
const RHLayout = lazy(() => import('./layouts/RHLayout').then(m => ({ default: m.RHLayout })));
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
const GestaoSST = lazy(() => import('./components/GestaoSST').then(m => ({ default: m.GestaoSST })));
const PainelPlanosPreventivos = lazy(() => import('./components/PainelPlanosPreventivos').then(m => ({ default: m.PainelPlanosPreventivos })));
const MinhaContaPage = lazy(() => import('./pages/MinhaContaPage').then(m => ({ default: m.MinhaContaPage })));
const MatrizQualificacaoPage = lazy(() => import('./pages/MatrizQualificacaoPage').then(m => ({ default: m.MatrizQualificacaoPage })));
const DossieIntegranteHub = lazy(() => import('./pages/DossieIntegranteHub').then(m => ({ default: m.DossieIntegranteHub })));
const ConvocacoesPage = lazy(() => import('./pages/ConvocacoesPage').then(m => ({ default: m.ConvocacoesPage })));

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-background relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 pointer-events-none -z-10"></div>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[3000ms]"></div>
    
    <div className="relative z-10 flex flex-col items-center gap-6 animate-enter">
      <div className="w-16 h-16 bg-surface border border-border/60 rounded-2xl flex items-center justify-center shadow-lg animate-bounce duration-[2000ms]">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
      </div>
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-2xl font-header font-black text-text-main tracking-tight">Frota KLIN</h2>
        <div className="flex gap-1.5 opacity-50">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping delay-150"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping delay-300"></div>
        </div>
      </div>
    </div>
  </div>
);

// --- WRAPPERS DE ROTA PROTEGIDA ---
function PrivateRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { isAuthenticated, loading, user } = useAuth();
  


  if (loading) {

    return <LoadingScreen />;
  }

  if (!isAuthenticated) {

    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {

    return <Navigate to="/" replace />;
  }



  return <>{children}</>;
}

function AdminIndex() {
  const { user, loading } = useAuth();

  if (loading || !user) return <LoadingScreen />;

  if (user.role === 'RH') {
    return <DashboardRH user={user} />;
  }
  
  return <DashboardRelatorios />; // Default para ADMIN e COORDENADOR
}

function RootDashboardRouter() {
  const { user, loading } = useAuth();

  if (loading || !user) return <LoadingScreen />;

  const containerStyle = "p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-background transition-colors duration-500";

  if (user.role === 'OPERADOR' || user.role === 'AUXILIAR_OPERACIONAL') {
    return (
      <div className={containerStyle}>
        <DashboardOperador user={user} />
      </div>
    );
  }

  if (user.role === 'ENCARREGADO') {
    return <Navigate to="/encarregado" replace />;
  }

  return <Navigate to="/admin" replace />;
}

function RoleBasedAdminLayout() {
  const { user, loading } = useAuth();
  
  if (loading || !user) return <LoadingScreen />;

  if (user.role === 'RH') {
    return <RHLayout />;
  }

  return <AdminLayout />;
}

function EncarregadoRoute() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-background transition-colors duration-500">
      <DashboardEncarregado user={user} />
    </div>
  );
}

// Injetor seguro para rotas que precisam do userRole explicitamente
function InjectUserRole({ children }: { children: (role: string) => React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children(user.role)}</>;
}

export function Router() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="/dossie/:id" element={<DossiePublico />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <RootDashboardRouter />
          </PrivateRoute>
        } />

        <Route path="/minha-conta" element={
          <PrivateRoute>
            <MinhaContaPage />
          </PrivateRoute>
        } />

        {/* Rota do Encarregado (Nested Router) */}
        <Route path="/encarregado/*" element={
          <PrivateRoute allowedRoles={['ENCARREGADO']}>
            <EncarregadoRoute />
          </PrivateRoute>
        } />

        {/* Rotas de Admin */}
        <Route path="/admin" element={
          <PrivateRoute allowedRoles={['ADMIN', 'COORDENADOR', 'RH']}>
            <RoleBasedAdminLayout />
          </PrivateRoute>
        }>
          
          <Route index element={<AdminIndex />} />
          <Route path="alertas" element={<PainelAlertas />} />
          <Route path="ranking" element={<RankingOperadores />} />
          <Route path="manutencoes" element={<InjectUserRole>{(role) => <HistoricoManutencoes userRole={role} />}</InjectUserRole>} />
          <Route path="abastecimentos" element={<InjectUserRole>{(role) => <HistoricoAbastecimentos userRole={role} />}</InjectUserRole>} />
          <Route path="jornadas" element={<InjectUserRole>{(role) => <HistoricoJornadas userRole={role} />}</InjectUserRole>} />

          <Route path="veiculos">
            <Route index element={<GestaoVeiculos />} />
            <Route path=":id" element={<VeiculoDetalhes />} />
          </Route>

          {/*  Prop adminUserId removida */}
          <Route path="integrantes" element={
            <PrivateRoute allowedRoles={['ADMIN', 'COORDENADOR', 'RH']}>
              <GestaoUsuarios /> 
            </PrivateRoute>
          } />

          <Route path="produtos" element={<GestaoProdutos />} />
          <Route path="fornecedores" element={<GestaoFornecedores />} />
          <Route path="documentos" element={<GestaoDocumentos />} />
          <Route path="planos" element={<PainelPlanosPreventivos />} />
          <Route path="cargos" element={<GestaoCargos />} />

          <Route path="sst" element={
            <PrivateRoute allowedRoles={['ADMIN', 'COORDENADOR', 'RH']}>
              <GestaoSST />
            </PrivateRoute>
          } />

          <Route path="matriz">
            <Route index element={
              <PrivateRoute allowedRoles={['ADMIN', 'COORDENADOR', 'RH']}>
                <MatrizQualificacaoPage />
              </PrivateRoute>
            } />
            <Route path=":id" element={
              <PrivateRoute allowedRoles={['ADMIN', 'COORDENADOR', 'RH']}>
                <DossieIntegranteHub />
              </PrivateRoute>
            } />
          </Route>

          <Route path="convocacoes" element={
            <PrivateRoute allowedRoles={['ADMIN', 'RH']}>
              <ConvocacoesPage />
            </PrivateRoute>
          } />



          <Route path="auditoria" element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <GestaoAuditoria />
            </PrivateRoute>
          } />

          <Route path="configuracoes" element={
            <PrivateRoute allowedRoles={['ADMIN', 'RH']}>
              <GestaoConfiguracoes />
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
