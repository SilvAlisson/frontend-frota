import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from 'sonner';
import { QrCode, Mail, Lock, ArrowRight, Truck, Loader2, Sun, Moon } from 'lucide-react';
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
  const { theme, toggleTheme } = useTheme();

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
        // 🔒 007 FIX: Remove o token da URL imediatamente após uso (evita exposição no histórico)
        window.history.replaceState({}, document.title, target);

      } catch (err: any) {
        if (import.meta.env.DEV) {
          console.error("Login QR Falhou:", err);
        }
        
        // BIG BROTHER: Auditoria Anti-Fraude
        api.post('/logs', {
          level: 'FRAUD_ATTEMPT',
          source: 'FRONTEND',
          message: `Falha de Autenticação via QR/Link Mágico`,
          context: {
            tentativaToken: magicToken,
            erro: err.response?.data?.error || err.message,
            _navigator: { userAgent: navigator.userAgent }
          }
        }).catch(() => null);

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
      // BIG BROTHER: Auditoria Anti-Fraude
      api.post('/logs', {
        level: 'WARNING',
        source: 'FRONTEND',
        message: `Falha de Autenticação de Credenciais`,
        context: {
          emailTentado: data.email,
          _navigator: { userAgent: navigator.userAgent }
        }
      }).catch(() => null);

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
    } catch (err: any) {
      // BIG BROTHER: Auditoria Anti-Fraude
      api.post('/logs', {
        level: 'FRAUD_ATTEMPT',
        source: 'FRONTEND',
        message: `Falha de Autenticação via QR Manual`,
        context: {
          tentativaToken: qrManualToken,
          erro: err.response?.data?.error || err.message,
          _navigator: { userAgent: navigator.userAgent }
        }
      }).catch(() => null);

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
          <h2 className="text-xl font-black tracking-tight uppercase">Iniciando Gestão de Frota...</h2>
          <p className="text-sm font-bold text-text-muted animate-pulse">Validando código QR...</p>
        </div>
      </div>
    );
  }

  // --- UI: TELA DE LOGIN PREMIUM ---
  return (
    <div className="min-h-screen flex bg-background font-sans selection:bg-primary/20 selection:text-primary transition-colors duration-500 overflow-hidden">
      
      {/* --- BOTÃO DE TEMA FLUTUANTE (TOP RIGHT) --- */}
      <button 
        onClick={toggleTheme}
        className="fixed top-6 right-6 z-50 p-3 rounded-2xl glass-premium text-text-main hover:text-primary active:scale-95 btn-tactile"
        title={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
      >
        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>

      {/* --- LADO ESQUERDO: IMAGEM FROTA (LIMPA E CINEMATOGRÁFICA) --- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 overflow-hidden">

        {/* Imagem de caminhão em blend mode suave */}
        <img
          src="https://plus.unsplash.com/premium_photo-1661935334659-a4f95e515c3b?q=80&w=861&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Caminhão pesado em operação"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 grayscale"
        />

        {/* Gradiente Mesh Sutil (Configurado para o tema) */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/80 to-transparent"></div>
        <div className="absolute -top-[30%] -right-[10%] w-[100%] h-[100%] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>

        {/* Brilho da marca (Azul Klin Vivo) */}
        <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col justify-end p-16 h-full text-white w-full">
          <div className="mb-6 animate-enter fade-in">
            <div className="w-16 h-16 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center justify-center mb-8 shadow-float">
              <Truck className="w-8 h-8 text-white/90" />
            </div>
            <h1 className="text-5xl font-header font-black tracking-tighter mb-4 leading-tight drop-shadow-md">
              A Nova Era da <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-soft to-primary">Gestão de Frota.</span>
            </h1>
            <p className="text-zinc-400 font-medium text-lg max-w-md leading-relaxed">
              Centralizando o controle completo das <strong>Operações</strong>, <strong>Abastecimentos</strong> e <strong>Manutenções</strong> em um único centro de comando inteligente.
            </p>
          </div>

          <div className="flex gap-2.5 animate-enter delay-300">
            <div className="h-1.5 w-12 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--color-primary),0.6)]"></div>
            <div className="h-1.5 w-4 bg-white/10 rounded-full"></div>
            <div className="h-1.5 w-4 bg-white/10 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* --- LADO DIREITO: FORMULÁRIO --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        {/* Fundo sutil Mesh para o lado direito também */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 pointer-events-none -z-10"></div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-[420px] space-y-8 glass-premium p-8 sm:p-10 rounded-[2.5rem] animate-enter">

          <div className="text-center sm:text-left">
            <h2 className="text-4xl font-header font-black text-text-main tracking-tight">Frota KLIN</h2>
            <p className="text-sm font-medium text-text-secondary mt-1.5">Acesso ao Workspace Seguro</p>
          </div>

          {/* Abas de Navegação (Segmented Control) */}
          <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-surface-hover/50 border border-border/60 rounded-2xl">
            <button
              onClick={() => setMode('CREDENTIALS')}
              className={`py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${mode === 'CREDENTIALS'
                ? 'bg-surface text-primary shadow-sm border border-border/40'
                : 'text-text-secondary hover:text-text-main hover:bg-surface/50'
                }`}
            >
              Credenciais
            </button>
            <button
              onClick={() => setMode('QR')}
              className={`py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${mode === 'QR'
                ? 'bg-surface text-primary shadow-sm border border-border/40'
                : 'text-text-secondary hover:text-text-main hover:bg-surface/50'
                }`}
            >
              <QrCode className="w-4 h-4" />
              Token / QR
            </button>
          </div>

          {/* FORMULÁRIO 1: E-MAIL E SENHA */}
          {mode === 'CREDENTIALS' && (
            <form onSubmit={handleSubmit(onCredentialsSubmit)} className="space-y-5 animate-enter">
              <Input
                label="E-mail Corporativo"
                type="email"
                placeholder="nome@klinambiental.com.br"
                {...register('email')}
                error={errors.email?.message}
                icon={<Mail className="w-5 h-5 text-text-muted" />}
                disabled={isSubmitting}
                className="font-bold bg-surface/40 backdrop-blur-sm border-border/40 focus:bg-surface/60 transition-all rounded-xl"
              />

              <div className="space-y-2">
                <Input
                  label="Senha de Acesso"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  error={errors.password?.message}
                  icon={<Lock className="w-5 h-5 text-text-muted" />}
                  disabled={isSubmitting}
                  className="font-bold bg-surface/40 backdrop-blur-sm border-border/40 focus:bg-surface/60 transition-all rounded-xl"
                  containerClassName="!mb-0"
                  onFocus={() => {
                    // 🚀 PERFORMANCE: Smart Prefetching
                    import('../layouts/AdminLayout' /* webpackPrefetch: true */).catch(() => {});
                    import('../components/DashboardRelatorios' /* webpackPrefetch: true */).catch(() => {});
                  }}
                  onMouseEnter={() => {
                    // Antecipação do movimento do mouse
                    import('../components/DashboardRelatorios').catch(() => {});
                  }}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/esqueceu-senha')}
                    className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-colors italic"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full h-14 text-sm font-black btn-tactile mt-6 tracking-[0.1em] uppercase group rounded-2xl"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'A Autenticar...' : (
                  <>Validar Acesso <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
            </form>
          )}

          {/* FORMULÁRIO 2: TOKEN QR CODE */}
          {mode === 'QR' && (
            <form onSubmit={onManualQrSubmit} className="space-y-6 animate-enter">
              <div className="text-center py-5 px-6 bg-primary/5 rounded-2xl border border-primary/10 shadow-inner">
                <p className="text-[11px] text-primary font-black uppercase tracking-widest leading-relaxed">
                  Utilize o terminal seguro para validar o seu crachá de identificação.
                </p>
              </div>

              <Input
                label="Identificador Seguro (Token)"
                placeholder="Insira o código aqui..."
                value={qrManualToken}
                onChange={(e) => setQrManualToken(e.target.value)}
                icon={<QrCode className="w-5 h-5 text-text-muted" />}
                className="font-mono text-sm tracking-widest font-bold bg-surface/40 border-border/40 text-center rounded-xl"
                autoFocus
              />

              <Button type="submit" variant="secondary" className="w-full h-14 text-sm font-black btn-tactile group border-border/60 hover:border-primary/50 text-text-main shadow-sm rounded-2xl uppercase tracking-widest">
                Iniciar Sessão <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform text-primary" />
              </Button>
            </form>
          )}

          {/* Rodapé Form */}
          <div className="pt-6 border-t border-border/40">
            <div className="flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
              <span className="font-black text-[9px] text-text-muted uppercase tracking-[0.3em]">KLIN ENGENHARIA AMBIENTAL</span>
              <span className="font-bold text-[8px] text-text-muted/60 uppercase tracking-[0.2em]">SISTEMA DE GESTÃO INTEGRADA © {new Date().getFullYear()}</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}


