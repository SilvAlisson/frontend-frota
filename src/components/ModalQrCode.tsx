import { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import { Printer, RefreshCw, X, Copy, QrCode } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '../types';

interface ModalQrCodeProps {
  user: User;
  onClose: () => void;
  onUpdate?: () => void;
}

export function ModalQrCode({ user, onClose, onUpdate }: ModalQrCodeProps) {
  // Hook para invalidar o cache e persistir o token gerado
  const queryClient = useQueryClient();

  const [tokenAtual, setTokenAtual] = useState<string | null>(
    (user as any).loginToken || null
  );

  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const loginUrl = tokenAtual ? `${window.location.origin}/login?magicToken=${tokenAtual}` : '';

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleGerarNovo = async () => {
    if (tokenAtual && !window.confirm("ATENÇÃO: O usuário já possui um QR Code. Gerar um novo invalidará o crachá impresso anteriormente. Continuar?")) {
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post(`/auth/user/${user.id}/generate-token`);

      // 1. Atualiza visualmente agora
      setTokenAtual(data.loginToken);

      // 2. Atualiza a lista de usuários no cache para persistência
      await queryClient.invalidateQueries({ queryKey: ['users'] });

      toast.success("Novo QR Code gerado e salvo!");
      if (onUpdate) onUpdate();

    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar QR Code.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!loginUrl) return;
    try {
      await navigator.clipboard.writeText(loginUrl);
      toast.success("Link copiado!");
    } catch (err) {
      toast.error("Erro ao copiar.");
    }
  };

  const handlePrint = () => {
    const printContent = cardRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=600,height=800');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Crachá - ${user.nome}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page { size: portrait; margin: 0; }
              body { display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: sans-serif; }
            </style>
          </head>
          <body>
            ${printContent.outerHTML}
            <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const getTituloCracha = (roleUser: string) => {
    const map: Record<string, string> = {
      'ENCARREGADO': 'Encarregado',
      'ADMIN': 'Administrador',
      'OPERADOR': 'Operador',
      'RH': 'Recursos Humanos',
      'COORDENADOR': 'Coordenador'
    };
    return map[roleUser] || 'Colaborador';
  };

  return (
    <div className="fixed inset-0 z-[99] flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-text-main/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="relative flex flex-col items-center gap-6 z-10 animate-in zoom-in-95 duration-300">

        {/* --- ÁREA DO CRACHÁ (Visualização) --- */}
        <div ref={cardRef} className="w-[320px] bg-surface rounded-3xl overflow-hidden shadow-float border border-border relative flex flex-col">
          {/* Topo do Crachá (Usa Primary Brand Color) */}
          <div className="h-[140px] bg-primary relative w-full overflow-hidden shrink-0">
            <div className="absolute inset-0 opacity-20 z-0">
              <div className="absolute right-[-30px] top-[-30px] w-40 h-40 rounded-full bg-white blur-3xl"></div>
              <div className="absolute left-[-20px] bottom-[-20px] w-32 h-32 rounded-full bg-black blur-3xl"></div>
            </div>
            <div className="absolute top-6 left-0 right-0 flex justify-center z-10">
              <div className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-sm">
                <span className="text-[10px] font-bold text-white tracking-widest uppercase">Frota Inteligente</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center -mt-16 px-6 pb-8 relative z-10">
            {/* Foto do Usuário */}
            <div className="w-32 h-32 rounded-full bg-surface p-1.5 shadow-float mb-5">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center text-4xl font-bold text-text-muted border border-border overflow-hidden">
                {user.fotoUrl ? (
                  <img src={user.fotoUrl} alt={user.nome} className="w-full h-full object-cover" />
                ) : (
                  <span>{user.nome ? user.nome.charAt(0).toUpperCase() : 'U'}</span>
                )}
              </div>
            </div>

            <div className="text-center w-full mb-6">
              <h2 className="text-2xl font-extrabold text-text-main leading-none mb-1.5 break-words">
                {user.nome ? user.nome.split(' ')[0] : 'Usuário'}
              </h2>
              {user.nome && user.nome.split(' ').length > 1 && (
                <p className="text-lg font-medium text-text-secondary leading-tight">
                  {user.nome.split(' ').slice(1).join(' ')}
                </p>
              )}
              <div className="mt-3 inline-block">
                <span className="bg-primary/10 text-primary px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-primary/20">
                  {getTituloCracha(user.role)}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 border-2 border-dashed border-border rounded-2xl shadow-inner w-full flex justify-center">
              {tokenAtual ? (
                <QRCodeSVG value={loginUrl} size={140} level="M" className="mx-auto" />
              ) : (
                <div className="w-[140px] h-[140px] flex flex-col items-center justify-center text-center text-xs text-text-muted bg-background rounded-lg gap-2">
                  <QrCode className="w-8 h-8 opacity-20" />
                  <span>Sem QR Code<br />Gerado</span>
                </div>
              )}
            </div>
          </div>
          <div className="py-3 bg-background border-t border-border text-center">
            <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">Acesso Pessoal e Intransferível</p>
          </div>
        </div>

        {/* --- BOTÕES DE AÇÃO --- */}
        <div className="flex flex-col gap-3 w-full max-w-[320px]">
          {tokenAtual ? (
            <>
              <Button 
                onClick={handlePrint} 
                className="w-full h-12 shadow-button hover:shadow-float text-base" 
                icon={<Printer className="w-5 h-5" />}
              >
                Imprimir Crachá
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={handleCopyLink} 
                  variant="secondary" 
                  className="bg-surface hover:bg-surface-hover text-text-secondary hover:text-primary border-border" 
                  icon={<Copy className="w-4 h-4" />}
                >
                  Copiar Link
                </Button>
                <Button 
                  onClick={handleGerarNovo} 
                  variant="ghost" 
                  className="text-text-secondary hover:text-primary bg-black/40 hover:bg-black/60 border border-white/10 backdrop-blur-md text-white" 
                  isLoading={loading} 
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Novo Código
                </Button>
              </div>
            </>
          ) : (
            <Button 
              onClick={handleGerarNovo} 
              className="w-full h-12 shadow-button" 
              isLoading={loading}
            >
              Gerar Primeiro QR Code
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={onClose}
            className="text-white hover:bg-white/10"
            icon={<X className="w-4 h-4" />}
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}