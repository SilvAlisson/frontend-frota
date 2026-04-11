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

// 🔒 007 Security: usando sessionStorage em vez de localStorage
// - Dados limpos automaticamente ao fechar a aba/browser (sem exposição persistente)
// - Resistente a ataques XSS persistentes (extensões maliciosas não sobrevivem ao reload cross-origin)
const storage = {
  getItem: (key: string) => sessionStorage.getItem(key),
  setItem: (key: string, value: string) => sessionStorage.setItem(key, value),
  removeItem: (key: string) => sessionStorage.removeItem(key),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Inicia true para impedir redirecionamentos errados antes de ler o storage
  const [loading, setLoading] = useState(true);

  // Função interna para limpar dados (usada no logout e no catch)
  const signOut = () => {
    storage.removeItem('authToken');
    storage.removeItem('authUser');

    // Ao setar para nulo, o Router detecta a mudança e redireciona para o /login na hora
    setUser(null);
  };

  // W-04: Verifica localmente se o token JWT ainda é válido (campo `exp`)
  // Evita restaurar o estado com um token já vencido antes do backend rejeitar.
  const isTokenExpired = (token: string): boolean => {
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return true;
      // Decodifica Base64Url → JSON
      const decoded = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
      // `exp` é em segundos (Unix timestamp); Date.now() em milissegundos
      return typeof decoded.exp === 'number' && Date.now() >= decoded.exp * 1000;
    } catch {
      // Token malformado → trata como expirado por segurança (fail-secure)
      return true;
    }
  };

  useEffect(() => {
    // Função para restaurar a sessão ao recarregar a página
    const recoverSession = () => {
      const storedToken = storage.getItem('authToken');
      const storedUser = storage.getItem('authUser');

      if (storedToken && storedUser) {
        // W-04: Valida a expiração ANTES de restaurar o estado
        if (isTokenExpired(storedToken)) {
          if (import.meta.env.DEV) {
            console.info('[AuthContext] Token expirado detectado localmente. Encerrando sessão.');
          }
          signOut();
          setLoading(false);
          return;
        }

        try {
          const parsedUser = JSON.parse(storedUser) as User;

          // 1. Restaura o estado (o interceptor da api.ts fará o resto)
          setUser(parsedUser);

        } catch (error) {
          // 🔒 007: console.error só em DEV — não vazamos stack traces em produção
          if (import.meta.env.DEV) {
            console.error("Sessão inválida encontrada. Limpando dados.", error);
          }
          signOut();
        }
      }

      setLoading(false);
    };

    recoverSession();

    // --- Listener para o evento de erro 401 disparado pela API ---
    const handleUnauthorized = () => {
      signOut();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    // Cleanup do listener
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = (data: { token: string; user: User }) => {
    // 1. Persistência segura em sessionStorage
    storage.setItem('authToken', data.token);
    storage.setItem('authUser', JSON.stringify(data.user));

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
