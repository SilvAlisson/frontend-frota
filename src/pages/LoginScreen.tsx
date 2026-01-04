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
import { Truck, Mail, Lock, ArrowRight, RefreshCw } from 'lucide-react';
import type { UserRole } from '../types';

// Schema de validação robusto
const loginSchema = z.object({
  email: z.string()
    .min(1, "Email obrigatório")
    .email("Formato de email inválido")
    .transform(e => e.toLowerCase().trim()), // Sanitização automática
  password: z.string().min(1, "Digite sua senha")
});

type LoginFormValues = z.input<typeof loginSchema>;

export function LoginScreen() {
  const { login, logout, isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Captura o token e converte para booleano para controle de estado
  const magicToken = searchParams.get('magicToken');
  const [isMagicLoggingIn, setIsMagicLoggingIn] = useState(!!magicToken);

  // Ref para garantir que o login via token só dispara uma vez (React 18 Strict Mode safe)
  const loginTokenProcessed = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  // --- 1. ROTEAMENTO INTELIGENTE (MEMOIZADO) ---
  const handleRedirect = useCallback((role: UserRole) => {
    // Adiciona um pequeno delay para garantir que o contexto propagou
    const target = (role === 'ADMIN' || role === 'COORDENADOR') ? '/admin' : '/';
    navigate(target, { replace: true });
  }, [navigate]);

  // --- 2. LÓGICA DE LOGIN VIA QR CODE (PRIORIDADE MÁXIMA) ---
  useEffect(() => {
    // Se não tem token ou já processamos, ignora
    if (!magicToken || loginTokenProcessed.current) return;

    // Marca como processado para evitar loops
    loginTokenProcessed.current = true;
    setIsMagicLoggingIn(true);

    // Controller para cancelar a requisição se o componente desmontar
    const abortController = new AbortController();

    const processMagicLogin = async () => {
      try {
        // [SEGURANÇA CRÍTICA - BLINDAGEM DE SESSÃO]
        // Se já existe alguém logado no momento que abriu a página, fazemos logout.
        // Nota: Usamos o valor de isAuthenticated capturado no closure inicial.
        if (isAuthenticated) {
          console.log("Sessão anterior detectada. Realizando logout de segurança...");
          logout();
          // Pequena pausa para garantir limpeza do storage
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const { data } = await api.post('/auth/login-token',
          { loginToken: magicToken },
          { signal: abortController.signal }
        );

        // Atualiza o contexto global
        login(data);

        toast.success(`Crachá reconhecido! Bem-vindo, ${data.user.nome.split(' ')[0]}.`);

        // [UX] Limpa a URL para remover o token sensível visualmente
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('magicToken');
        setSearchParams(newParams, { replace: true });

        // [CORREÇÃO APLICADA]
        // Liberta a UI do loading para permitir que o useEffect de redirecionamento (abaixo) funcione
        setIsMagicLoggingIn(false);

      } catch (err: any) {
        if (err.name === 'CanceledError') return; // Requisição cancelada, ignora

        console.error("Falha no Login QR:", err);
        const errorMsg = err.response?.data?.error || 'Crachá inválido ou expirado.';

        toast.error(errorMsg, { duration: 5000 });

        // Em caso de erro, removemos o estado de loading para mostrar o form manual
        setIsMagicLoggingIn(false);
        // Limpa a URL também no erro para evitar loop
        navigate('/login', { replace: true });
      }
    };

    processMagicLogin();

    return () => abortController.abort();

    // [CORREÇÃO CRÍTICA]: 
    // Removemos 'isAuthenticated' e 'logout' das dependências.
    // Isso impede que o 'logout()' disparado dentro da função reinicie o useEffect e crie um loop infinito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [magicToken, login, navigate, searchParams, setSearchParams]);

  // --- 3. BLINDAGEM DE REDIRECIONAMENTO ---
  // Este efeito observa o sucesso do login e redireciona
  useEffect(() => {
    // Só redireciona se:
    // a) O Auth Context terminou de carregar
    // b) O usuário está autenticado
    // c) Temos a role do usuário
    // d) [IMPORTANTE] O processo de login mágico JÁ TERMINOU (isMagicLoggingIn === false)
    if (!authLoading && isAuthenticated && user?.role && !isMagicLoggingIn) {
      handleRedirect(user.role);
    }
  }, [isAuthenticated, user, authLoading, isMagicLoggingIn, handleRedirect]);

  // --- 4. LOGIN MANUAL ---
  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await api.post('/auth/login', data);
      login(response.data);
      toast.success('Login realizado com sucesso!');
      // O useEffect de blindagem (acima) cuidará do redirecionamento
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Verifique suas credenciais.';
      toast.error(msg);
    }
  };

  // --- 5. RENDERIZAÇÃO CONDICIONAL (LOADING STATE) ---
  if (authLoading || isMagicLoggingIn) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white space-y-6 animate-in fade-in duration-500">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-700 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold tracking-tight">
            {isMagicLoggingIn ? 'Lendo Crachá Digital...' : 'Iniciando Sistema...'}
          </h2>
          <p className="text-sm text-slate-400">
            {isMagicLoggingIn ? 'Validando credenciais de acesso' : 'Verificando sessão segura'}
          </p>
        </div>
      </div>
    );
  }

  // Tela de Login Normal
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

      <div className="relative z-20 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-500 slide-in-from-bottom-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 ring-1 ring-white/30">

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30 transform hover:scale-105 transition-transform duration-300">
              <Truck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Klin Frota</h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">Gestão Inteligente & Operacional</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="E-mail Corporativo"
              type="email"
              placeholder="seu.nome@klin.com.br"
              {...register('email')}
              error={errors.email?.message}
              icon={<Mail className="w-5 h-5 text-gray-400" />}
              className="h-11 bg-white border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all"
              disabled={isSubmitting}
              autoComplete="email"
            />

            <div className="space-y-1">
              <Input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                error={errors.password?.message}
                icon={<Lock className="w-5 h-5 text-gray-400" />}
                className="h-11 bg-white border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all"
                disabled={isSubmitting}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-12 text-base font-bold shadow-xl shadow-primary/20 mt-4 hover:-translate-y-0.5 active:translate-y-0 transition-all rounded-xl"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Acessando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Entrar no Sistema <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Sistema Seguro &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}