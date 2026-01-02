import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'; // [CORREÇÃO] Adicionado useNavigate
import { useQuery } from '@tanstack/react-query';
import { api } from './services/api';
import { useAuth } from './contexts/AuthContext';
import { useVeiculos } from './hooks/useVeiculos';

// ... (Imports de componentes permanecem iguais)
import { LoginScreen } from './pages/LoginScreen';
import { AdminLayout } from './layouts/AdminLayout';
import { VeiculoDetalhes } from './pages/VeiculoDetalhes';
import { DashboardRelatorios } from './components/DashboardRelatorios';
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
  <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
    <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary mb-4"></div>
    <p className="text-gray-500 font-medium animate-pulse">Carregando dados...</p>
  </div>
);

// --- WRAPPERS DE ROTA ---

function DashboardRoute() {
  const { data: veiculos, isLoading } = useVeiculos();
  if (isLoading) return <LoadingScreen />;
  return <DashboardRelatorios veiculos={veiculos || []} />;
}

function UsuariosRoute() {
  const { user } = useAuth();
  if (!user) return <LoadingScreen />;
  return <GestaoUsuarios adminUserId={user.id} />;
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

// [CORREÇÃO AQUI] Adicionado navigate e props onClose/onSuccess
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
      onClose={() => navigate('/admin/abastecimentos')} // Volta para a lista ao fechar
      onSuccess={() => navigate('/admin/abastecimentos')} // Volta para a lista ao salvar
    />
  );
}

function ManutencoesHistoricoRoute() {
  const { user } = useAuth();
  const { data: veiculos } = useVeiculos();
  const { data: produtos } = useQuery({ queryKey: ['produtos'], queryFn: async () => (await api.get('/produtos')).data });
  const { data: fornecedores } = useQuery({ queryKey: ['fornecedores'], queryFn: async () => (await api.get('/fornecedores')).data });

  if (!veiculos || !produtos || !fornecedores || !user) return <LoadingScreen />;

  return <HistoricoManutencoes userRole={user.role} veiculos={veiculos} produtos={produtos} fornecedores={fornecedores} />;
}

function AbastecimentosHistoricoRoute() {
  const { user } = useAuth();
  const { data: veiculos, isLoading } = useVeiculos();
  if (isLoading || !veiculos || !user) return <LoadingScreen />;
  return <HistoricoAbastecimentos userRole={user.role} veiculos={veiculos} />;
}

function JornadasRoute() {
  const { user } = useAuth();
  const { data: veiculos, isLoading } = useVeiculos();
  if (isLoading || !veiculos) return <LoadingScreen />;
  return <HistoricoJornadas veiculos={veiculos || []} userRole={user?.role} />;
}

function PlanosRoute() {
  const { data: veiculos, isLoading } = useVeiculos();
  if (isLoading || !veiculos) return <LoadingScreen />;
  return <FormPlanoManutencao veiculos={veiculos} />;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export function Router() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />

      <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
        <Route index element={<DashboardRoute />} />
        <Route path="alertas" element={<PainelAlertas />} />
        <Route path="ranking" element={<RankingOperadores />} />

        {/* Operacional */}
        <Route path="manutencoes">
          <Route index element={<ManutencoesHistoricoRoute />} />
          <Route path="nova" element={<NovaManutencaoRoute />} />
        </Route>

        <Route path="abastecimentos">
          <Route index element={<AbastecimentosHistoricoRoute />} />
          <Route path="novo" element={<NovoAbastecimentoRoute />} />
        </Route>

        <Route path="jornadas" element={<JornadasRoute />} />
        <Route path="planos" element={<PlanosRoute />} />

        {/* Cadastros */}
        <Route path="veiculos">
          <Route index element={<GestaoVeiculos />} />
          <Route path=":id" element={<VeiculoDetalhes />} />
        </Route>

        <Route path="usuarios" element={<UsuariosRoute />} />
        <Route path="produtos" element={<GestaoProdutos />} />
        <Route path="fornecedores" element={<GestaoFornecedores />} />
        <Route path="cargos" element={<GestaoCargos />} />
      </Route>

      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}