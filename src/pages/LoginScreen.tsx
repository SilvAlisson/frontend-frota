import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from 'sonner';
import { Truck, Mail, Lock, ArrowRight } from 'lucide-react';
import type { UserRole } from '../types';

const loginSchema = z.object({
  email: z.string().min(1, "Email obrigatório").email("Formato de email inválido"),
  password: z.string().min(1, "Digite sua senha")
});

type LoginFormValues = z.input<typeof loginSchema>;

export function LoginScreen() {
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
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

  // --- REDIRECIONAMENTO CENTRALIZADO E MEMOIZADO ---
  const redirecionarPorRole = useCallback((role: UserRole) => {
    // Blindagem: Se a role for ADMIN ou COORDENADOR, vai para /admin
    // Caso contrário (OPERADOR, RH, ENCARREGADO), vai para a raiz onde o RootDashboardRouter decide
    if (role === 'ADMIN' || role === 'COORDENADOR') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // 1. BLINDAGEM DE PERSISTÊNCIA & FLUXO PÓS-LOGIN
  // Este Effect é o único responsável por tirar o usuário da tela de login se ele estiver autenticado
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role) {
      redirecionarPorRole(user.role);
    }
  }, [isAuthenticated, user, authLoading, redirecionarPorRole]);

  // 2. LÓGICA MAGIC TOKEN (QR CODE)
  useEffect(() => {
    if (magicToken && !loginAttempted.current && !isAuthenticated && !authLoading) {
      loginAttempted.current = true;

      const realizarLoginPorToken = async () => {
        setIsMagicLoggingIn(true);
        try {
          const response = await api.post('/auth/login-token', { loginToken: magicToken });

          // 1. Atualiza o Contexto. 
          // O useEffect de blindagem acima cuidará do redirecionamento assim que o estado propagar.
          login(response.data);

          toast.success(`Bem-vindo, ${response.data.user.nome.split(' ')[0]}!`);
        } catch (err) {
          console.error("Erro token:", err);
          toast.error('Código de acesso inválido ou expirado.');
          setIsMagicLoggingIn(false);
          // Limpa a URL para evitar loops de erro
          navigate('/login', { replace: true });
        }
      };

      realizarLoginPorToken();
    }
  }, [magicToken, login, navigate, isAuthenticated, authLoading]);

  // 3. LOGIN MANUAL
  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await api.post('/auth/login', data);

      // Apenas faz o login. A blindagem do useEffect redireciona.
      login(response.data);
      toast.success('Bem-vindo de volta!');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Credenciais inválidas.';
      toast.error(msg);
    }
  };

  // Se o AuthContext ainda está lendo o localStorage, não renderiza nada para evitar "flicker"
  if (authLoading && !isMagicLoggingIn) return null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-900 font-sans">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-primary/40 z-10" />
        <img
          src="https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?q=80&w=2070&auto=format&fit=crop"
          alt="Frota Background"
          className="w-full h-full object-cover opacity-30 grayscale mix-blend-overlay"
        />
      </div>

      <div className="relative z-20 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
              <Truck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Klin Frota</h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">Gestão Inteligente & Operacional</p>
          </div>

          {isMagicLoggingIn ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/20 border-t-primary"></div>
              <div className="text-center">
                <p className="font-bold text-gray-900">Autenticando via QR Code...</p>
                <p className="text-xs text-gray-500">Validando token de segurança</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="E-mail Corporativo"
                type="email"
                placeholder="nome@klin.com.br"
                {...register('email')}
                error={errors.email?.message}
                icon={<Mail className="w-5 h-5 text-gray-400" />}
                className="h-11 bg-white border-gray-200 focus:border-primary rounded-input"
                disabled={isSubmitting}
              />
              <div className="space-y-1">
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  error={errors.password?.message}
                  icon={<Lock className="w-5 h-5 text-gray-400" />}
                  className="h-11 bg-white border-gray-200 focus:border-primary rounded-input"
                  disabled={isSubmitting}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                className="w-full h-11 text-base font-bold shadow-lg shadow-primary/25 mt-2 hover:-translate-y-0.5 transition-transform rounded-input"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Acessando...' : 'Entrar no Sistema'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>
          )}

          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
              KLIN ENGENHARIA &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}