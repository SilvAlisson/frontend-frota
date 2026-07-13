import { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { toast } from 'sonner';
import { authClient } from '../lib/auth-client';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { logger } from '../lib/logger';
import { z } from 'zod';

interface ModalAlterarSenhaProps {
  isOpen: boolean;
  onClose: () => void;
}

const passwordSchema = z.string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
  .regex(/[0-9]/, 'A senha deve conter pelo menos um número');

export function ModalAlterarSenha({ isOpen, onClose }: ModalAlterarSenhaProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswords(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('A nova senha e a confirmação não batem.');
      return;
    }

    try {
      passwordSchema.parse(newPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
        return;
      }
    }

    setIsLoading(true);
    try {
      const { error } = await authClient.changePassword({
        newPassword,
        currentPassword,
        revokeOtherSessions: true
      });

      if (error) {
        throw error;
      }

      toast.success('Senha atualizada com sucesso! Seus outros acessos foram desconectados por segurança.');
      handleClose();
    } catch (err: any) {
      logger.apiError(err, 'Falha ao alterar senha');
      
      const errorMessage = err?.message || err?.error?.message;
      if (errorMessage?.toLowerCase().includes('password') || errorMessage?.toLowerCase().includes('senha')) {
        toast.error('A senha atual está incorreta.');
      } else {
        toast.error('Ocorreu um erro ao tentar alterar a senha. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Alterar Senha" className="max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-1">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-text-secondary leading-relaxed">
            Crie uma senha forte com no mínimo 8 caracteres, contendo pelo menos uma letra maiúscula e um número.
          </p>
        </div>

        <div className="space-y-4">
          <Input
            label="Senha Atual"
            type={showPasswords ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Digite a senha atual"
            required
            icon={<Lock className="w-4 h-4 text-text-muted" />}
          />

          <Input
            label="Nova Senha"
            type={showPasswords ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Digite a nova senha"
            required
            icon={<Lock className="w-4 h-4 text-text-muted" />}
          />

          <Input
            label="Confirmar Nova Senha"
            type={showPasswords ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a nova senha"
            required
            icon={<Lock className="w-4 h-4 text-text-muted" />}
          />
        </div>

        <div className="flex items-center gap-2 px-1">
          <button
            type="button"
            onClick={() => setShowPasswords(!showPasswords)}
            className="text-sm text-text-muted hover:text-primary transition-colors flex items-center gap-2"
          >
            {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPasswords ? 'Ocultar senhas' : 'Mostrar senhas'}
          </button>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>
            Salvar Senha
          </Button>
        </div>
      </form>
    </Modal>
  );
}
