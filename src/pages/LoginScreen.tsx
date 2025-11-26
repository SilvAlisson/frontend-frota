import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

  // Hook para ler parâmetros da URL
  const [searchParams] = useSearchParams();
  const magicToken = searchParams.get('magicToken');

  // Efeito: Se tiver token na URL, tenta logar sozinho
  useEffect(() => {
    if (magicToken) {
      const realizarLoginPorToken = async () => {
        setLoading(true);
        setError('');

        try {
          // Chama a rota especial do backend para trocar o token curto pelo JWT
          const response = await api.post('/auth/login-token', {
            loginToken: magicToken
          });

          // Se sucesso, guarda a sessão e entra
          login(response.data);
          navigate('/');

        } catch (err: any) {
          console.error("Falha no login por QR Code:", err);
          setError('QR Code inválido ou expirado.');
          setLoading(false); // Libera a tela se falhar para tentar manual
        }
      };

      realizarLoginPorToken();
    }
  }, [magicToken, login, navigate]);

  // Login Manual (Email/Senha)
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
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">

      {/* Fundo Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-72 h-72 bg-blue-400/10 rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="w-full max-w-md px-6">

        {/* Cabeçalho da Tela */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-white rounded-2xl shadow-lg shadow-gray-200/50 mb-6">
            <img src="/logo.png" alt="Logo KLIN" className="h-12 w-auto object-contain" />
          </div>
          <h2 className="text-3xl font-bold text-text tracking-tight">
            Bem-vindo
          </h2>
          <p className="text-text-secondary mt-2 font-medium">
            Acesse o painel de gestão de frota
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-card shadow-card p-8 border border-gray-50 relative overflow-hidden">

          {/* Barra de progresso superior (visual) se estiver carregando */}
          {loading && (
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 overflow-hidden">
              <div className="h-full bg-primary animate-[loading_1s_ease-in-out_infinite]"></div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>

            {/* Estado de Carregamento do Token Mágico */}
            {magicToken && loading ? (
              <div className="text-center py-10 space-y-4">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-[3px] border-gray-200 border-t-primary"></div>
                <div>
                  <p className="text-primary font-bold text-lg animate-pulse">Autenticando acesso...</p>
                  <p className="text-xs text-gray-400 mt-1">Validando suas credenciais de segurança</p>
                </div>
              </div>
            ) : (
              /* Formulário Manual */
              <>
                <Input
                  label="Email Corporativo"
                  type="email"
                  placeholder="seu.nome@klin.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="py-3"
                />

                <div className="space-y-1">
                  <Input
                    label="Senha"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="py-3"
                  />
                  {/* Link de esqueceu a senha (decorativo por enquanto) */}
                  {/* <div className="text-right">
                        <a href="#" className="text-xs text-primary hover:underline font-medium">Esqueceu a senha?</a>
                      </div> */}
                </div>
              </>
            )}

            {/* Mensagem de Erro */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5">
                  <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Botão de Login Manual */}
            {!magicToken && (
              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                className="w-full py-3.5 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
              >
                {loading ? 'Entrando...' : 'Acessando o Painel'}
              </Button>
            )}

            {/* Botão para cancelar login automático se falhar */}
            {magicToken && !loading && error && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/login')}
                className="w-full py-3 border-gray-200 text-gray-600"
              >
                Voltar ao Login Manual
              </Button>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8 font-medium">
          &copy; {new Date().getFullYear()} KLIN. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}