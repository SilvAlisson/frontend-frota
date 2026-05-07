import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import { Printer, RefreshCw, X, Copy, QrCode, ShieldCheck, Download } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
// Removida a importação problemática do APP_URL do config
import type { User } from '../types';

interface ModalQrCodeProps {
  user: User;
  onClose: () => void;
  onUpdate?: () => void;
}

// --- COMPONENTE VISUAL: Padrão de Fundo (Estilo Certificado/Moeda) ---
const BackgroundPattern = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M0 40L40 0H20L0 20M40 40V20L20 40" stroke="currentColor" strokeWidth="1" fill="none" className="text-gray-900" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid-pattern)" />
    <path d="M0 0C100 50 200 0 320 80V0H0Z" fill="currentColor" className="text-primary opacity-10" />
    <path d="M0 540C100 480 200 540 320 460V540H0Z" fill="currentColor" className="text-primary opacity-10" />
  </svg>
);

export function ModalQrCode({ user, onClose, onUpdate }: ModalQrCodeProps) {
  const queryClient = useQueryClient();
  const [tokenAtual, setTokenAtual] = useState<string | null>(
    (user as User & { loginToken?: string }).loginToken || null
  );
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  /**
   * ✨ Lógica de Link Protegido (Fix Vercel)
   * 1. Deteta se estamos a rodar localmente.
   * 2. Se sim, força o link de produção (Vercel) para que os celulares consigam ler o QR na tela do PC.
   * 3. Se não, usa a origem real de onde o site está a ser acessado.
   */
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const vercelUrl = "https://klinfrota.vercel.app";

  // Tenta pegar a variável do Vite, senão aplica a nossa lógica inteligente
  const baseUrl = import.meta.env.VITE_APP_URL || (isLocalhost ? vercelUrl : window.location.origin);

  const tokenFinal = tokenAtual || user.matricula;
  const loginUrl = tokenFinal ? `${baseUrl}/login?magicToken=${tokenFinal}` : '';

  // Bloqueio de scroll
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
    if (tokenAtual && !window.confirm("ATENÇÃO: Gerar um novo código invalidará o crachá anterior. Continuar?")) return;

    setLoading(true);
    try {
      const { data } = await api.post(`/auth/user/${user.id}/generate-token`);
      setTokenAtual(data.loginToken);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Credencial atualizada com sucesso!");
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar credencial.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!loginUrl) return;
    navigator.clipboard.writeText(loginUrl);
    toast.success("Link de acesso copiado!");
  };

  const handlePrint = () => {
    const printContent = cardRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=700,height=900');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Crachá Funcional - ${user.nome}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page { size: portrait; margin: 0; }
              body { 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                background: #fff; 
                font-family: 'Inter', sans-serif; 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
              }
              .print-shadow { box-shadow: none !important; border: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            ${printContent.outerHTML.replace('shadow-2xl', 'print-shadow')}
            <script>
              setTimeout(() => { window.print(); window.close(); }, 800);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Formatação do Nome (Primeiro nome BOLD, Sobrenome LIGHT)
  const [primeiroNome, ...restoNome] = (user.nome || '').split(' ');
  const sobrenome = restoNome.join(' ');

  const getRoleBadgeColor = (role: string) => {
    const map: Record<string, string> = {
      'ADMIN': 'bg-rose-100 text-rose-700 border-rose-200',
      'ENCARREGADO': 'bg-blue-100 text-blue-700 border-blue-200',
      'OPERADOR': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'RH': 'bg-purple-100 text-purple-700 border-purple-200',
    };
    return map[role] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      {/* Overlay Dark */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300" 
        onClick={onClose} 
      />

      <div className="relative flex flex-col items-center gap-8 w-full max-w-sm animate-in zoom-in-95 duration-300">
        
        {/* Botão Fechar */}
        <Button
          onClick={onClose} variant="ghost" size="icon"
          className="absolute -top-12 right-0 sm:-right-12 sm:top-0 rounded-full p-2.5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 transition-all border border-white/10 backdrop-blur-sm z-50"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* === CRACHÁ PREMIUM === */}
          <div
            ref={cardRef}
            className="w-full max-w-[320px] mx-4 h-[520px] bg-surface rounded-[24px] shadow-2xl overflow-hidden relative flex flex-col select-none border border-border/50"
            style={{
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.5) inset'
            }}
          >
            {/* Background Texture */}
            <BackgroundPattern />

            {/* Cabeçalho Institucional */}
            <div className="h-28 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative z-10">
              {/* Pattern sutil no header */}
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(var(--color-text-main) 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>

              <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white font-bold text-xs">K</div>
                  <span className="text-white font-bold tracking-wide text-sm">KLIN ENGENHARIA</span>
                </div>
                <div className="h-0.5 w-16 bg-primary/50 rounded-full"></div>
              </div>
            </div>

            {/* Corpo do Crachá */}
            <div className="flex-1 flex flex-col items-center px-6 relative z-10 -mt-12">

              {/* Foto com Borda Premium */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-surface p-1 shadow-lg ring-1 ring-border/50 rotate-3 transition-transform group-hover:rotate-0 duration-500">
                  <Avatar 
                    nome={user.nome} 
                    url={user.fotoUrl} 
                    className="w-full h-full text-4xl shadow-none border-none" 
                  />
                </div>
                {/* Selo de Verificado */}
                <div className="absolute bottom-0 right-0 bg-success text-white p-1.5 rounded-full border-[3px] border-surface shadow-sm">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>

              {/* Informações do Colaborador */}
              <div className="text-center mt-5 w-full">
                <h2 className="text-gray-900 leading-tight">
                  <span className="block text-2xl font-black tracking-tight">{primeiroNome}</span>
                  <span className="block text-lg font-light text-gray-600 uppercase tracking-wide">{sobrenome}</span>
                </h2>

                <div className={`mt-3 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </div>
              </div>

              {/* Área do QR Code */}
              <div className="mt-auto mb-6 flex flex-col items-center">
                <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200/60 relative group">
                  {/* Cantoneiras decorativas */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary rounded-tl-md"></div>
                  <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-primary rounded-tr-md"></div>
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-primary rounded-bl-md"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-primary rounded-br-md"></div>

                  {tokenFinal ? (
                    <QRCodeSVG value={loginUrl} size={110} level="M" className="opacity-90 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="w-[110px] h-[110px] flex flex-col items-center justify-center text-gray-300 gap-1 bg-gray-50 rounded">
                      <QrCode className="w-8 h-8 opacity-40" />
                      <span className="text-[9px] font-medium">Inativo</span>
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-3">Identidade Funcional</p>
              </div>
            </div>

            {/* Rodapé Decorativo */}
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-500 to-primary"></div>
          </div>

          {/* === AÇÕES EXTERNAS === */}
          <div className="w-full max-w-[320px] mx-4 flex flex-col gap-3">
            {tokenFinal ? (
              <>
                <Button
                  onClick={handlePrint}
                  className="w-full h-12 text-base font-bold shadow-xl bg-white hover:bg-gray-50 text-gray-900 border-none transition-transform active:scale-95"
                  variant="secondary"
                  icon={<Printer className="w-5 h-5 text-primary" />}
                >
                  Imprimir Documento
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="secondary"
                    onClick={handleCopyLink}
                    className="h-11 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md"
                    icon={<Copy className="w-4 h-4" />}
                  >
                    Copiar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleGerarNovo}
                    isLoading={loading}
                    className="h-11 bg-white/5 hover:bg-red-500/20 text-red-200 hover:text-red-100 border border-white/10 backdrop-blur-md"
                    icon={<RefreshCw className="w-4 h-4" />}
                  >
                    Renovar
                  </Button>
                </div>
              </>
            ) : (
              <Button
                onClick={handleGerarNovo}
                className="w-full h-14 text-lg shadow-xl bg-primary hover:bg-primary-hover text-white border-none font-bold"
                isLoading={loading}
                icon={<Download className="w-6 h-6" />}
              >
                Gerar Acesso Inicial
              </Button>
            )}
          </div>

        </div>
      </div>,
    document.body
  );
}