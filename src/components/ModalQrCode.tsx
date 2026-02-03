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

  // --- TRAVA SCROLL E FECHA COM ESC ---
  useEffect(() => {
    // 1. Trava o scroll do corpo da página ao abrir
    document.body.style.overflow = 'hidden';

    // 2. Listener para fechar com ESC
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);

    // 3. Limpeza ao fechar o modal
    return () => {
      document.body.style.overflow = 'unset'; // Destrava scroll
      window.removeEventListener('keydown', handleEsc);
    };
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
    // Z-INDEX ALTO E POSIÇÃO FIXA: Garante que fique acima de tudo e centralizado na VIEWPORT
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 h-screen w-screen overflow-hidden">
      
      {/* Backdrop Escuro (Clica fora para fechar) */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container - Compacto e Centralizado */}
      <div className="relative bg-surface w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col animate-in zoom-in-95 duration-200 border border-border max-h-[90vh]">
        
        {/* Header com Botão Fechar */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-border bg-background shrink-0">
          <h3 className="font-bold text-text-main flex items-center gap-2 text-sm uppercase tracking-wide">
            <QrCode className="w-4 h-4 text-primary" />
            Crachá Digital
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 -mr-2 text-text-muted hover:text-text-main hover:bg-surface-hover rounded-full transition-colors"
            title="Fechar (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com Scroll Interno (se necessário em telas muito pequenas) */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-gray-50/50">
          
          {/* --- O CRACHÁ (Área de Impressão) --- */}
          {/* Importante: overflow-visible para a foto não cortar */}
          <div ref={cardRef} className="w-[280px] bg-white rounded-2xl shadow-lg border border-gray-200 relative flex flex-col select-none print:shadow-none print:border overflow-visible">
            
            {/* Topo Colorido */}
            <div className="h-24 bg-primary rounded-t-2xl relative overflow-hidden">
               {/* Pattern de fundo opcional */}
               <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-white to-transparent"></div>
               <div className="absolute top-4 left-0 right-0 text-center">
                 <span className="text-[10px] font-bold text-white/90 tracking-[0.2em] uppercase">Identificação</span>
               </div>
            </div>

            {/* Foto do Usuário (Posicionada para sobrepor a divisão) */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20">
               <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-gray-100 overflow-hidden flex items-center justify-center">
                 {user.fotoUrl ? (
                    <img src={user.fotoUrl} className="w-full h-full object-cover" alt={user.nome} />
                  ) : (
                    <span className="text-3xl font-bold text-primary opacity-50">{user.nome?.charAt(0)}</span>
                  )}
               </div>
            </div>

            {/* Dados do Usuário */}
            <div className="pt-16 pb-8 px-6 text-center flex flex-col items-center">
              <h2 className="text-xl font-bold text-gray-900 leading-tight mb-1">
                {user.nome?.split(' ')[0]}
              </h2>
              {user.nome && user.nome.split(' ').length > 1 && (
                 <span className="text-sm font-medium text-gray-600 block mb-1">{user.nome.split(' ').slice(1).join(' ')}</span>
              )}
              
              <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider mb-6 border border-gray-200">
                {getTituloCracha(user.role)}
              </span>

              {/* QR Code */}
              <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm mb-2">
                {tokenAtual ? (
                  <QRCodeSVG value={loginUrl} size={140} level="M" />
                ) : (
                  <div className="w-[140px] h-[140px] flex items-center justify-center bg-gray-50 text-gray-400 text-xs rounded">
                    Código não gerado
                  </div>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Acesso Pessoal & Intransferível</p>
            </div>
            
            {/* Faixa Inferior */}
            <div className="h-3 bg-primary/10 border-t border-primary/20 w-full rounded-b-2xl"></div>
          </div>

        </div>

        {/* Footer de Ações */}
        <div className="p-4 border-t border-border bg-surface shrink-0 flex flex-col gap-3">
           {tokenAtual ? (
            <div className="flex flex-col gap-3">
              <Button onClick={handlePrint} className="w-full h-11 text-sm shadow-md" icon={<Printer className="w-4 h-4"/>}>
                Imprimir Crachá
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={handleCopyLink} className="h-10 text-xs" icon={<Copy className="w-3.5 h-3.5"/>}>
                   Copiar Link
                </Button>
                <Button variant="ghost" onClick={handleGerarNovo} isLoading={loading} className="h-10 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-100" icon={<RefreshCw className="w-3.5 h-3.5"/>}>
                   Gerar Novo
                </Button>
              </div>
            </div>
           ) : (
             <Button onClick={handleGerarNovo} className="w-full h-12" isLoading={loading}>
               Gerar Primeiro Acesso
             </Button>
           )}
        </div>

      </div>
    </div>
  );
}