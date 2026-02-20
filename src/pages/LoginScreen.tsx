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
import { QrCode, Mail, Lock, ArrowRight, Truck, Loader2 } from 'lucide-react';
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
      toast.success('Acesso Autorizado. Bem-vindo de volta!');
    } catch (err: any) {
      toast.error('Credenciais inválidas.');
    }
  };

  // --- 5. SUBMIT LOGIN QR MANUAL ---
  const onManualQrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrManualToken.trim()) return toast.warning('Digite o token.');

    const toastId = toast.loading('A validar credenciais seguras...');

    try {
      const { data } = await api.post('/auth/login-token', { loginToken: qrManualToken });
      login(data);
      toast.dismiss(toastId);
      toast.success('Acesso Autorizado!');
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Token inválido ou expirado.');
    }
  };

  // --- UI: FULL SCREEN LOADER (Apenas para URL Magic Link) ---
  if (isMagicLoggingIn || authLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-text-main space-y-6 animate-in fade-in duration-500">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black tracking-tight uppercase">Aceder ao Sistema...</h2>
          <p className="text-sm font-bold text-text-muted animate-pulse">A validar túnel seguro</p>
        </div>
      </div>
    );
  }

  // --- UI: TELA DE LOGIN PREMIUM ---
  return (
    <div className="min-h-screen flex bg-background font-sans selection:bg-primary/20 selection:text-primary">

      {/* --- LADO ESQUERDO: IMAGEM FROTA (LIMPA E CINEMATOGRÁFICA) --- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-950 overflow-hidden">
        
        {/* Nova Imagem: Caminhão moderno em rodovia (unsplash), sem filtros estranhos */}
        <img
          src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=2075&auto=format&fit=crop"
          alt="Frota em movimento"
          className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105 animate-[kenburns_20s_ease-in-out_infinite_alternate]"
        />
        
        {/* Gradiente escuro para dar contraste ao texto, com um brilho super sutil da cor primária no canto inferior */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
        <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col justify-end p-16 h-full text-white w-full">
          <div className="mb-6 animate-in slide-in-from-left-8 duration-700 fade-in">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter mb-4 leading-tight">
              A Nova Era da <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">Gestão de Frota.</span>
            </h1>
            <p className="text-zinc-300 font-medium text-lg max-w-md leading-relaxed">
              Assuma o controlo total das suas operações. Abastecimentos, rotas e manutenção num único centro de comando inteligente.
            </p>
          </div>

          <div className="flex gap-2.5 animate-in fade-in duration-1000 delay-300">
            <div className="h-1.5 w-12 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--color-primary),0.8)]"></div>
            <div className="h-1.5 w-4 bg-white/20 rounded-full"></div>
            <div className="h-1.5 w-4 bg-white/20 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* --- LADO DIREITO: FORMULÁRIO --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-surface">
        <div className="w-full max-w-[420px] space-y-8 bg-surface sm:bg-background sm:p-10 sm:rounded-[2.5rem] sm:shadow-float sm:border border-border/60 animate-in fade-in slide-in-from-right-8 duration-700">

          <div className="text-center sm:text-left">
            <h2 className="text-3xl font-black text-text-main tracking-tight">Entrar</h2>
            <p className="text-sm font-bold text-text-secondary mt-2">Bem-vindo ao workspace <span className="text-primary uppercase tracking-wider text-[10px]">Klin Frota</span></p>
          </div>

          {/* Abas de Navegação (Segmented Control) */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-surface-hover/50 border border-border/60 rounded-2xl">
            <button
              onClick={() => setMode('CREDENTIALS')}
              className={`py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${mode === 'CREDENTIALS' 
                ? 'bg-surface text-primary shadow-sm ring-1 ring-border/60' 
                : 'text-text-secondary hover:text-text-main'
                }`}
            >
              Credenciais
            </button>
            <button
              onClick={() => setMode('QR')}
              className={`py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${mode === 'QR' 
                ? 'bg-surface text-primary shadow-sm ring-1 ring-border/60' 
                : 'text-text-secondary hover:text-text-main'
                }`}
            >
              <QrCode className="w-4 h-4" />
              Token / QR
            </button>
          </div>

          {/* FORMULÁRIO 1: E-MAIL E SENHA */}
          {mode === 'CREDENTIALS' && (
            <form onSubmit={handleSubmit(onCredentialsSubmit)} className="space-y-5 animate-in slide-in-from-left-4 fade-in duration-300">
              <Input
                label="Correio Eletrónico"
                type="email"
                placeholder="nome@klin.com.br"
                {...register('email')}
                error={errors.email?.message}
                icon={<Mail className="w-5 h-5 text-text-muted" />}
                disabled={isSubmitting}
                className="font-medium"
              />

              <div className="space-y-2">
                <Input
                  label="Palavra-passe"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  error={errors.password?.message}
                  icon={<Lock className="w-5 h-5 text-text-muted" />}
                  disabled={isSubmitting}
                  className="font-medium"
                  containerClassName="!mb-0"
                />
                <div className="flex justify-end">
                  <a href="#" className="text-xs font-bold text-text-secondary hover:text-primary transition-colors">Recuperar acesso?</a>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full h-14 text-base font-black shadow-button hover:shadow-float-primary mt-6 tracking-wide group"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'A Autenticar...' : (
                  <>Aceder à Plataforma <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
            </form>
          )}

          {/* FORMULÁRIO 2: TOKEN QR CODE */}
          {mode === 'QR' && (
            <form onSubmit={onManualQrSubmit} className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="text-center py-5 px-6 bg-primary/5 rounded-2xl border border-primary/20 shadow-inner">
                <p className="text-sm text-primary font-bold leading-relaxed">
                  Para aceder de forma rápida, aponte a câmara ou insira o código seguro do seu cartão.
                </p>
              </div>

              <Input
                label="Identificador do Cartão (Token)"
                placeholder="Insira o código aqui..."
                value={qrManualToken}
                onChange={(e) => setQrManualToken(e.target.value)}
                icon={<QrCode className="w-5 h-5 text-text-muted" />}
                className="font-mono text-sm tracking-widest font-bold"
                autoFocus
              />

              <Button type="submit" className="w-full h-14 text-base font-black shadow-button hover:shadow-float-primary group">
                 Validar Identidade <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
          )}

          {/* Rodapé Form */}
          <div className="pt-6 border-t border-border/60">
             <div className="flex justify-center items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
               <span className="font-black text-[10px] text-text-secondary uppercase tracking-[0.2em]">KLIN ENGENHARIA © {new Date().getFullYear()}</span>
             </div>
          </div>

        </div>
      </div>

    </div>
  );
}