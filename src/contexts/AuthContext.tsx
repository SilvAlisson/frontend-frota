import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
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
            return JSON.parse(storedUser);
        } catch {
            return null;
        }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Só deixa de carregar quando o BetterAuth resolver o estado da sessão (cookies)
    if (!isSessionLoading) {
      setLoading(false);
    }
  }, [isSessionLoading]);

  // Derived state: Usa o user do BetterAuth (Cookie) prioritariamente, ou o manualUser (QR Code Bearer)
  // Mapeia .image para .fotoUrl para manter compatibilidade com o frontend inteiro
  const betterUser = sessionData?.user ? { ...sessionData.user, fotoUrl: sessionData.user.image } as User : undefined;
  const currentUser = betterUser || manualUser;

  const login = (data: { token?: string; user: User }) => {
    if (data.token) {
        sessionStorage.setItem('authToken', data.token);
    }
    sessionStorage.setItem('authUser', JSON.stringify(data.user));
    setManualUser(data.user);
  };

  const logout = async () => {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('authUser');
    setManualUser(null);
    try {
        await betterSignOut();
    } catch(e) {
        console.error(e);
    }
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  return (
    <AuthContext.Provider value={{
      user: currentUser || null,
      isAuthenticated: !!currentUser,
      login,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider.');
  return context;
};
