import { useAuth } from '../contexts/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { Button } from '../components/ui/Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Componentes de Painel por Perfil
import { DashboardOperador } from '../components/DashboardOperador';
import { DashboardEncarregado } from '../components/DashboardEncarregado';
import { DashboardRH } from '../components/DashboardRH';
import { DashboardRelatorios } from '../components/DashboardRelatorios';

export function Dashboard() {
  const { user } = useAuth();

  // Hook inteligente que busca dados em paralelo e faz cache
  const { data, isLoading, isError, refetch } = useDashboardData();

  if (!user) return null;

  // --- TELA DE CARREGAMENTO (Design System) ---
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] animate-enter">
        <div className="animate-spin text-primary mb-4">
          <RefreshCw className="w-10 h-10" />
        </div>
        <p className="text-text-secondary font-medium animate-pulse">Sincronizando dados da frota...</p>
      </div>
    );
  }

  // --- TELA DE ERRO (Design System) ---
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-4 animate-enter">
        <div className="bg-surface p-8 rounded-3xl shadow-card border border-error/20 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4 text-error">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-text-main mb-2">Falha na Conexão</h3>
          <p className="text-text-secondary text-sm mb-6">
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
    <div className="animate-enter pb-12">
      {/* NOTA: Removemos a <nav> (Header) daqui. 
          O Header e Sidebar agora são responsabilidade do `AdminLayout.tsx`.
          Isso evita duplicação de menus.
      */}

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
    </div>
  );
}