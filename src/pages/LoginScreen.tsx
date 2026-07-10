import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/Button';
import { Truck, Sun, Moon, QrCode } from 'lucide-react';
import { useLogin } from '../hooks/useLogin';
import { useWebAuthn } from '../hooks/useWebAuthn';
import { usePasskeyGuard } from '../hooks/usePasskeyGuard';
import { useAuth } from '../contexts/AuthContext';
import { LockScreen } from '../components/LockScreen';
import { LoginFormCredentials, type LoginFormValues } from '../components/forms/FormLogin/LoginFormCredentials';
import { LoginFormQR } from '../components/forms/FormLogin/LoginFormQR';
import { Skeleton } from '../components/ui/Skeleton';
import { toast } from 'sonner';
import { logger } from '../lib/logger';

export function LoginScreen() {
  const { theme, toggleTheme } = useTheme();
  const { login } = useAuth();
  const { loginWithDevice, isAuthenticating, isWebAuthnSupported } = useWebAuthn();
  const { shouldShowLockScreen } = usePasskeyGuard();

  // Custom Hook com a lógica isolada (Single Responsibility)
  const { isMagicLoggingIn, authLoading, loginWithCredentials, loginWithManualQr } = useLogin();

  // Estado visual
  const [mode, setMode] = useState<'CREDENTIALS' | 'QR'>('CREDENTIALS');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [overrideLockScreen, setOverrideLockScreen] = useState(false);

  const onCredentialsSubmit = async (data: LoginFormValues) => {
    setIsSubmittingForm(true);
    try {
      await loginWithCredentials(data);
    } catch (err: unknown) {
      logger.apiError(err, 'Falha ao realizar login. Verifique suas credenciais.');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const onManualQrSubmit = async (token: string) => {
    setIsSubmittingForm(true);
    try {
      await loginWithManualQr(token);
    } catch (err: unknown) {
      logger.apiError(err, 'Falha ao realizar login com QR code.');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // 🔥 Recebe o e-mail do form
  const onBiometryClick = async (emailFromForm?: string) => {
    if (!isWebAuthnSupported) {
      toast.error('Seu navegador não suporta autenticação biométrica.');
      return;
    }
    
    await loginWithDevice((token, user) => {
      login();
    }, typeof emailFromForm === 'string' ? emailFromForm : undefined); 
  };

  // --- UI: LOCK SCREEN NATIVA (server-side, não localStorage) ---
  if (shouldShowLockScreen && !overrideLockScreen) {
    return (
      <LockScreen
        isAuthenticating={isAuthenticating}
        // Quando for na lockscreen ele puxará o e-mail do localStorage perfeitamente
        onUnlock={() => onBiometryClick()} 
        onUsePassword={() => setOverrideLockScreen(true)}
      />
    );
  }

  // --- UI: SKELETON LOADER (Apenas para URL Magic Link) ---
  if (isMagicLoggingIn || authLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-text-main space-y-6 animate-in fade-in duration-500">
        <Skeleton className="w-16 h-16 rounded-2xl" />
        <div className="text-center space-y-3 w-64 flex flex-col items-center">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>
      </div>
    );
  }

  // --- UI: TELA DE LOGIN PREMIUM ---
  return (
    <div className="min-h-screen flex bg-background font-sans selection:bg-primary/20 selection:text-primary transition-colors duration-500 overflow-hidden">
      
      {/* --- BOTÃO DE TEMA FLUTUANTE (TOP RIGHT) --- */}
      <Button 
        variant="glass"
        size="icon"
        onClick={toggleTheme}
        className="fixed top-6 right-6 z-50 rounded-2xl text-text-main hover:text-primary"
        title={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
      >
        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </Button>

      {/* --- LADO ESQUERDO: IMAGEM FROTA (LIMPA E CINEMATOGRÁFICA) --- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 overflow-hidden">
        <img
          src="/login-bg.jpg"
          alt="Caminhão pesado em operação"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/80 to-transparent"></div>
        <div className="absolute -top-[30%] -right-[10%] w-[100%] h-[100%] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
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
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 pointer-events-none -z-10"></div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-[420px] space-y-8 glass-premium p-8 sm:p-10 rounded-[2.5rem] animate-enter">

          <div className="text-center sm:text-left">
            <h2 className="text-4xl font-header font-black text-text-main tracking-tight">Frota KLIN</h2>
            <p className="text-sm font-medium text-text-secondary mt-1.5">Acesso ao Workspace Seguro</p>
          </div>

          {/* Abas de Navegação (Segmented Control com Acessibilidade) */}
          <div role="tablist" aria-label="Modo de autenticação" className="grid grid-cols-2 gap-1.5 p-1.5 bg-surface-hover/50 border border-border/60 rounded-2xl">
            <Button
              variant={mode === 'CREDENTIALS' ? 'primary' : 'ghost'}
              role="tab"
              aria-selected={mode === 'CREDENTIALS'}
              onClick={() => setMode('CREDENTIALS')}
              className={`py-2.5 h-auto min-h-[40px] text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${mode === 'CREDENTIALS'
                ? 'shadow-sm border border-border/40'
                : 'text-text-secondary hover:text-text-main'
                }`}
            >
              Credenciais
            </Button>
            <Button
              variant={mode === 'QR' ? 'primary' : 'ghost'}
              role="tab"
              aria-selected={mode === 'QR'}
              onClick={() => setMode('QR')}
              className={`py-2.5 h-auto min-h-[40px] text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${mode === 'QR'
                ? 'shadow-sm border border-border/40'
                : 'text-text-secondary hover:text-text-main'
                }`}
            >
              <QrCode className="w-4 h-4" />
              Token / QR
            </Button>
          </div>

          {mode === 'CREDENTIALS' && (
            <LoginFormCredentials 
              onSubmit={onCredentialsSubmit}
              onBiometryClick={onBiometryClick}
              isSubmittingAuth={isSubmittingForm}
              isAuthenticatingBiometry={isAuthenticating}
            />
          )}

          {mode === 'QR' && (
            <LoginFormQR 
              onSubmit={onManualQrSubmit}
              isSubmitting={isSubmittingForm}
            />
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
