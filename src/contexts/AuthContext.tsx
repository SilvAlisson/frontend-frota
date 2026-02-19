import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  login: (data: { token: string; user: User }) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Inicia true para impedir redirecionamentos errados antes de ler o storage
  const [loading, setLoading] = useState(true);

  // Função interna para limpar dados (usada no logout e no catch)
  const signOut = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    
    // Ao setar para nulo, o Router detecta a mudança e redireciona para o /login na hora
    setUser(null);
  };

  useEffect(() => {
    // Função para restaurar a sessão ao recarregar a página
    const recoverSession = () => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authUser');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser) as User;
          
          // 1. Restaura o estado (o interceptor da api.ts fará o resto)
          setUser(parsedUser);

        } catch (error) {
          console.error("Sessão inválida encontrada. Limpando dados.", error);
          signOut();
        }
      }

      setLoading(false);
    };

    recoverSession();

    // --- NOVO: Listener para o evento de erro 401 disparado pela API ---
    const handleUnauthorized = () => {
      signOut();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    
    // Cleanup do listener
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = (data: { token: string; user: User }) => {
    // 1. Persistência
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('authUser', JSON.stringify(data.user));

    // 2. Atualização do Estado
    setUser(data.user);
  };

  const logout = () => {
    signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado "Safe"
// Garante que o contexto existe antes de ser usado
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider.');
  }

  return context;
};