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
    // 1. Trava o scroll do corpo da página imediatamente
    document.body.style.overflow = 'hidden';

    // 2. Listener para fechar com ESC
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);

    // 3. Limpeza ao desmontar
    return () => {
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
    // CAMADA 1: Overlay Fixo (Z-Index Máximo) - Cobre toda a tela
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Botão Fechar (Fora do card para fácil acesso no mobile) */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors z-[100000]"
        title="Fechar"
      >
        <X className="w-6 h-6" />
      </button>

      {/* CAMADA 2: Container do Modal (Branco) */}
      <div className="bg-surface w-full max-w-sm rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-border">
        
        {/* Header Simples */}
        <div className="px-6 py-4 border-b border-border bg-background flex justify-between items-center shrink-0">
          <h3 className="font-bold text-text-main flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" /> 
            Crachá Digital
          </h3>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase">
            {user.matricula || 'V2.0'}
          </span>
        </div>

        {/* Corpo com Scroll (Caso a tela seja muito pequena) */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col items-center bg-gray-50/50">
          
          {/* --- O CRACHÁ (Design Físico) --- */}
          {/* w-[280px] é um tamanho padrão bom para impressão e mobile */}
          <div ref={cardRef} className="w-[280px] bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden relative flex flex-col items-center pb-6 select-none transform hover:scale-[1.02] transition-transform duration-300">
            
            {/* Topo Colorido (Sem overflow-hidden aqui para permitir a foto sair) */}
            <div className="h-28 w-full bg-primary relative">
              {/* Efeito de fundo sutil */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
              
              <div className="absolute top-4 w-full text-center">
                <span className="text-[10px] font-black text-white/80 tracking-[0.3em] uppercase">IDENTIFICAÇÃO</span>
              </div>
            </div>

            {/* Foto do Usuário (Posicionada com margem negativa para subir no topo) */}
            <div className="-mt-12 z-10 relative">
              <div className="w-24 h-24 rounded-full border-[4px] border-white shadow-md bg-gray-100 flex items-center justify-center overflow-hidden">
                {user.fotoUrl ? (
                  <img src={user.fotoUrl} className="w-full h-full object-cover" alt={user.nome} />
                ) : (
                  <span className="text-3xl font-bold text-primary/40">{user.nome?.charAt(0)}</span>
                )}
              </div>
            </div>

            {/* Dados do Usuário */}
            <div className="text-center px-4 w-full mt-3">
              <h2 className="text-xl font-extrabold text-gray-900 leading-tight">
                {user.nome?.split(' ')[0]}
              </h2>
              {user.nome && user.nome.split(' ').length > 1 && (
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {user.nome.split(' ').slice(1).join(' ')}
                </p>
              )}
              
              <div className="mt-2 mb-5">
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider border border-gray-200">
                  {getTituloCracha(user.role)}
                </span>
              </div>
              
              {/* Área do QR Code */}
              <div className="bg-white p-2.5 border-2 border-dashed border-gray-200 rounded-xl inline-block shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
                {tokenAtual ? (
                  <QRCodeSVG value={loginUrl} size={140} level="M" />
                ) : (
                  <div className="w-[140px] h-[140px] flex flex-col items-center justify-center text-gray-300 gap-2">
                    <QrCode className="w-8 h-8 opacity-50" />
                    <span className="text-[10px] font-medium">Sem Token</span>
                  </div>
                )}
              </div>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-3">Acesso Pessoal & Intransferível</p>
            </div>

            {/* Rodapé Decorativo do Crachá */}
            <div className="h-1.5 w-full bg-primary/20 absolute bottom-0"></div>
          </div>

          {/* --- AÇÕES (Fora do Crachá) --- */}
          <div className="w-full mt-6 space-y-3">
             {tokenAtual ? (
               <>
                 <Button onClick={handlePrint} className="w-full h-11 text-sm shadow-md" icon={<Printer className="w-4 h-4"/>}>
                   Imprimir Crachá
                 </Button>
                 <div className="grid grid-cols-2 gap-3">
                   <Button variant="secondary" onClick={handleCopyLink} className="h-10 text-xs" icon={<Copy className="w-3.5 h-3.5"/>}>
                      Copiar Link
                   </Button>
                   <Button 
                    variant="ghost" 
                    onClick={handleGerarNovo} 
                    isLoading={loading} 
                    className="h-10 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-100" 
                    icon={<RefreshCw className="w-3.5 h-3.5"/>}
                   >
                      Novo Código
                   </Button>
                 </div>
               </>
             ) : (
               <Button onClick={handleGerarNovo} className="w-full h-12 shadow-md" isLoading={loading}>
                 Gerar Primeiro Acesso
               </Button>
             )}
          </div>

        </div>
      </div>
    </div>
  );
}