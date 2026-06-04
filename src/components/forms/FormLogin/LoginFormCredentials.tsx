import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Mail, Lock, ArrowRight, Fingerprint } from 'lucide-react';
import { hapticError } from '../../../lib/haptics';

const loginSchema = z.object({
  email: z.string().min(1, "Email obrigatório").email("Formato inválido").transform(e => e.toLowerCase().trim()),
  password: z.string().min(1, "Digite sua senha")
});

export type LoginFormValues = z.input<typeof loginSchema>;

interface LoginFormCredentialsProps {
  onSubmit: (data: LoginFormValues) => Promise<void>;
  onBiometryClick: () => Promise<void>;
  isSubmittingAuth: boolean;
  isAuthenticatingBiometry: boolean;
}

export function LoginFormCredentials({
  onSubmit,
  onBiometryClick,
  isSubmittingAuth,
  isAuthenticatingBiometry
}: LoginFormCredentialsProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const onError = () => hapticError();

  const isBusy = isSubmittingAuth || isAuthenticatingBiometry;

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-5 animate-enter">
      <Input
        label="E-mail Corporativo"
        type="email"
        inputMode="email"
        autoComplete="email"
        enterKeyHint="next"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="nome@klinambiental.com.br"
        {...register('email')}
        error={errors.email?.message}
        icon={<Mail className="w-5 h-5 text-text-muted" />}
        disabled={isBusy}
        className="font-bold bg-surface/40 backdrop-blur-sm border-border/40 focus:bg-surface/60 transition-all rounded-xl"
      />

      <div className="space-y-2">
        <Input
          label="Senha de Acesso"
          type="password"
          autoComplete="current-password"
          enterKeyHint="done"
          placeholder="•••••••••"
          {...register('password')}
          error={errors.password?.message}
          icon={<Lock className="w-5 h-5 text-text-muted" />}
          disabled={isBusy}
          className="font-bold bg-surface/40 backdrop-blur-sm border-border/40 focus:bg-surface/60 transition-all rounded-xl"
          containerClassName="!mb-0"
          onFocus={() => {
            // Performance: Smart Prefetching
            import('../../../layouts/AdminLayout').catch(() => {});
            import('../../DashboardRelatorios').catch(() => {});
          }}
          onMouseEnter={() => {
            import('../../DashboardRelatorios').catch(() => {});
          }}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full h-14 text-sm font-black btn-tactile mt-6 tracking-[0.1em] uppercase group rounded-2xl"
        isLoading={isSubmittingAuth}
        disabled={isBusy}
      >
        {isSubmittingAuth ? 'A Autenticar...' : (
          <>Validar Acesso <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
        )}
      </Button>

      <div className="flex flex-col items-center pt-4 mt-6 border-t border-border/40">
        <span className="text-[10px] uppercase font-black text-text-muted/80 tracking-widest mb-4">
          OU ACESSE RAPIDAMENTE COM
        </span>
        
        <button
          type="button"
          onClick={onBiometryClick}
          disabled={isBusy}
          aria-label="Login com Biometria"
          className={`relative flex items-center justify-center w-20 h-20 rounded-full border-2 transition-all duration-300 shadow-sm overflow-hidden btn-tactile
            ${isAuthenticatingBiometry 
              ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.3)]' 
              : 'border-border/60 bg-surface hover:border-primary/50 hover:bg-primary/5 hover:shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.2)]'
            }`}
        >
          {isAuthenticatingBiometry && (
            <div className="absolute inset-0 border-[3px] border-primary rounded-full animate-ping opacity-20"></div>
          )}
          
          <Fingerprint 
            className={`w-9 h-9 transition-colors duration-300 ${
              isAuthenticatingBiometry ? 'text-primary animate-pulse' : 'text-text-secondary group-hover:text-primary'
            }`} 
            strokeWidth={1.5}
          />
        </button>
        
        <span className={`text-[11px] font-black uppercase tracking-widest mt-3 transition-colors ${
          isAuthenticatingBiometry ? 'text-primary animate-pulse' : 'text-text-muted'
        }`}>
          {isAuthenticatingBiometry ? 'Aguardando Leitura...' : 'Touch ID / Face ID'}
        </span>
      </div>
    </form>
  );
}
