import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'; // Importar useSearchParams
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Hook para ler parâmetros da URL (?magicToken=xyz)
  const [searchParams] = useSearchParams();
  const magicToken = searchParams.get('magicToken');

  // Efeito para Login Automático via QR Code
  useEffect(() => {
    if (magicToken) {
      const realizarLoginPorToken = async () => {
        setLoading(true);
        setError(''); // Limpa erros anteriores

        try {
          // Chama a rota especial do backend para trocar o token curto pelo JWT
          const response = await api.post('/auth/login-token', {
            loginToken: magicToken
          });

          // Se sucesso, o backend devolve { token: "JWT...", user: {...} }
          login(response.data);
          navigate('/'); // Redireciona para o Dashboard

        } catch (err: any) {
          console.error("Falha no login por QR Code:", err);
          setError('QR Code inválido ou expirado. Tente entrar manualmente.');
        } finally {
          setLoading(false);
        }
      };

      realizarLoginPorToken();
    }
  }, [magicToken, login, navigate]);


  // Login Manual (Email/Senha) - Mantém igual
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });
      login(response.data);
      navigate('/');
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data.error || 'Credenciais inválidas.');
      } else {
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
        {/* MUDANÇA VISUAL: Se estiver logando por Token, esconde os campos ou avisa */}
        {magicToken && loading ? (
          <div className="text-center py-8">
            <p className="text-primary font-bold text-lg animate-pulse">Autenticando via QR Code...</p>
            <p className="text-sm text-gray-500 mt-2">Aguarde um momento...</p>
          </div>
        ) : (
          <>
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
          </>
        )}

        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200">
            <p className="text-sm text-error text-center font-medium">
              {error}
            </p>
          </div>
        )}

        {!magicToken && (
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
        )}

        {/* Botão de voltar se o QR code falhar */}
        {magicToken && !loading && error && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/login')} // Remove o token da URL ao clicar
            className="w-full"
          >
            Tentar Login Manual
          </Button>
        )}
      </form>

      <p className="text-center text-text-secondary text-xs mt-4">
        &copy;{new Date().getFullYear()} KLIN. Todos os direitos reservados.
      </p>
    </div>
  );
}