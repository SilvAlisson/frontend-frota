import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod'; // CORREÇÃO: Importação nomeada (Melhor performance)
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from 'sonner';

// --- SCHEMA ZOD V4 (Atualizado) ---
const loginSchema = z.object({
  // V4: z.email() top-level (mais limpo e performático)
  // Ele já valida que é string, que não é vazio e o formato
  email: z.email({ error: "Formato de email inválido" }),

  password: z.string({ error: "Digite sua senha" })
    .min(1, { message: "Digite sua senha" })
});

type LoginFormValues = z.input<typeof loginSchema>;

export function LoginScreen() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const magicToken = searchParams.get('magicToken');

  // Trava para evitar múltiplas tentativas de login no StrictMode do React
  const loginAttempted = useRef(false);

  // Estado local apenas para controlar o loading visual do Magic Token
  const [isMagicLoggingIn, setIsMagicLoggingIn] = useState(!!magicToken);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  // --- LOGIN VIA QR CODE (MAGIC TOKEN) ---
  useEffect(() => {
    // Só executa se tiver token e se ainda não tiver tentado (trava useRef)
    if (magicToken && !loginAttempted.current) {
      loginAttempted.current = true; // Marca como executado imediatamente

      const realizarLoginPorToken = async () => {
        setIsMagicLoggingIn(true);
        try {
          const response = await api.post('/auth/login-token', { loginToken: magicToken });
          login(response.data);
          toast.success(`Bem-vindo, ${response.data.user.nome.split(' ')[0]}!`);
          navigate('/', { replace: true });
        } catch (err) {
          console.error("Falha no login por QR Code:", err);
          toast.error('O código de acesso expirou ou é inválido.');
          // Remove o token da URL para mostrar o form de login normal
          navigate('/login', { replace: true });
          setIsMagicLoggingIn(false);
        }
      };

      realizarLoginPorToken();
    }
  }, [magicToken, login, navigate]);

  // --- LOGIN MANUAL ---
  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await api.post('/auth/login', data);
      login(response.data);
      toast.success('Login realizado com sucesso!');
      navigate('/', { replace: true });
    } catch (err: any) {
      if (err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error('Erro de conexão. Tente novamente.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">

      {/* Fundo Decorativo (Blob Animation) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl opacity-70 animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="w-full max-w-md px-6 animate-in fade-in zoom-in-95 duration-500">

        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-white rounded-2xl shadow-lg shadow-gray-200/50 mb-6 ring-1 ring-gray-100">
            <img src="/logo.png" alt="Logo KLIN" className="h-12 w-auto object-contain" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            Bem-vindo
          </h2>
          <p className="text-gray-500 mt-2 font-medium">
            Acesse o painel de gestão de frota
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/40 p-8 border border-gray-100 relative overflow-hidden">

          {/* Barra de Carregamento Superior */}
          {(isSubmitting || isMagicLoggingIn) && (
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 overflow-hidden">
              <div className="h-full bg-primary w-1/3 animate-[loading_1s_ease-in-out_infinite]"></div>
            </div>
          )}

          {isMagicLoggingIn ? (
            /* Estado de Login via Token */
            <div className="text-center py-12 space-y-5">
              <div className="relative inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-100 border-t-primary"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-primary font-bold text-lg animate-pulse">Validando Acesso...</p>
                <p className="text-xs text-gray-400">Verificando credenciais de segurança</p>
              </div>
            </div>
          ) : (
            /* Formulário Manual */
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <Input
                label="Email Corporativo"
                type="email"
                placeholder="seu.nome@klin.com.br"
                {...register('email')}
                error={errors.email?.message}
                disabled={isSubmitting}
                autoFocus
                className="py-3"
              />

              <div className="space-y-1">
                <Input
                  label="Senha"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  error={errors.password?.message}
                  disabled={isSubmitting}
                  className="py-3"
                />

                <div className="text-right pt-1">
                  <button
                    type="button"
                    onClick={() => toast.info("Entre em contato com o gestor da frota para redefinir sua senha.")}
                    className="text-xs text-primary hover:text-primary-hover font-semibold transition-colors"
                    disabled={isSubmitting}
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                className="w-full py-3.5 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all mt-2"
              >
                {isSubmitting ? 'Entrando...' : 'Acessar Painel'}
              </Button>
            </form>
          )}

        </div>

        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-gray-400 font-medium">
            &copy; {new Date().getFullYear()} KLIN Frota Inteligente.
          </p>
          <p className="text-[10px] text-gray-300 uppercase tracking-widest">
            Sistema de Gestão de Frota v 2.0
          </p>
        </div>

      </div>
    </div>
  );
}