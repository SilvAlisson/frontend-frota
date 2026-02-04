import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  // Bloqueia a rolagem do fundo enquanto o modal está aberto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleGerarNovo = async () => {
    if (tokenAtual && !window.confirm("ATENÇÃO: Gerar um novo código invalidará o crachá impresso anteriormente. Continuar?")) return;
    
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

  const handleCopyLink = () => {
    if (!loginUrl) return;
    navigator.clipboard.writeText(loginUrl);
    toast.success("Link copiado!");
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

  // Renderiza via Portal direto no Body para escapar de qualquer overflow do pai
  return createPortal(
    <div className="fixed inset-0 z-[99999] overflow-y-auto">
      
      {/* Backdrop Escuro (Fixo) */}
      <div 
        className="fixed inset-0 bg-black/90 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Container de Scroll Centralizado */}
      {/* min-h-full garante centralização vertical, py-10 garante margem se a tela for pequena */}
      <div className="flex min-h-full items-center justify-center p-4 text-center py-10">
        
        {/* Wrapper do Conteúdo */}
        <div className="relative transform transition-all flex flex-col items-center gap-8 w-full max-w-sm">
          
          {/* Botão Fechar Flutuante */}
          <button 
            onClick={onClose}
            className="absolute -top-12 right-0 sm:-right-12 sm:top-0 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all border border-white/10"
            title="Fechar"
          >
            <X className="w-6 h-6" />
          </button>

          {/* --- O CRACHÁ (Card Flutuante) --- */}
          {/* Sem max-h, sem overflow que corte conteúdo */}
          <div 
            ref={cardRef} 
            className="w-[320px] bg-white rounded-3xl shadow-2xl overflow-hidden relative flex flex-col select-none ring-1 ring-white/20"
            style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
          >
            
            {/* Topo Colorido */}
            <div className="h-32 w-full bg-primary relative">
               <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
               <div className="absolute top-6 left-0 right-0 text-center">
                 <span className="text-[11px] font-black text-white/90 tracking-[0.3em] uppercase">IDENTIFICAÇÃO</span>
               </div>
            </div>

            {/* Foto do Usuário (Centralizada e Grande) */}
            <div className="-mt-16 z-10 relative flex justify-center">
               <div className="w-32 h-32 rounded-full border-[6px] border-white shadow-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                 {user.fotoUrl ? (
                    <img src={user.fotoUrl} className="w-full h-full object-cover" alt={user.nome} />
                  ) : (
                    <span className="text-4xl font-bold text-primary/30">{user.nome?.charAt(0)}</span>
                  )}
               </div>
            </div>

            {/* Dados */}
            <div className="text-center px-6 pb-8 pt-4 flex flex-col items-center w-full">
              <h2 className="text-2xl font-extrabold text-gray-900 leading-tight mb-1 break-words w-full">
                {user.nome?.split(' ')[0]}
              </h2>
              {user.nome && user.nome.split(' ').length > 1 && (
                 <p className="text-base font-medium text-gray-500 mb-4 truncate w-full px-4">
                   {user.nome.split(' ').slice(1).join(' ')}
                 </p>
              )}
              
              <span className="px-5 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wider border border-gray-200 mb-6">
                {getTituloCracha(user.role)}
              </span>
              
              {/* QR Code */}
              <div className="bg-white p-3 border-2 border-dashed border-gray-200 rounded-2xl inline-block shadow-[inset_0_2px_6px_rgba(0,0,0,0.04)]">
                {tokenAtual ? (
                  <QRCodeSVG value={loginUrl} size={180} level="M" />
                ) : (
                  <div className="w-[180px] h-[180px] flex flex-col items-center justify-center text-gray-300 gap-2">
                    <QrCode className="w-12 h-12 opacity-30" />
                    <span className="text-xs font-medium">Sem Token</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-6 opacity-60">Acesso Pessoal & Intransferível</p>
            </div>
            
            {/* Faixa Inferior */}
            <div className="h-3 w-full bg-primary/20 absolute bottom-0"></div>
          </div>

          {/* --- AÇÕES (Fora do Crachá - Botões Grandes) --- */}
          <div className="w-[320px] flex flex-col gap-3">
             {tokenAtual ? (
               <>
                 <Button 
                   onClick={handlePrint} 
                   className="w-full h-14 text-lg shadow-xl shadow-primary/20 bg-white hover:bg-gray-50 text-primary border-none font-bold" 
                   variant="secondary" 
                   icon={<Printer className="w-6 h-6"/>}
                 >
                   Imprimir Crachá
                 </Button>
                 
                 <div className="grid grid-cols-2 gap-3">
                   <Button 
                     variant="secondary" 
                     onClick={handleCopyLink} 
                     className="h-12 bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md" 
                     icon={<Copy className="w-4 h-4"/>}
                   >
                      Copiar Link
                   </Button>
                   <Button 
                     variant="ghost" 
                     onClick={handleGerarNovo} 
                     isLoading={loading} 
                     className="h-12 bg-white/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 border-white/20 backdrop-blur-md" 
                     icon={<RefreshCw className="w-4 h-4"/>}
                   >
                      Novo Código
                   </Button>
                 </div>
               </>
             ) : (
               <Button onClick={handleGerarNovo} className="w-full h-14 text-lg shadow-xl" isLoading={loading}>
                 Gerar Primeiro Acesso
               </Button>
             )}
          </div>

        </div>
      </div>
    </div>,
    document.body // Injeta o modal diretamente no body
  );
}