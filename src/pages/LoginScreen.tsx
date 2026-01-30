import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from 'sonner';
import { QrCode, Mail, Lock, ArrowRight, Truck } from 'lucide-react';
import type { UserRole } from '../types';

// --- SCHEMAS DE VALIDAÇÃO (ZOD) ---
const loginSchema = z.object({
  email: z.string().min(1, "Email obrigatório").email("Formato inválido").transform(e => e.toLowerCase().trim()),
  password: z.string().min(1, "Digite sua senha")
});

type LoginFormValues = z.input<typeof loginSchema>;

export function LoginScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, logout, isAuthenticated, user, loading: authLoading } = useAuth();

  // Estado visual
  const [mode, setMode] = useState<'CREDENTIALS' | 'QR'>('CREDENTIALS');
  const [qrManualToken, setQrManualToken] = useState('');

  // Lógica do Login Mágico (URL)
  const magicToken = searchParams.get('magicToken');
  const [isMagicLoggingIn, setIsMagicLoggingIn] = useState(!!magicToken);
  const loginTokenProcessed = useRef(false);

  // Hook Form
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  // --- 1. ROTEAMENTO SEGURO ---
  const handleRedirect = useCallback((role: UserRole) => {
    const target = (role === 'ADMIN' || role === 'COORDENADOR') ? '/admin' : '/';
    navigate(target, { replace: true });
  }, [navigate]);

  // --- 2. LÓGICA DE LOGIN VIA URL ---
  useEffect(() => {
    if (!magicToken) return;
    if (loginTokenProcessed.current) return;

    loginTokenProcessed.current = true;
    setIsMagicLoggingIn(true);

    const processMagicLogin = async () => {
      try {
        if (isAuthenticated) {
          logout();
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        const { data } = await api.post('/auth/login-token', { loginToken: magicToken });

        login(data);
        toast.success(`Bem-vindo, ${data.user.nome.split(' ')[0]}!`);

        setIsMagicLoggingIn(false);
        const role = data.user.role;
        const target = (role === 'ADMIN' || role === 'COORDENADOR') ? '/admin' : '/';
        navigate(target, { replace: true });

      } catch (err: any) {
        console.error("Login QR Falhou:", err);
        toast.error(err.response?.data?.error || 'Crachá inválido.');
        setIsMagicLoggingIn(false);
        navigate('/login', { replace: true });
      }
    };

    processMagicLogin();
  }, [magicToken, navigate, isAuthenticated, login, logout]);

  // --- 3. BLINDAGEM ---
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role && !isMagicLoggingIn) {
      handleRedirect(user.role);
    }
  }, [isAuthenticated, user, authLoading, isMagicLoggingIn, handleRedirect]);

  // --- 4. SUBMIT LOGIN SENHA ---
  const onCredentialsSubmit = async (data: LoginFormValues) => {
    try {
      const response = await api.post('/auth/login', data);
      login(response.data);
      toast.success('Bem-vindo de volta!');
    } catch (err: any) {
      toast.error('Credenciais inválidas.');
    }
  };

  // --- 5. SUBMIT LOGIN QR MANUAL ---
  const onManualQrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrManualToken.trim()) return toast.warning('Digite o token.');

    const toastId = toast.loading('Validando token...');

    try {
      const { data } = await api.post('/auth/login-token', { loginToken: qrManualToken });
      login(data);
      toast.dismiss(toastId);
      toast.success('Token validado!');
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Token inválido.');
    }
  };

  // --- UI: FULL SCREEN LOADER (Apenas para URL Magic Link) ---
  if (isMagicLoggingIn || authLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-text-main space-y-6 animate-enter">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-border rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold tracking-tight">Acessando Sistema...</h2>
          <p className="text-sm text-text-secondary">Validando credenciais seguras</p>
        </div>
      </div>
    );
  }

  // --- UI: TELA DE LOGIN ---
  return (
    <div className="min-h-screen flex bg-background font-sans">

      {/* --- LADO ESQUERDO: IMAGEM FROTA --- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=2070&auto=format&fit=crop"
          alt="Frota de Caminhões"
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
        />
        {/* Gradiente usando a cor da marca */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/90 to-primary/60"></div>

        <div className="relative z-10 flex flex-col justify-end p-16 h-full text-white">
          <div className="mb-6 animate-enter">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center mb-6 shadow-float">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Gestão Inteligente <br />de Frota e Logística</h1>
            <p className="text-primary-foreground/80 text-lg max-w-md">
              Controle abastecimentos, manutenções e jornadas em tempo real.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="h-1 w-12 bg-white rounded-full"></div>
            <div className="h-1 w-12 bg-white/30 rounded-full"></div>
            <div className="h-1 w-12 bg-white/30 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* --- LADO DIREITO: FORMULÁRIO --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-surface">
        <div className="w-full max-w-md space-y-8 bg-background p-10 rounded-3xl shadow-float border border-border">

          <div className="text-center">
            <h2 className="text-2xl font-bold text-text-main">Acesse sua conta</h2>
            <p className="text-sm text-text-secondary mt-1">Bem-vindo ao painel Klin Frota</p>
          </div>

          {/* Abas de Navegação */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-surface border border-border rounded-xl">
            <button
              onClick={() => setMode('CREDENTIALS')}
              className={`py-2 text-sm font-medium rounded-lg transition-all ${mode === 'CREDENTIALS' 
                ? 'bg-background text-primary shadow-sm border border-border' 
                : 'text-text-muted hover:text-text-main'
                }`}
            >
              Email e Senha
            </button>
            <button
              onClick={() => setMode('QR')}
              className={`py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'QR' 
                ? 'bg-background text-primary shadow-sm border border-border' 
                : 'text-text-muted hover:text-text-main'
                }`}
            >
              <QrCode className="w-4 h-4" />
              Token ID
            </button>
          </div>

          {/* FORMULÁRIO 1: E-MAIL E SENHA */}
          {mode === 'CREDENTIALS' && (
            <form onSubmit={handleSubmit(onCredentialsSubmit)} className="space-y-5 animate-enter">
              <Input
                label="E-mail corporativo"
                type="email"
                placeholder="seunome@klin.com.br"
                {...register('email')}
                error={errors.email?.message}
                icon={<Mail className="w-5 h-5" />}
                disabled={isSubmitting}
              />

              <div className="space-y-1">
                <Input
                  label="Senha"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  error={errors.password?.message}
                  icon={<Lock className="w-5 h-5" />}
                  disabled={isSubmitting}
                />
                <div className="flex justify-end">
                  <a href="#" className="text-xs font-medium text-primary hover:underline">Esqueceu a senha?</a>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full h-12 text-base shadow-button hover:shadow-float"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Entrando...' : (
                  <>Entrar no Sistema <ArrowRight className="ml-2 w-4 h-4" /></>
                )}
              </Button>
            </form>
          )}

          {/* FORMULÁRIO 2: TOKEN QR CODE */}
          {mode === 'QR' && (
            <form onSubmit={onManualQrSubmit} className="space-y-6 animate-enter">
              <div className="text-center py-4 px-6 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-sm text-primary font-medium">
                  Para acessar via QR Code, aponte a câmera do celular ou digite o código do seu crachá abaixo.
                </p>
              </div>

              <Input
                label="Código do Crachá (Token)"
                placeholder="Cole o token aqui..."
                value={qrManualToken}
                onChange={(e) => setQrManualToken(e.target.value)}
                icon={<QrCode className="w-5 h-5" />}
                className="font-mono text-xs"
              />

              <Button type="submit" className="w-full h-12 text-base shadow-button hover:shadow-float">
                Validar Token
              </Button>
            </form>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-text-muted">Sistema de Gestão de Frota</span></div>
          </div>

          <div className="flex justify-center gap-4 opacity-50 transition-all hover:opacity-100">
            <span className="font-bold text-text-muted text-sm">KLIN ENGENHARIA © {new Date().getFullYear()}</span>
          </div>

        </div>
      </div>
    </div>
  );
}