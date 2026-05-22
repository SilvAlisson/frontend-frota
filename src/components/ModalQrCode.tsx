import { useState, useRef } from 'react';
import { Modal } from './ui/Modal';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import { Printer, RefreshCw, Copy, QrCode, ShieldCheck, Download } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '../types';
import { ConfirmModal } from './ui/ConfirmModal';

interface ModalQrCodeProps {
  user: User;
  onClose: () => void;
  onUpdate?: () => void;
}

export function ModalQrCode({ user, onClose, onUpdate }: ModalQrCodeProps) {
  const queryClient = useQueryClient();
  const [tokenAtual, setTokenAtual] = useState<string | null>(
    (user as User & { loginToken?: string }).loginToken || null
  );
  const [loading, setLoading] = useState(false);
  const [confirmRegenerar, setConfirmRegenerar] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  /**
   * =========================================================
   * URL
   * =========================================================
   */
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const vercelUrl = "https://klinfrota.vercel.app";
  const baseUrl = import.meta.env.VITE_APP_URL || (isLocalhost ? vercelUrl : window.location.origin);
  const tokenFinal = tokenAtual || user.matricula;
  const loginUrl = tokenFinal ? `${baseUrl}/login?magicToken=${tokenFinal}` : '';

  /**
   * =========================================================
   * GENERATE TOKEN
   * =========================================================
   */
  const handleGerarNovo = async () => {
    if (tokenAtual) {
      setConfirmRegenerar(true);
      return;
    }
    await executarGerarToken();
  };

  const executarGerarToken = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(`/auth/user/${user.id}/generate-token`);
      setTokenAtual(data.loginToken);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Credencial atualizada com sucesso!");
      if (onUpdate) onUpdate();
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      toast.error("Erro ao gerar credencial.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * =========================================================
   * COPY
   * =========================================================
   */
  const handleCopyLink = () => {
    if (!loginUrl) return;
    navigator.clipboard.writeText(loginUrl);
    toast.success("Link copiado!");
  };

  /**
   * =========================================================
   * IMPRESSÃO (BLINDADA - RESOLVE BUG DA FOTO)
   * =========================================================
   */
  const handlePrint = () => {
    const printContent = cardRef.current;
    if (!printContent) return;

    // 1. Cria uma janela de impressão oculta
    const printWindow = window.open('', '', 'width=900,height=900');
    if (printWindow) {
      const styles = Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(style => style.outerHTML)
        .join('\n');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <base href="${window.location.origin}">
            <title>Crachá - ${user.nome}</title>
            ${styles}
            <style>
              @page { size: auto; margin: 0; }
              body { 
                margin: 0; display: flex; justify-content: center; align-items: center; 
                min-height: 100vh; background: white; 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important; 
              }
              /* Força a remoção de sombras e coloca uma borda para corte no papel A4 */
              .shadow-2xl { box-shadow: none !important; border: 1px dashed #cbd5e1 !important; }
            </style>
          </head>
          <body>
            <div style="transform: scale(1.0); transform-origin: center; padding: 20px;">
              ${printContent.outerHTML}
            </div>
            <script>
              // 2. O GRANDE SEGREDO: O JavaScript da janela de impressão
              // SÓ dispara o print() quando a janela carregar TUDO (incluindo a foto remota).
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 400); // 400ms é o tempo extra de segurança para a foto estabilizar na renderização
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  /**
   * =========================================================
   * DADOS DO USUÁRIO
   * =========================================================
   */
  const nameParts = (user.nome || '').trim().split(' ');
  const primeiroNome = nameParts[0] || '';
  const sobrenome = nameParts.slice(1).join(' ');

  const getRoleBadgeColor = (role: string) => {
    const map: Record<string, string> = {
      'ADMIN': 'bg-rose-100 text-rose-700 border-rose-200',
      'ENCARREGADO': 'bg-blue-100 text-blue-700 border-blue-200',
      'OPERADOR': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'RH': 'bg-purple-100 text-purple-700 border-purple-200',
    };
    return map[role] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  /**
   * =========================================================
   * COMPONENT (DESIGN FIEL AO MOCKUP V2)
   * =========================================================
   */
  return (
    <Modal isOpen={true} onClose={onClose} title="Identidade Funcional" className="max-w-[390px]">
      <div className="flex flex-col items-center gap-6">
        
        {/* === CRACHÁ PREMIUM (MODELO NOVO V2) === */}
        {/* Layout por camadas ABSOLUTAS para alta fidelidade e impressão perfeita */}
        <div
          ref={cardRef}
          className="w-[320px] h-[520px] bg-white rounded-[32px] overflow-hidden relative flex flex-col select-none border border-border/50 shadow-2xl"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.8) inset'
          }}
        >
          {/* === 1. HEADER BANNER (AZUL) === */}
          <div className="h-32 bg-[#1a2333] relative flex items-center justify-center pt-2">
            {/* Efeito Arqueado Inferior (Shape central) */}
            <div className="absolute -bottom-10 left-0 right-0 h-20 bg-[#1a2333] rounded-b-[50%] z-0"></div>
            
            <div className="relative z-10 flex flex-col items-center gap-1.5">
              {/* O SEU ARQUIVO DE LOGO REAL OFICIAL */}
              <img 
                src="/assets/klin-logo.png" 
                alt="Klin Engenharia" 
                className="h-10 object-contain" 
                onError={(e) => {
                  // Fallback se a imagem falhar (O logo precisa ser /assets/klin-logo.png)
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<div class="font-header font-black text-white text-xl tracking-tighter">KLIN<span class="font-light text-slate-300">Frota</span></div>';
                }}
              />
            </div>
          </div>

          {/* === 2. CORPO DO CRACHÁ (BRANCO) === */}
          <div className="flex-1 flex flex-col items-center px-6 relative z-10 -mt-16">

            {/* Foto Centrada com Anel Dourado */}
            <div className="relative">
              {/* Anel Dourado */}
              <div className="w-32 h-32 rounded-full p-1.5 flex items-center justify-center rotate-3 shadow-lg" style={{ background: 'linear-gradient(135deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c)' }}>
                {/* Borda Branca Interna e Foto */}
                <div className="w-full h-full rounded-full border-[3px] border-white overflow-hidden bg-slate-100 flex items-center justify-center">
                  <Avatar
                    nome={user.nome}
                    url={user.fotoUrl}
                    className="w-full h-full text-4xl shadow-none border-none"
                  />
                </div>
              </div>
              {/* Selo de Verificado pequeno */}
              <div className="absolute bottom-1 right-1 bg-success text-white p-1 rounded-full border-[3px] border-white shadow-sm z-20">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            {/* Nome do Colaborador (Formatação Chave) */}
            <div className="text-center mt-6 w-full">
              <h2 className="leading-tight text-slate-900">
                <span className="block text-2xl font-black tracking-tight">{primeiroNome}</span>
                <span className="block text-lg font-light text-slate-600 uppercase tracking-wide">{sobrenome}</span>
              </h2>
            </div>

            {/* Função e Matrícula */}
            <div className="mt-4 flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getRoleBadgeColor(user.role)}`}>
                {user.role}
              </div>
              {user.matricula && (
                <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-slate-200 bg-slate-50 text-slate-600">
                  ID: {user.matricula}
                </div>
              )}
            </div>

            {/* ÁREA DO QR CODE / LOGO PEQUENO */}
            <div className="mt-auto mb-6 w-full flex flex-col items-center gap-2.5">
              <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm relative group">
                {/* Cantoneiras decorativas amarelas (Vetor puro) */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-[3px] border-l-[3px] border-yellow-400 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-[3px] border-r-[3px] border-yellow-400 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-[3px] border-l-[3px] border-yellow-400 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-[3px] border-r-[3px] border-yellow-400 rounded-br-lg"></div>

                {tokenFinal ? (
                  <QRCodeSVG value={loginUrl} size={110} level="M" className="opacity-95" />
                ) : (
                  <div className="w-[110px] h-[110px] flex flex-col gap-1 items-center justify-center bg-slate-50 rounded text-slate-400 border border-slate-100">
                    <QrCode className="w-8 h-8 opacity-50" />
                    <span className="text-[10px] font-medium tracking-tight">QR Inativo</span>
                  </div>
                )}
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Identidade Funcional</span>
            </div>
          </div>

          {/* === 3. FOOTER BANNER (AZUL) === */}
          <div className="h-14 bg-[#1a2333] relative flex items-center justify-center">
            {/* Efeito Arqueado Superior */}
            <div className="absolute -top-10 left-0 right-0 h-20 bg-[#1a2333] rounded-t-[50%] z-0"></div>
            
            <div className="relative z-10 flex flex-col items-center gap-1">
              <div className="w-12 h-1 bg-primary/50 rounded-full mb-1"></div>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.3em]">Propriedade Operacional</p>
            </div>
          </div>
        </div>

        {/* === AÇÕES EXTERNAS === */}
        <div className="w-full flex flex-col gap-3">
          {tokenFinal ? (
            <>
              <Button
                onClick={handlePrint}
                className="w-full h-11 text-base font-bold bg-surface-hover hover:bg-border text-text-main border-none transition-transform active:scale-95"
                variant="secondary"
                icon={<Printer className="w-5 h-5 text-primary" />}
              >
                Imprimir Documento Oficial
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="secondary"
                  onClick={handleCopyLink}
                  className="h-11 bg-surface-hover hover:bg-border text-text-main border border-border/40"
                  icon={<Copy className="w-4 h-4" />}
                >
                  Copiar Link
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleGerarNovo}
                  isLoading={loading}
                  className="h-11 bg-error/10 hover:bg-error/20 text-error border border-error/20"
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Renovar
                </Button>
              </div>
            </>
          ) : (
            <Button
              onClick={handleGerarNovo}
              className="w-full h-12 text-base shadow-xl bg-primary hover:bg-primary-hover text-white border-none font-bold"
              isLoading={loading}
              icon={<Download className="w-5 h-5" />}
            >
              Gerar Acesso Inicial
            </Button>
          )}
        </div>

      </div>

      <ConfirmModal
        isOpen={confirmRegenerar}
        title="Renovar QR Code"
        description="Gerar um novo código invalidará o crachá anterior permanentemente. O integrante precisará de um novo crachá impresso."
        variant="warning"
        confirmLabel="Sim, Renovar"
        onConfirm={() => { setConfirmRegenerar(false); executarGerarToken(); }}
        onCancel={() => setConfirmRegenerar(false)}
      />
    </Modal>
  );
}