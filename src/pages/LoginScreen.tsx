import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from 'sonner';
import { Truck, Mail, Lock, QrCode, ArrowRight } from 'lucide-react';

// --- SCHEMA DE VALIDAÇÃO (Email/Senha) ---
const loginSchema = z.object({
  email: z.string().min(1, "Email obrigatório").email("Formato de email inválido"),
  password: z.string().min(1, "Digite sua senha")
});

type LoginFormValues = z.input<typeof loginSchema>;

export function LoginScreen() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Estado para alternar entre "Email" e "QR Code"
  const [mode, setMode] = useState<'CREDENTIALS' | 'QR'>('CREDENTIALS');
  const [qrTokenManual, setQrTokenManual] = useState('');
  const [loading, setLoading] = useState(false);

  // Hook Form para Email/Senha
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  // 1. Redirecionar se já logado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // 2. Lógica Magic Token (URL)
  useEffect(() => {
    const magicToken = searchParams.get('magicToken');
    if (magicToken) {
      handleTokenLogin(magicToken);
    }
  }, [searchParams]);

  // --- FUNÇÕES DE LOGIN ---

  // Login por Token (QR Code ou Link)
  const handleTokenLogin = async (token: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login-token', { loginToken: token });
      login(response.data);
      toast.success(`Bem-vindo, ${response.data.user.nome.split(' ')[0]}!`);
      navigate('/admin');
    } catch (err) {
      console.error("Erro token:", err);
      toast.error('Token inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  // Login por Credenciais (Formulário)
  const onSubmitCredentials = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      login(response.data);
      toast.success('Bem-vindo de volta!');
      navigate('/admin');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Credenciais inválidas.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Login Manual por QR (Input de texto)
  const handleManualQrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrTokenManual.trim()) return toast.warning('Digite o código do token.');
    handleTokenLogin(qrTokenManual);
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans">

      {/* --- LADO ESQUERDO: IMAGEM FROTA --- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        {/* Imagem de Fundo */}
        <img
          src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=2070&auto=format&fit=crop"
          alt="Frota de Caminhões"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />

        {/* Overlay Gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>

        {/* Conteúdo Sobre a Imagem */}
        <div className="relative z-10 flex flex-col justify-end p-16 h-full text-white">
          <div className="mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/30 text-white">
              <Truck className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Gestão Inteligente <br />de Frota e Logística</h1>
            <p className="text-slate-300 text-lg max-w-md leading-relaxed">
              Controle abastecimentos, manutenções e jornadas em tempo real. Simplifique a operação da sua transportadora.
            </p>
          </div>

          {/* Indicadores Decorativos */}
          <div className="flex gap-2">
            <div className="h-1.5 w-12 bg-primary rounded-full"></div>
            <div className="h-1.5 w-12 bg-white/20 rounded-full"></div>
            <div className="h-1.5 w-12 bg-white/20 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* --- LADO DIREITO: FORMULÁRIO --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-gray-100">

          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Acesse sua conta</h2>
            <p className="text-sm text-gray-500 mt-1">Bem-vindo ao painel Klin Frota</p>
          </div>

          {/* Abas de Navegação (Senha vs QR) */}
          <div className="grid grid-cols-2 gap-1 p-1.5 bg-gray-100 rounded-xl border border-gray-200">
            <button
              onClick={() => setMode('CREDENTIALS')}
              className={`py-2.5 text-sm font-semibold rounded-lg transition-all ${mode === 'CREDENTIALS'
                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
            >
              Email e Senha
            </button>
            <button
              onClick={() => setMode('QR')}
              className={`py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'QR'
                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
            >
              <QrCode className="w-4 h-4" />
              Token ID
            </button>
          </div>

          {/* FORMULÁRIO 1: E-MAIL E SENHA */}
          {mode === 'CREDENTIALS' && (
            <form onSubmit={handleSubmit(onSubmitCredentials)} className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
              <Input
                label="E-mail corporativo"
                type="email"
                placeholder="seunome@klin.com.br"
                {...register('email')}
                error={errors.email?.message}
                icon={<Mail className="w-5 h-5 text-gray-400" />}
                className="bg-gray-50 border-gray-200 focus:bg-white h-11"
                disabled={loading}
              />

              <div className="space-y-1">
                <Input
                  label="Senha"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  error={errors.password?.message}
                  icon={<Lock className="w-5 h-5 text-gray-400" />}
                  className="bg-gray-50 border-gray-200 focus:bg-white h-11"
                  disabled={loading}
                />
                <div className="flex justify-end">
                  <button type="button" className="text-xs font-medium text-primary hover:text-primary/80 hover:underline transition-colors" tabIndex={-1}>
                    Esqueceu a senha?
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform"
                isLoading={loading}
              >
                Entrar no Sistema <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>
          )}

          {/* FORMULÁRIO 2: TOKEN QR CODE */}
          {mode === 'QR' && (
            <form onSubmit={handleManualQrSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center py-6 px-6 bg-blue-50/50 rounded-2xl border border-blue-100 dashed">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600">
                  <QrCode className="w-6 h-6" />
                </div>
                <p className="text-sm text-blue-800 font-medium">
                  Use o app para escanear
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Ou digite o código do seu crachá abaixo para liberar o acesso.
                </p>
              </div>

              <Input
                label="Código do Crachá (Token)"
                placeholder="Cole o token aqui..."
                value={qrTokenManual}
                onChange={(e) => setQrTokenManual(e.target.value)}
                icon={<Lock className="w-5 h-5 text-gray-400" />}
                className="font-mono text-sm bg-gray-50 border-gray-200 focus:bg-white h-11"
                disabled={loading}
              />

              <Button
                type="submit"
                className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform"
                isLoading={loading}
              >
                Validar Token
              </Button>
            </form>
          )}

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-bold"><span className="bg-white px-2 text-gray-400">Ambiente Seguro</span></div>
          </div>

          <div className="flex justify-center items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
            <span className="font-bold text-gray-400 text-xs">KLIN Engenharia © {new Date().getFullYear()}</span>
          </div>

        </div>
      </div>
    </div>
  );
}