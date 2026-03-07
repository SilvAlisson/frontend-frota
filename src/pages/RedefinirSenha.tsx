import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'sonner';
import { Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); // Pega o token da URL
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Link de recuperação inválido ou ausente.');
    }
  }, [token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('As palavras-passes não coincidem!');
      return;
    }
    if (password.length < 6) {
      toast.warning('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setSucesso(true);
      toast.success('Palavra-passe alterada com sucesso!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao alterar palavra-passe. O link pode ter expirado.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-error font-bold mb-4">Link inválido. Por favor, solicite a recuperação novamente.</p>
        <Button onClick={() => navigate('/login')} variant="secondary">Ir para Login</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface p-8 rounded-3xl shadow-xl border border-border/50 flex flex-col gap-6">
        
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-2">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-text-main tracking-tight">Criar Nova Senha</h1>
          <p className="text-sm text-text-secondary font-medium">
            Escolha uma palavra-passe forte para proteger a sua conta KLIN.
          </p>
        </div>

        {!sucesso ? (
          <form onSubmit={handleReset} className="space-y-4">
            <Input
              label="Nova Palavra-passe"
              type="password"
              placeholder="******"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              disabled={loading}
              required
            />
            <Input
              label="Confirmar Palavra-passe"
              type="password"
              placeholder="******"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<CheckCircle2 className="w-4 h-4" />}
              disabled={loading}
              required
            />

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white" 
              isLoading={loading}
            >
              Gravar Nova Senha
            </Button>
          </form>
        ) : (
          <div className="flex flex-col gap-4 mt-2">
            <div className="bg-success/10 border border-success/20 p-4 rounded-xl text-center">
              <p className="text-success font-bold text-sm">
                A sua palavra-passe foi atualizada com segurança!
              </p>
            </div>
            <Button 
              onClick={() => navigate('/login')} 
              className="w-full h-12"
            >
              Iniciar Sessão Agora
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}