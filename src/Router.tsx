import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { LoginScreen } from './pages/LoginScreen'; // Vamos extrair o Login para um arquivo separado depois ou manter no App por enquanto
import { Dashboard } from './pages/Dashboard'; // O mesmo para o Dashboard

// Componente para proteger rotas privadas
function PrivateRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-primary">Carregando...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

export function Router() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      
      <Route 
        path="/" 
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } 
      />
      
      {/* Você pode adicionar rotas específicas aqui futuramente, ex: */}
      {/* <Route path="/veiculos" element={<PrivateRoute><GestaoVeiculos /></PrivateRoute>} /> */}

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}