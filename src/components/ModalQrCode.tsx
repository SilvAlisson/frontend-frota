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
  const queryClient = useQueryClient();
  const [tokenAtual, setTokenAtual] = useState<string | null>(
    (user as any).loginToken || null
  );
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const loginUrl = tokenAtual ? `${window.location.origin}/login?magicToken=${tokenAtual}` : '';

  // Fecha com a tecla ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleGerarNovo = async () => {
    if (tokenAtual && !window.confirm("ATENÇÃO: Gerar um novo código invalidará o crachá impresso anteriormente. Continuar?")) {
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post(`/auth/user/${user.id}/generate-token`);
      setTokenAtual(data.loginToken);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Novo QR Code gerado!");
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
      toast.success("Link copiado para a área de transferência!");
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
              body { display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff; font-family: sans-serif; -webkit-print-color-adjust: exact; }
            </style>
          </head>
          <body>${printContent.outerHTML}<script>setTimeout(() => { window.print(); window.close(); }, 500);</script></body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const getTituloCracha = (roleUser: string) => {
    const map: Record<string, string> = {
      'ENCARREGADO': 'Encarregado', 'ADMIN': 'Administrador',
      'OPERADOR': 'Operador', 'RH': 'Recursos Humanos', 'COORDENADOR': 'Coordenador'
    };
    return map[roleUser] || 'Colaborador';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop (Clica fora para fechar) */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container - Compacto (max-w-sm) */}
      <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col animate-in zoom-in-95 duration-300 border border-gray-100">
        
        {/* Header com Botão Fechar Visível */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Crachá Digital
          </h3>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors"
            title="Fechar (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center gap-6">
          
          {/* --- O CRACHÁ (Área de Impressão) --- */}
          {/* Centralizado e sem overflow */}
          <div ref={cardRef} className="w-[260px] bg-white rounded-2xl overflow-hidden shadow-card border border-gray-200 relative flex flex-col select-none ring-1 ring-black/5">
            {/* Topo Colorido */}
            <div className="h-[80px] bg-primary relative w-full overflow-hidden shrink-0">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
              {/* Foto sobreposta */}
              <div className="absolute bottom-[-28px] left-0 right-0 flex justify-center">
                <div className="w-[72px] h-[72px] rounded-full bg-white p-1 shadow-md z-10">
                  {user.fotoUrl ? (
                    <img src={user.fotoUrl} className="w-full h-full rounded-full object-cover bg-gray-100" alt={user.nome} />
                  ) : (
                    <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                      {user.nome?.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dados do Usuário */}
            <div className="pt-10 pb-6 px-4 text-center">
              <h2 className="text-lg font-bold text-gray-900 leading-tight mb-0.5 truncate">
                {user.nome?.split(' ')[0]} {user.nome?.split(' ').length > 1 ? user.nome?.split(' ')[1] : ''}
              </h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-4">
                {getTituloCracha(user.role)}
              </p>

              {/* Box do QR Code */}
              <div className="bg-white p-2 border-2 border-dashed border-gray-200 rounded-xl inline-block">
                {tokenAtual ? (
                  <QRCodeSVG value={loginUrl} size={120} level="M" />
                ) : (
                  <div className="w-[120px] h-[120px] flex items-center justify-center text-xs text-gray-400 bg-gray-50 rounded-lg">
                    Sem Token
                  </div>
                )}
              </div>
            </div>
            
            {/* Rodapé do Crachá */}
            <div className="bg-gray-50 py-1.5 text-center border-t border-gray-100">
              <p className="text-[7px] text-gray-400 font-bold uppercase tracking-widest">Acesso Frota v2</p>
            </div>
          </div>

          {/* --- AÇÕES (Fora do Crachá) --- */}
          <div className="w-full space-y-3">
            {tokenAtual ? (
              <>
                <Button onClick={handlePrint} className="w-full shadow-button" icon={<Printer className="w-4 h-4" />}>
                  Imprimir
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="secondary" onClick={handleCopyLink} icon={<Copy className="w-4 h-4" />}>
                    Link
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={handleGerarNovo} 
                    isLoading={loading} 
                    icon={<RefreshCw className="w-4 h-4" />} 
                    className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-100 border"
                  >
                    Novo
                  </Button>
                </div>
              </>
            ) : (
              <Button onClick={handleGerarNovo} className="w-full" isLoading={loading}>
                Gerar Primeiro Código
              </Button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}