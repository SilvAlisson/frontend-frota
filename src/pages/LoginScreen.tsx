import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from 'sonner';

// --- SCHEMA ZOD ---
const loginSchema = z.object({
  email: z.string().min(1, "Email obrigatório").email("Formato inválido"),
  password: z.string().min(1, "Digite sua senha")
});

type LoginFormValues = z.input<typeof loginSchema>;

export function LoginScreen() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const magicToken = searchParams.get('magicToken');

  const loginAttempted = useRef(false);
  const [isMagicLoggingIn, setIsMagicLoggingIn] = useState(!!magicToken);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  // --- LÓGICA DE MAGIC TOKEN (QR CODE) ---
  useEffect(() => {
    if (magicToken && !loginAttempted.current) {
      loginAttempted.current = true;

      const realizarLoginPorToken = async () => {
        setIsMagicLoggingIn(true);
        try {
          const response = await api.post('/auth/login-token', { loginToken: magicToken });
          login(response.data);
          toast.success(`Bem-vindo, ${response.data.user.nome.split(' ')[0]}!`);
          navigate('/', { replace: true });
        } catch (err) {
          console.error("Erro token:", err);
          toast.error('Código de acesso inválido ou expirado.');
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
      toast.success('Acesso autorizado.');
      navigate('/', { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro de conexão com o servidor.';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white overflow-hidden">
      
      {/* LADO ESQUERDO: Formulário Clean */}
      <div className="flex flex-col justify-center items-center px-8 sm:px-12 lg:px-24 xl:px-32 relative animate-in fade-in slide-in-from-left-4 duration-700">
        
        <div className="w-full max-w-sm space-y-8">
          {/* Logo e Cabeçalho */}
          <div className="space-y-2">
            <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30 mb-6">
              KL
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Gestão de Frota
            </h1>
            <p className="text-gray-500">
              Entre com suas credenciais para acessar o painel de controle.
            </p>
          </div>

          {/* Estado de Carregamento (Magic Link) */}
          {isMagicLoggingIn ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900">Autenticando...</p>
                <p className="text-sm text-gray-500">Validando token de segurança</p>
              </div>
            </div>
          ) : (
            /* Formulário Principal */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-4">
                <Input
                  label="Email Corporativo"
                  type="email"
                  placeholder="nome@empresa.com.br"
                  {...register('email')}
                  error={errors.email?.message}
                  disabled={isSubmitting}
                  autoFocus
                  className="bg-gray-50 border-gray-200 focus:bg-white transition-all h-12"
                />
                
                <div className="space-y-1">
                  <Input
                    label="Senha"
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    error={errors.password?.message}
                    disabled={isSubmitting}
                    className="bg-gray-50 border-gray-200 focus:bg-white transition-all h-12"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => toast.info("Procure o gestor da frota para resetar sua senha.")}
                      className="text-xs font-medium text-primary hover:text-blue-700 transition-colors"
                      disabled={isSubmitting}
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                className="w-full h-12 text-base font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all transform hover:-translate-y-0.5"
              >
                {isSubmitting ? 'Verificando...' : 'Acessar Sistema'}
              </Button>
            </form>
          )}

          {/* Rodapé */}
          <div className="pt-8 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 font-mono">
              KLIN Frota v2.0 • Sistema Seguro
            </p>
          </div>
        </div>
      </div>

      {/* LADO DIREITO: Imagem e Atmosfera (Só aparece em telas grandes) */}
      <div className="hidden lg:block relative bg-gray-900 h-full overflow-hidden">
        {/* Imagem de Fundo (Logística/Frota) */}
        <img 
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop" 
          alt="Frota Logística" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        
        {/* Gradiente de Marca "Deep Ocean" */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/90 via-primary-800/50 to-primary-900/40"></div>

        {/* Elementos Flutuantes (Decoração Abstrata) */}
        <div className="absolute top-0 right-0 p-12 opacity-20">
          <svg width="404" height="404" fill="none" viewBox="0 0 404 404" aria-hidden="true">
            <defs>
              <pattern id="de316486-4a29-4312-bdfc-fbce2132a2c1" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="4" height="4" className="text-white" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="404" height="404" fill="url(#de316486-4a29-4312-bdfc-fbce2132a2c1)" />
          </svg>
        </div>

        {/* Conteúdo sobre a Imagem */}
        <div className="absolute bottom-0 left-0 p-12 w-full">
          <div className="glass-panel bg-white/10 backdrop-blur-md border-white/10 p-8 rounded-2xl max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-green-300 text-xs font-mono font-bold uppercase tracking-widest">Sistema Operacional</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 leading-tight">
              Inteligência Logística para sua Frota.
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed">
              Monitore custos, gerencie manutenções preventivas e acompanhe o desempenho dos seus motoristas em tempo real.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}