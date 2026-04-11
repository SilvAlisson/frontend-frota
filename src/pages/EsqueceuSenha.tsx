import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'sonner';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function EsqueceuSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const navigate = useNavigate();

  const handleEnviarEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Por favor, introduza o seu e-mail.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setEnviado(true);
      toast.success('Se o e-mail existir, receberá um link em breve!');
    } catch (error) {
      toast.error('Ocorreu um erro ao tentar enviar o e-mail.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 transition-colors duration-500">
      <div className="w-full max-w-md glass-premium p-8 rounded-[2.5rem] flex flex-col gap-6 animate-enter">
        
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-2 border border-primary/20 shadow-sm">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-text-main tracking-tight italic uppercase">Recuperar Acesso</h1>
          <p className="text-sm text-text-secondary font-medium px-4">
            Introduza o e-mail associado à sua conta Klin e enviar-lhe-emos as instruções seguras.
          </p>
        </div>

        {!enviado ? (
          <form onSubmit={handleEnviarEmail} className="space-y-6">
            <Input
              label="E-mail Corporativo"
              type="email"
              placeholder="seu.email@klinambiental.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-5 h-5 text-text-muted" />}
              disabled={loading}
              required
              className="bg-surface/40 backdrop-blur-sm border-border/40 focus:bg-surface/60 transition-all rounded-xl font-bold"
            />

            <Button 
              type="submit" 
              className="w-full h-14 text-sm font-black btn-tactile bg-primary hover:bg-primary-hover text-white uppercase tracking-widest rounded-2xl shadow-lg" 
              isLoading={loading}
            >
              Enviar Link de Segurança
            </Button>
          </form>
        ) : (
          <div className="bg-success/5 border border-success/20 p-6 rounded-2xl text-center animate-in zoom-in-95 duration-500">
            <p className="text-success font-bold text-sm leading-relaxed">
              Verifique a sua caixa de entrada. Enviámos um link mágico para redefinir a sua senha de forma segura.
            </p>
          </div>
        )}

        <div className="text-center mt-2 border-t border-border/40 pt-6">
          <button 
            onClick={() => navigate('/login')}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto italic"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para o Login
          </button>
        </div>

      </div>
    </div>
  );
}


