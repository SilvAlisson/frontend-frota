import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../services/api'; // Importamos a instância da API para configurar o header
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

  useEffect(() => {
    // Função para restaurar a sessão ao recarregar a página
    const recoverSession = () => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authUser');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser) as User;

          // 1. Restaura o estado
          setUser(parsedUser);

          // 2. Reconecta o token na instância do Axios imediatamente
          // Isso garante que requisições feitas logo após o load já tenham o token
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

        } catch (error) {
          console.error("Sessão inválida encontrada. Limpando dados.", error);
          // Se o JSON estiver corrompido, faz logout forçado para evitar erros
          signOut();
        }
      }

      setLoading(false);
    };

    recoverSession();
  }, []);

  // Função interna para limpar dados (usada no logout e no catch)
  const signOut = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');

    // Remove o header para evitar envio de token inválido
    delete api.defaults.headers.common['Authorization'];

    setUser(null);
  };

  const login = (data: { token: string; user: User }) => {
    // 1. Persistência
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('authUser', JSON.stringify(data.user));

    // 2. Configuração da API
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

    // 3. Atualização do Estado
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