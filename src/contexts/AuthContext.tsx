import { createContext, useContext, type ReactNode, useEffect, useState, useCallback, useMemo } from 'react';
import { useSession, signOut as betterSignOut } from '../lib/auth-client';
import type { User } from '../types';
import { RENDER_API_BASE_URL } from '../config';

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
  
  // Session validada remotamente, não mais injetada de forma cega do sessionStorage
  const [manualUser, setManualUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Validação segura contra a API para evitar Client-Side Role Escalation
  useEffect(() => {
    const validateManualSession = async () => {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        if (!isSessionLoading) setLoading(false);
        return;
      }

      try {
        // Usa a URL da API, substituindo fallback por VITE_BACKEND_URL ou RENDER_API_BASE_URL
        const backendUrl = import.meta.env.VITE_BACKEND_URL || RENDER_API_BASE_URL.replace(/\/api$/, '');
        const urlToFetch = backendUrl.includes('/api') ? `${backendUrl}/users/me` : `${backendUrl}/api/users/me`;
        
        const res = await fetch(urlToFetch, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Sessão manual inválida ou expirada');
        
        const userData = await res.json();
        
        if (userData.image && !userData.fotoUrl) userData.fotoUrl = userData.image;
        if (userData.name && !userData.nome) userData.nome = userData.name;

        // Sobrescreve o lixo local com a verdade absoluta do DB
        sessionStorage.setItem('authUser', JSON.stringify(userData));
        setManualUser(userData);
      } catch (err) {
        // Mitigação imediata: token falso detectado = apaga tudo
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('authUser');
        setManualUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Só inicia a validação Bearer após o BetterAuth terminar de checar os cookies
    if (!isSessionLoading) {
      validateManualSession();
    }
  }, [isSessionLoading]);

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
    const userData = { ...data.user } as typeof data.user & { image?: string; name?: string };
    if (userData.image && !userData.fotoUrl) {
        userData.fotoUrl = userData.image;
    }
    if (userData.name && !userData.nome) {
        userData.nome = userData.name;
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
