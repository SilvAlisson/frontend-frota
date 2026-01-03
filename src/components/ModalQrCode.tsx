import { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import { Printer, RefreshCw, X, Copy } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query'; // [IMPORTANTE] Para corrigir o cache
import type { User } from '../types';

interface ModalQrCodeProps {
  user: User;
  onClose: () => void;
  onUpdate?: () => void;
}

export function ModalQrCode({ user, onClose, onUpdate }: ModalQrCodeProps) {
  // [CORREÇÃO 1] Hook para invalidar o cache e persistir o token gerado
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

      // 2. [CORREÇÃO CRÍTICA] Atualiza a lista de usuários no cache
      // Isso garante que se der F5 ou reabrir o modal, o token continua lá
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
    <div className="fixed inset-0 z-[99] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-6" onClick={(e) => e.stopPropagation()}>

        {/* --- ÁREA DO CRACHÁ --- */}
        <div ref={cardRef} className="w-[320px] bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-200 relative flex flex-col">
          <div className="h-[140px] bg-gray-900 relative w-full overflow-hidden shrink-0">
            <div className="absolute inset-0 opacity-40 z-0">
              <div className="absolute right-[-30px] top-[-30px] w-40 h-40 rounded-full bg-emerald-500 blur-3xl"></div>
              <div className="absolute left-[-20px] bottom-[-20px] w-32 h-32 rounded-full bg-blue-600 blur-3xl"></div>
            </div>
            <div className="absolute top-6 left-0 right-0 flex justify-center z-10">
              <div className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-sm">
                <span className="text-[10px] font-bold text-white tracking-widest uppercase">Frota Inteligente</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center -mt-16 px-6 pb-8 relative z-10">
            <div className="w-32 h-32 rounded-full bg-white p-1.5 shadow-xl mb-5">
              <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-4xl font-bold text-gray-400 border border-gray-200 overflow-hidden">
                {user.fotoUrl ? (
                  <img src={user.fotoUrl} alt={user.nome} className="w-full h-full object-cover" />
                ) : (
                  <span>{user.nome ? user.nome.charAt(0).toUpperCase() : 'U'}</span>
                )}
              </div>
            </div>

            <div className="text-center w-full mb-6">
              <h2 className="text-2xl font-extrabold text-gray-900 leading-none mb-1.5 break-words">
                {user.nome ? user.nome.split(' ')[0] : 'Usuário'}
              </h2>
              {user.nome && user.nome.split(' ').length > 1 && (
                <p className="text-lg font-medium text-gray-500 leading-tight">
                  {user.nome.split(' ').slice(1).join(' ')}
                </p>
              )}
              <div className="mt-3 inline-block">
                <span className="bg-emerald-50 text-emerald-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-100">
                  {getTituloCracha(user.role)}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 border-2 border-dashed border-gray-200 rounded-2xl shadow-sm w-full flex justify-center">
              {tokenAtual ? (
                <QRCodeSVG value={loginUrl} size={140} level="M" className="mx-auto" />
              ) : (
                <div className="w-[140px] h-[140px] flex items-center justify-center text-center text-xs text-gray-400 bg-gray-50 rounded-lg">
                  Sem QR Code<br />Gerado
                </div>
              )}
            </div>
          </div>
          <div className="py-3 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Acesso Pessoal e Intransferível</p>
          </div>
        </div>

        {/* --- BOTÕES --- */}
        <div className="flex flex-col gap-3 w-full max-w-[320px]">
          {tokenAtual ? (
            <>
              <Button onClick={handlePrint} className="w-full h-12 shadow-xl bg-emerald-600 hover:bg-emerald-700 border-transparent" icon={<Printer className="w-5 h-5" />}>
                Imprimir Crachá
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleCopyLink} variant="secondary" className="bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-700" icon={<Copy className="w-4 h-4" />}>
                  Copiar Link
                </Button>
                <Button onClick={handleGerarNovo} variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10" isLoading={loading} icon={<RefreshCw className="w-4 h-4" />}>
                  Novo Código
                </Button>
              </div>
            </>
          ) : (
            <Button onClick={handleGerarNovo} className="w-full h-12 shadow-xl bg-emerald-600 hover:bg-emerald-700" isLoading={loading}>
              Gerar Primeiro QR Code
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={onClose}
            className="bg-transparent text-white/70 border-white/20 hover:bg-white/10 hover:text-white"
            icon={<X className="w-4 h-4" />}
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}