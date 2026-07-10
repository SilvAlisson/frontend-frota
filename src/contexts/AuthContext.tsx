import { createContext, useContext, type ReactNode, useEffect, useState, useCallback, useMemo } from 'react';
import { useSession, signOut as betterSignOut } from '../lib/auth-client';
import type { User } from '../types';
import { logger } from '../lib/logger';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: sessionData, isPending: isSessionLoading } = useSession();
  const queryClient = useQueryClient();
  
  // Mapeia .image para .fotoUrl e .name para .nome para manter compatibilidade com o frontend inteiro
  const betterUser = sessionData?.user ? { 
    ...sessionData.user, 
    fotoUrl: sessionData.user.image,
    nome: sessionData.user.name 
  } as unknown as User : null;

  const login = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['session'] });
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
        await betterSignOut();
        await queryClient.invalidateQueries();
    } catch(e) {
        logger.debug('Erro silencioso ao fazer sign out:', e);
    }
  }, [queryClient]);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout]);

  const contextValue = useMemo(() => ({
      user: betterUser,
      isAuthenticated: !!betterUser,
      login,
      logout,
      loading: isSessionLoading
  }), [betterUser, login, logout, isSessionLoading]);

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
