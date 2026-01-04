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
  const loginTokenProcessed = useRef(false); // A nossa correção do Loop Infinito

  // Hook Form
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  // --- 1. ROTEAMENTO SEGURO ---
  const handleRedirect = useCallback((role: UserRole) => {
    const target = (role === 'ADMIN' || role === 'COORDENADOR') ? '/admin' : '/';
    navigate(target, { replace: true });
  }, [navigate]);

  // --- 2. LÓGICA DE LOGIN VIA URL (FIXED) ---
  useEffect(() => {
    if (!magicToken) return;
    if (loginTokenProcessed.current) return; // Bloqueia duplicação

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

  // --- 3. BLINDAGEM (Redireciona se já logado) ---
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

    // Simula o loading visual usando o estado do modo QR, ou poderíamos criar um state local
    // Aqui vou reusar isMagicLoggingIn momentaneamente para feedback visual full-screen ou local
    // Vamos usar um toast de loading para ser mais elegante no modo manual
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
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white space-y-6 animate-in fade-in duration-500">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-700 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold tracking-tight">Acessando Sistema...</h2>
          <p className="text-sm text-slate-400">Validando credenciais seguras</p>
        </div>
      </div>
    );
  }

  // --- UI: TELA DE LOGIN BONITA ---
  return (
    <div className="min-h-screen flex bg-white font-sans">

      {/* --- LADO ESQUERDO: IMAGEM FROTA --- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=2070&auto=format&fit=crop"
          alt="Frota de Caminhões"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>

        <div className="relative z-10 flex flex-col justify-end p-16 h-full text-white">
          <div className="mb-6">
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-900/30">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Gestão Inteligente <br />de Frota e Logística</h1>
            <p className="text-slate-300 text-lg max-w-md">
              Controle abastecimentos, manutenções e jornadas em tempo real.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="h-1 w-12 bg-emerald-500 rounded-full"></div>
            <div className="h-1 w-12 bg-white/20 rounded-full"></div>
            <div className="h-1 w-12 bg-white/20 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* --- LADO DIREITO: FORMULÁRIO --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-gray-100">

          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Acesse sua conta</h2>
            <p className="text-sm text-gray-500 mt-1">Bem-vindo ao painel Klin Frota</p>
          </div>

          {/* Abas de Navegação */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setMode('CREDENTIALS')}
              className={`py-2 text-sm font-medium rounded-lg transition-all ${mode === 'CREDENTIALS' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Email e Senha
            </button>
            <button
              onClick={() => setMode('QR')}
              className={`py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'QR' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <QrCode className="w-4 h-4" />
              Token ID
            </button>
          </div>

          {/* FORMULÁRIO 1: E-MAIL E SENHA (Com React Hook Form) */}
          {mode === 'CREDENTIALS' && (
            <form onSubmit={handleSubmit(onCredentialsSubmit)} className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
              <Input
                label="E-mail corporativo"
                type="email"
                placeholder="seunome@klin.com.br"
                {...register('email')}
                error={errors.email?.message}
                icon={<Mail className="w-5 h-5 text-gray-400" />}
                className="bg-gray-50 border-gray-200 focus:bg-white"
                disabled={isSubmitting}
              />

              <div className="space-y-1">
                <Input
                  label="Senha"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  error={errors.password?.message}
                  icon={<Lock className="w-5 h-5 text-gray-400" />}
                  className="bg-gray-50 border-gray-200 focus:bg-white"
                  disabled={isSubmitting}
                />
                <div className="flex justify-end">
                  <a href="#" className="text-xs font-medium text-emerald-600 hover:underline">Esqueceu a senha?</a>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full h-12 text-base shadow-lg shadow-emerald-500/20"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Entrando...' : (
                  <>Entrar no Sistema <ArrowRight className="ml-2 w-4 h-4" /></>
                )}
              </Button>
            </form>
          )}

          {/* FORMULÁRIO 2: TOKEN QR CODE (Manual) */}
          {mode === 'QR' && (
            <form onSubmit={onManualQrSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center py-4 px-6 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-700">
                  Para acessar via QR Code, aponte a câmera do celular ou digite o código do seu crachá abaixo.
                </p>
              </div>

              <Input
                label="Código do Crachá (Token)"
                placeholder="Cole o token aqui..."
                value={qrManualToken}
                onChange={(e) => setQrManualToken(e.target.value)}
                icon={<QrCode className="w-5 h-5 text-gray-400" />}
                className="font-mono text-xs bg-gray-50 border-gray-200 focus:bg-white"
              />

              <Button type="submit" className="w-full h-12 text-base shadow-lg shadow-primary/20">
                Validar Token
              </Button>
            </form>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">Sistema de Gestão de Frota</span></div>
          </div>

          <div className="flex justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all">
            <span className="font-bold text-gray-400 text-sm">KLIN ENGENHARIA E GESTÃO AMBIENTAL © {new Date().getFullYear()}</span>
          </div>

        </div>
      </div>
    </div>
  );
}