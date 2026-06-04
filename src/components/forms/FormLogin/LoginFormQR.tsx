import { useState } from 'react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { QrCode, ArrowRight } from 'lucide-react';

interface LoginFormQRProps {
  onSubmit: (token: string) => Promise<void>;
  isSubmitting: boolean;
}

export function LoginFormQR({ onSubmit, isSubmitting }: LoginFormQRProps) {
  const [qrManualToken, setQrManualToken] = useState('');

  const onManualQrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(qrManualToken);
  };

  return (
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
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        className="font-mono text-sm tracking-widest font-bold bg-surface/40 border-border/40 text-center rounded-xl"
        autoFocus
        disabled={isSubmitting}
      />

      <Button 
        type="submit" 
        variant="secondary" 
        className="w-full h-14 text-sm font-black btn-tactile group border-border/60 hover:border-primary/50 text-text-main shadow-sm rounded-2xl uppercase tracking-widest"
        isLoading={isSubmitting}
        disabled={isSubmitting || !qrManualToken.trim()}
      >
        {isSubmitting ? 'Iniciando Sessão...' : (
          <>Iniciar Sessão <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform text-primary" /></>
        )}
      </Button>
    </form>
  );
}
