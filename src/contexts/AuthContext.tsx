import { createContext, useContext, type ReactNode, useEffect, useCallback, useMemo, useState } from 'react';
import { useSession, signOut as betterSignOut } from '../lib/auth-client';
import type { User } from '../types';
import { logger } from '../lib/logger';

import type { UserRole, StatusOperador } from '../types/user';
import { ConfirmModal } from '../components/ui/ConfirmModal';

function parseRole(role: unknown): UserRole | null {
  const validRoles: UserRole[] = ['ADMIN', 'RH', 'ENCARREGADO', 'OPERADOR', 'COORDENADOR', 'AUXILIAR_OPERACIONAL'];
  if (typeof role === 'string' && validRoles.includes(role as UserRole)) {
    return role as UserRole;
  }
  logger.debug('Role inválida ou ausente no payload de sessão:', role);
  return null;
}

function parseStatus(status: unknown): StatusOperador {
  switch(status) {
    case 'ATIVO': return 'ATIVO';
    case 'AFASTADO': return 'AFASTADO';
    case 'ATESTADO': return 'ATESTADO';
    case 'FERIAS': return 'FERIAS';
    default: return 'ATIVO';
  }
}


interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  permiteOperacao: boolean;
  refreshAuth: () => Promise<void>;
  logout: () => void;
  requestLogout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextData | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: sessionData, isPending: isSessionLoading, refetch: refetchSession } = useSession();

  const validRole = sessionData?.user && 'role' in sessionData.user ? parseRole(sessionData.user.role) : null;

  const betterUser: User | null = (sessionData?.user && validRole) ? {
    id: sessionData.user.id,
    nome: sessionData.user.name,
    email: sessionData.user.email,
    matricula: 'matricula' in sessionData.user ? String(sessionData.user.matricula) : null,
    role: validRole,
    cargo: 'cargo' in sessionData.user ? String(sessionData.user.cargo) : null,
    fotoUrl: sessionData.user.image,
    image: sessionData.user.image,
    status: 'status' in sessionData.user ? parseStatus(sessionData.user.status) : 'ATIVO',
    permiteOperacao: 'permiteOperacao' in sessionData.user ? Boolean(sessionData.user.permiteOperacao) : false
  } : null;

  const currentUser = betterUser;

  const refreshAuth = useCallback(async () => {
    await refetchSession();
  }, [refetchSession]);

  const confirmLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await betterSignOut();
    } catch (e) {
      logger.debug('Erro silencioso ao fazer sign out:', e);
    } finally {
      window.location.href = '/login';
    }
  }, []);

  const logout = useCallback(() => {
    confirmLogout();
  }, [confirmLogout]);

  const requestLogout = useCallback(() => {
    setIsLogoutModalOpen(true);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout]);

  const contextValue = useMemo(() => ({
    user: currentUser,
    isAuthenticated: !!currentUser,
    permiteOperacao: currentUser?.permiteOperacao ?? false,
    refreshAuth,
    logout,
    requestLogout,
    loading: isSessionLoading
  }), [currentUser, refreshAuth, logout, requestLogout, isSessionLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onCancel={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
        title="Encerrar Sessão"
        description="Tem certeza que deseja fechar a sua sessão e sair do sistema?"
        confirmLabel="Sair do Sistema"
        variant="danger"
        isLoading={isLoggingOut}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
