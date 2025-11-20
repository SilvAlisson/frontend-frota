import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth(); // Função do nosso Contexto
  const navigate = useNavigate(); // Hook de navegação

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Agora usamos 'api' que já tem a URL base
      const response = await api.post('/auth/login', {
        email,
        password
      });
      
      // Atualiza o estado global e redireciona
      login(response.data);
      navigate('/'); 

    } catch (err: any) {
      if (err.response) {
        console.error('Falha no login:', err.response.data.error);
        setError(err.response.data.error || 'Credenciais inválidas.');
      } else {
        console.error('Erro de conexão:', err);
        setError('Não foi possível conectar ao servidor.');
      }
    } finally {
        setLoading(false);
    }
  };

  return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <img src="/logo.png" alt="Logo KLIN" className="w-40 mb-6" />
        
        <h2 className="text-2xl font-semibold text-primary mb-6">
          Gestão de Frota
        </h2>
        
        <form
          className="bg-surface shadow-md rounded-lg px-8 pt-8 pb-8 mb-4 w-full max-w-sm space-y-5"
          onSubmit={handleSubmit}
        >
          <Input
            label="Email"
            type="email"
            placeholder="seu.email@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <Input
            label="Senha"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-error text-center font-medium">
                {error}
              </p>
            </div>
          )}

          <div className="pt-2 flex items-center justify-center">
            <Button 
              type="submit" 
              variant="primary" 
              isLoading={loading}
              className="w-full"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </div>
        </form>
        
         <p className="text-center text-text-secondary text-xs mt-4">
            &copy;{new Date().getFullYear()} KLIN. Todos os direitos reservados.
         </p>
      </div>
  );
}