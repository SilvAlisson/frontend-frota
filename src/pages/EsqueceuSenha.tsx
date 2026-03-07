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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface p-8 rounded-3xl shadow-xl border border-border/50 flex flex-col gap-6">
        
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-16 h-16 bg-sky-500/10 rounded-full flex items-center justify-center text-sky-500 mb-2">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-text-main tracking-tight">Recuperar Palavra-passe</h1>
          <p className="text-sm text-text-secondary font-medium">
            Introduza o e-mail associado à sua conta e enviar-lhe-emos instruções para redefinir a palavra-passe.
          </p>
        </div>

        {!enviado ? (
          <form onSubmit={handleEnviarEmail} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              disabled={loading}
              required
            />

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-bold shadow-md bg-primary hover:bg-primary-hover text-white" 
              isLoading={loading}
            >
              Enviar Link de Recuperação
            </Button>
          </form>
        ) : (
          <div className="bg-success/10 border border-success/20 p-4 rounded-xl text-center">
            <p className="text-success font-bold text-sm">
              Verifique a sua caixa de entrada (e a pasta de spam). Enviámos um link mágico para redefinir a sua senha.
            </p>
          </div>
        )}

        <div className="text-center mt-2">
          <button 
            onClick={() => navigate('/login')}
            className="text-sm font-bold text-text-muted hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para o Login
          </button>
        </div>

      </div>
    </div>
  );
}