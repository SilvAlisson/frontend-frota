import { createContext, useContext, type ReactNode, useEffect, useCallback, useMemo } from 'react';
import { useSession, signOut as betterSignOut } from '../lib/auth-client';
import type { User } from '../types';
import { logger } from '../lib/logger';

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: sessionData, isPending: isSessionLoading, refetch: refetchSession } = useSession();

  // Mapeia .image para .fotoUrl e .name para .nome (compatibilidade BetterAuth → App)
  const betterUser = sessionData?.user ? {
    ...sessionData.user,
    fotoUrl: sessionData.user.image,
    nome: sessionData.user.name
  } as unknown as User : null;

  const currentUser = betterUser;

  const login = useCallback(async () => {

    await refetchSession();

  }, [refetchSession]);

  const logout = useCallback(async () => {
    try {
      await betterSignOut();
    } catch (e) {
      logger.debug('Erro silencioso ao fazer sign out:', e);
    } finally {
      // Um Hard Redirect mata toda a árvore do React Query instantaneamente,
      // garantindo que não haverá NENHUMA tentativa de refetch 401 enquanto os componentes desmontam.
      window.location.href = '/login';
    }
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
    login,
    logout,
    loading: isSessionLoading
  }), [currentUser, login, logout, isSessionLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
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
