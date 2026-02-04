import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom'; // Importante para o Portal
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
    // Trava a rolagem do corpo da página
    document.body.style.overflow = 'hidden';

    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);

    return () => {
      // Destrava ao fechar
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleGerarNovo = async () => {
    if (tokenAtual && !window.confirm("Gerar um novo código invalidará o anterior. Continuar?")) return;
    
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
    } catch {
      toast.error("Erro ao copiar.");
    }
  };

  const handlePrint = () => {
    const printContent = cardRef.current;
    if (!printContent) return;
    
    // Abre janela de impressão limpa
    const printWindow = window.open('', '', 'width=600,height=800');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Crachá - ${user.nome}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page { size: portrait; margin: 0; }
              body { 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                background: #fff; 
                font-family: sans-serif; 
                -webkit-print-color-adjust: exact; 
              }
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

  // Conteúdo do Modal
  const modalContent = (
    // Z-INDEX ALTO + FIXED: Garante que fique acima de tudo
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Botão Fechar Flutuante (Mobile Friendly) */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors z-[100000]"
        title="Fechar"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Container Branco do Modal */}
      <div className="bg-surface w-full max-w-sm rounded-3xl shadow-2xl flex flex-col max-h-[95vh] border border-border overflow-hidden relative">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-background flex justify-between items-center shrink-0">
          <h3 className="font-bold text-text-main flex items-center gap-2 text-base uppercase tracking-wide">
            <QrCode className="w-5 h-5 text-primary" /> 
            Crachá Digital
          </h3>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase">
            {user.matricula || 'ID-V2'}
          </span>
        </div>

        {/* Corpo com Scroll (se necessário) */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 flex flex-col items-center justify-center bg-gray-50/50">
          
          {/* --- O CRACHÁ (Aumentado e Ajustado) --- */}
          {/* Aumentei para w-[300px] para dar mais respiro */}
          <div ref={cardRef} className="w-[300px] bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden relative flex flex-col items-center pb-8 select-none transform hover:scale-[1.01] transition-transform duration-300">
            
            {/* Topo Colorido */}
            <div className="h-32 w-full bg-primary relative">
               {/* Pattern de fundo */}
               <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
               <div className="absolute top-5 left-0 right-0 text-center">
                 <span className="text-[11px] font-black text-white/90 tracking-[0.3em] uppercase">IDENTIFICAÇÃO</span>
               </div>
            </div>

            {/* Foto do Usuário (Centralizada e Aumentada) */}
            {/* Margem negativa ajustada para a foto ficar bem posicionada */}
            <div className="-mt-16 z-10 relative">
               <div className="w-32 h-32 rounded-full border-[5px] border-white shadow-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                 {user.fotoUrl ? (
                    <img src={user.fotoUrl} className="w-full h-full object-cover" alt={user.nome} />
                  ) : (
                    <span className="text-4xl font-bold text-primary/30">{user.nome?.charAt(0)}</span>
                  )}
               </div>
            </div>

            {/* Dados do Usuário */}
            <div className="text-center px-6 w-full mt-4 flex flex-col items-center">
              <h2 className="text-2xl font-extrabold text-gray-900 leading-tight mb-1">
                {user.nome?.split(' ')[0]}
              </h2>
              {user.nome && user.nome.split(' ').length > 1 && (
                 <p className="text-base font-medium text-gray-500 mb-2">
                   {user.nome.split(' ').slice(1).join(' ')}
                 </p>
              )}
              
              <div className="mb-6 mt-1">
                <span className="px-4 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wider border border-gray-200">
                  {getTituloCracha(user.role)}
                </span>
              </div>
              
              {/* Box do QR Code */}
              <div className="bg-white p-3 border-2 border-dashed border-gray-200 rounded-2xl inline-block shadow-[inset_0_2px_6px_rgba(0,0,0,0.04)]">
                {tokenAtual ? (
                  <QRCodeSVG value={loginUrl} size={160} level="M" />
                ) : (
                  <div className="w-[160px] h-[160px] flex flex-col items-center justify-center text-gray-300 gap-2">
                    <QrCode className="w-10 h-10 opacity-40" />
                    <span className="text-xs font-medium">Sem Token</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-4">Acesso Pessoal & Intransferível</p>
            </div>
            
            {/* Faixa Inferior */}
            <div className="h-2 w-full bg-primary/20 absolute bottom-0"></div>
          </div>

        </div>

        {/* Footer de Ações */}
        <div className="p-5 border-t border-border bg-surface shrink-0 flex flex-col gap-3">
           {tokenAtual ? (
            <div className="flex flex-col gap-3">
              <Button onClick={handlePrint} className="w-full h-12 text-base shadow-md" icon={<Printer className="w-5 h-5"/>}>
                Imprimir Crachá
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={handleCopyLink} className="h-11" icon={<Copy className="w-4 h-4"/>}>
                   Link
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleGerarNovo} 
                  isLoading={loading} 
                  className="h-11 text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-100" 
                  icon={<RefreshCw className="w-4 h-4"/>}
                >
                   Novo
                </Button>
              </div>
            </div>
           ) : (
             <Button onClick={handleGerarNovo} className="w-full h-12 text-base shadow-md" isLoading={loading}>
               Gerar Primeiro Acesso
             </Button>
           )}
        </div>

      </div>
    </div>
  );

  // Usa createPortal para renderizar o modal DIRETAMENTE no body,
  // fora de qualquer container que possa ter overflow ou transform.
  return createPortal(modalContent, document.body);
}