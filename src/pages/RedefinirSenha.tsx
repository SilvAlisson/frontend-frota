import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/Button';
import { Sun, Moon, KeyRound, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../components/ui/Tooltip';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authClient } from '../lib/auth-client';
import { toast } from 'sonner';
import { logger } from '../lib/logger';

const resetPasswordSchema = z.object({
  novaSenha: z.string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número'),
  confirmarSenha: z.string()
}).refine((data) => data.novaSenha === data.confirmarSenha, {
  message: 'As senhas não coincidem',
  path: ['confirmarSenha'],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export function RedefinirSenha() {
  const { theme, toggleTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema)
  });

  useEffect(() => {
    if (!token) {
      toast.error('Token inválido ou ausente. Solicite a redefinição de senha novamente.');
      navigate('/login');
    }
  }, [token, navigate]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) return;
    setIsSubmitting(true);
    
    try {
      const { error } = await authClient.resetPassword({
        newPassword: data.novaSenha,
        token: token,
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
      toast.success('Senha redefinida com sucesso!');
    } catch (err: any) {
      logger.error('Falha ao redefinir senha', err);
      const msg = err?.message || err?.error?.message;
      if (msg?.toLowerCase().includes('token') || msg?.toLowerCase().includes('invalid')) {
        toast.error('O link de redefinição expirou ou é inválido. Por favor, solicite novamente.');
      } else {
        toast.error('Ocorreu um erro ao tentar redefinir a senha.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex bg-background relative overflow-hidden text-text-main selection:bg-primary/20 selection:text-primary transition-colors duration-300">
      
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      {/* Toggle de Tema Absolute */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full bg-surface-hover/50 backdrop-blur-sm border border-border/50 text-text-muted hover:text-text-main w-10 h-10">
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="mr-4">Alternar Tema</TooltipContent>
        </Tooltip>
      </div>

      <div className="w-full flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto z-10">
        <div className="w-full max-w-[420px] space-y-8 glass-premium p-8 sm:p-10 rounded-[2.5rem] animate-enter shadow-2xl border border-border/40">

          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-primary/20">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-header font-black text-text-main tracking-tight">Redefinir Senha</h2>
            <p className="text-sm font-medium text-text-secondary mt-2">
              {!isSuccess 
                ? 'Digite sua nova senha abaixo' 
                : 'Sua senha foi alterada com sucesso!'}
            </p>
          </div>

          {!isSuccess ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2 text-left">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider ml-1">Nova Senha</label>
                <div className="relative group">
                  <input
                    type="password"
                    {...register('novaSenha')}
                    placeholder="Min. 8 caracteres"
                    className="w-full pl-4 pr-4 py-3.5 bg-surface border border-border/50 rounded-xl text-text-main text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                  />
                </div>
                {errors.novaSenha && (
                  <p className="text-xs text-error font-medium flex items-center gap-1 mt-1 ml-1">
                    <AlertTriangle className="w-3 h-3" /> {errors.novaSenha.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 text-left">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider ml-1">Confirmar Senha</label>
                <div className="relative group">
                  <input
                    type="password"
                    {...register('confirmarSenha')}
                    placeholder="Repita a nova senha"
                    className="w-full pl-4 pr-4 py-3.5 bg-surface border border-border/50 rounded-xl text-text-main text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                  />
                </div>
                {errors.confirmarSenha && (
                  <p className="text-xs text-error font-medium flex items-center gap-1 mt-1 ml-1">
                    <AlertTriangle className="w-3 h-3" /> {errors.confirmarSenha.message}
                  </p>
                )}
              </div>
              
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex gap-3 text-left">
                <KeyRound className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] font-medium text-text-secondary leading-snug">
                  A nova senha deve ter no mínimo 8 caracteres, conter pelo menos uma letra maiúscula e um número.
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="w-full py-6 text-sm font-black tracking-wide rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Nova Senha'}
              </Button>
            </form>
          ) : (
            <div className="flex flex-col items-center space-y-6 animate-enter">
              <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center border border-success/20">
                <CheckCircle2 className="w-10 h-10 text-success" />
              </div>
              <Button
                onClick={() => navigate('/login')}
                variant="primary"
                className="w-full py-6 text-sm font-black tracking-wide rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
              >
                Ir para o Login
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
