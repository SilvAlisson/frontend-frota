import { createContext, useContext, ReactNode, useEffect, useState, useCallback, useMemo } from 'react';
import { useSession, signOut as betterSignOut } from '../lib/auth-client';
import type { User } from '../types';

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  login: (data: { token?: string; user: User }) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: sessionData, isPending: isSessionLoading } = useSession();
  
  // Fallback para QR Code (que usa Token manual no sessionStorage)
  const [manualUser, setManualUser] = useState<User | null>(() => {
    const storedUser = sessionStorage.getItem('authUser');
    if (storedUser) {
        try {
            const parsed = JSON.parse(storedUser);
            if (parsed && typeof parsed === 'object') {
                if (parsed.image && !parsed.fotoUrl) {
                    parsed.fotoUrl = parsed.image;
                }
                if (parsed.name && !parsed.nome) {
                    parsed.nome = parsed.name;
                }
            }
            return parsed;
        } catch {
            return null;
        }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Libera o carregamento se a sessão resolver OU se já tivermos um usuário manual em memória
    if (!isSessionLoading || manualUser) {
      setLoading(false);
    }
  }, [isSessionLoading, manualUser]);

  // Derived state: Usa o user do BetterAuth (Cookie) prioritariamente, ou o manualUser (QR Code Bearer)
  // Mapeia .image para .fotoUrl e .name para .nome para manter compatibilidade com o frontend inteiro
  const betterUser = sessionData?.user ? { 
    ...sessionData.user, 
    fotoUrl: sessionData.user.image,
    nome: sessionData.user.name 
  } as unknown as User : undefined;
  const currentUser = betterUser || manualUser;

  const login = useCallback((data: { token?: string; user: User }) => {
    if (data.token) {
        sessionStorage.setItem('authToken', data.token);
    }
    
    // Mapeia image para fotoUrl e name para nome antes de salvar na memória/state
    const userData = { ...data.user };
    if ((userData as any).image && !userData.fotoUrl) {
        userData.fotoUrl = (userData as any).image;
    }
    if ((userData as any).name && !userData.nome) {
        userData.nome = (userData as any).name;
    }

    sessionStorage.setItem('authUser', JSON.stringify(userData));
    setManualUser(userData);
  }, []);

  const logout = useCallback(async () => {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('authUser');
    setManualUser(null);
    try {
        await betterSignOut();
    } catch(e) {
        console.error(e);
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
      user: currentUser || null,
      isAuthenticated: !!currentUser,
      login,
      logout,
      loading
  }), [currentUser, login, logout, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider.');
  return context;
};
