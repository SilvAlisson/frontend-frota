import { useState, useRef, useMemo } from 'react';
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
   * DADOS DO USUÁRIO
   * =========================================================
   */
  const nameParts = useMemo(() => (user.nome || '').trim().split(' '), [user.nome]);
  const primeiroNome = nameParts[0] || '';
  const sobrenome = nameParts.slice(1).join(' ');

  const getRoleBadge = (role: string) => {
    const map: Record<string, { bg: string; border: string }> = {
      ADMIN: { bg: 'rgba(244,63,94,.15)', border: 'rgba(244,63,94,.3)' },
      ENCARREGADO: { bg: 'rgba(59,130,246,.15)', border: 'rgba(59,130,246,.3)' },
      OPERADOR: { bg: 'rgba(16,185,129,.15)', border: 'rgba(16,185,129,.3)' },
      RH: { bg: 'rgba(168,85,247,.15)', border: 'rgba(168,85,247,.3)' },
    };
    return map[role] || { bg: 'rgba(100,116,139,.15)', border: 'rgba(100,116,139,.3)' };
  };
  const roleBadge = getRoleBadge(user.role);

  /**
   * =========================================================
   * AÇÕES DA API
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
      console.error(error);
      toast.error("Erro ao gerar credencial.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!loginUrl) return;
    navigator.clipboard.writeText(loginUrl);
    toast.success("Link copiado!");
  };

  /**
   * =========================================================
   * IMPRESSÃO BLINDADA (CARREGAMENTO DE FOTO GARANTIDO)
   * =========================================================
   */
  const handlePrint = () => {
    const printContent = cardRef.current;
    if (!printContent) return;

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
              .print-card { box-shadow: none !important; border: 1px dashed #cbd5e1 !important; transform: scale(1.0); }
            </style>
          </head>
          <body>
            <div class="print-card" style="width: 325px; height: 540px; position: relative; border-radius: 24px; overflow: hidden; background: white;">
              ${printContent.innerHTML}
            </div>
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 500); // Garante que a foto e a logo estarão totalmente renderizadas
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Identidade Funcional" className="max-w-[400px]">
      <div className="flex flex-col items-center gap-6">

        {/* ================================================================= */}
        {/* CRACHÁ PREMIUM (CAMADAS ABSOLUTAS E VETORES DE ALTA FIDELIDADE)   */}
        {/* ================================================================= */}
        <div
          ref={cardRef}
          style={{
            position: 'relative', width: '325px', height: '540px',
            backgroundColor: '#ffffff', overflow: 'hidden', borderRadius: '34px',
            boxShadow: '0 25px 80px rgba(15,23,42,0.18)', userSelect: 'none'
          }}
        >
          {/* LAYER 0: VETOR BACKGROUND (MÚLTIPLAS ONDAS E CURVAS BÉZIER) */}
          <svg 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
            viewBox="0 0 325 540" 
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#062B5B" />
                <stop offset="100%" stopColor="#0B4C8C" />
              </linearGradient>
              <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3FB26B" />
                <stop offset="100%" stopColor="#67D38F" />
              </linearGradient>
            </defs>

            {/* ONDA SUPERIOR */}
            <path d="M0 0 L325 0 L325 80 C240 50 140 60 0 35 Z" fill="url(#blueGradient)" />
            {/* DESTAQUE VERDE SUPERIOR */}
            <path d="M0 42 C110 60 210 42 325 72" stroke="url(#greenGradient)" strokeWidth="5" fill="none" />

            {/* ONDA CENTRAL GIGANTE */}
            <path d="M0 285 C80 215 205 355 325 270 L325 430 C220 470 110 470 0 405 Z" fill="url(#blueGradient)" />
            {/* DESTAQUE VERDE CENTRAL */}
            <path d="M0 280 C80 210 205 350 325 265" stroke="url(#greenGradient)" strokeWidth="7" fill="none" />

            {/* ONDA RODAPÉ */}
            <path d="M0 515 C100 480 220 495 325 460 L325 540 L0 540 Z" fill="url(#blueGradient)" />

            {/* LINHAS DECORATIVAS SUTIS DE PROFUNDIDADE */}
            <g opacity="0.08">
              <path d="M140 0 C260 40 260 90 325 140" stroke="#0B4C8C" strokeWidth="1" fill="none" />
              <path d="M150 0 C270 40 270 90 325 150" stroke="#0B4C8C" strokeWidth="1" fill="none" />
              <path d="M160 0 C280 40 280 90 325 160" stroke="#0B4C8C" strokeWidth="1" fill="none" />
            </g>
          </svg>

          {/* LAYER 1: LOGO KLIN */}
          <div style={{ position: 'absolute', top: '20px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', zIndex: 10 }}>
            <img 
              src="/assets/klin-logo.png" 
              alt="Klin Engenharia" 
              style={{ height: '36px', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<div style="font-weight:900;font-size:22px;color:#ffffff;letter-spacing:-1px;">KLIN <span style="font-weight:300;font-size:14px;">Engenharia</span></div>';
              }}
            />
          </div>

          {/* LAYER 2: AVATAR COM ANÉIS VETORIAIS ROTACIONADOS */}
          <div style={{ position: 'absolute', top: '75px', left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
            {/* Anéis Externos Desalinhados */}
            <svg style={{ position: 'absolute', top: '-16px', left: '-16px', width: '160px', height: '160px', transform: 'rotate(-12deg)' }} viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="72" stroke="#062B5B" strokeWidth="4" fill="none" strokeDasharray="280 180" strokeLinecap="round" />
              <circle cx="80" cy="80" r="72" stroke="#3FB26B" strokeWidth="4" fill="none" strokeDasharray="80 400" strokeDashoffset="-220" strokeLinecap="round" />
            </svg>
            
            {/* Foto Base */}
            <div style={{ position: 'relative', width: '128px', height: '128px', borderRadius: '50%', backgroundColor: '#ffffff', border: '6px solid #ffffff', overflow: 'hidden', boxShadow: '0 20px 50px rgba(15,23,42,0.22)' }}>
              <Avatar nome={user.nome} url={user.fotoUrl} className="w-full h-full border-none shadow-none text-4xl" />
            </div>

            {/* Selo de Verificado */}
            <div style={{ position: 'absolute', bottom: '4px', right: '4px', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#10b981', border: '4px solid #ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
              <ShieldCheck size={20} color="#ffffff" strokeWidth={2.5} />
            </div>
          </div>

          {/* LAYER 3: NOME DO INTEGRANTE (Posicionado na área branca) */}
          <div style={{ position: 'absolute', top: '225px', left: '0', width: '100%', textAlign: 'center', padding: '0 20px', zIndex: 20 }}>
            <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', margin: 0, textTransform: 'uppercase', letterSpacing: '-1px', lineHeight: 1 }}>{primeiroNome}</h2>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{sobrenome}</p>
          </div>

          {/* LAYER 4: TAG DE FUNÇÃO (Sobrepondo a onda central azul) */}
          <div style={{ position: 'absolute', top: '300px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', zIndex: 20 }}>
            <div style={{ backgroundColor: roleBadge.bg, border: `1px solid ${roleBadge.border}`, padding: '8px 24px', borderRadius: '99px', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>{user.role}</span>
              {user.matricula && (
                <span style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '8px', color: 'rgba(255,255,255,0.8)', fontSize: '10px', fontWeight: 700, letterSpacing: '1px' }}>ID: {user.matricula}</span>
              )}
            </div>
          </div>

          {/* LAYER 5: QR CODE (Com cantoneiras vetoriais cruzando fundo branco e onda azul) */}
          <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
            <div style={{ position: 'relative', backgroundColor: '#ffffff', padding: '16px', borderRadius: '24px', boxShadow: '0 15px 40px rgba(15,23,42,0.20)' }}>
              {/* CANTONEIRAS */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '24px', height: '24px', borderLeft: '3px solid #3FB26B', borderTop: '3px solid #3FB26B', borderTopLeftRadius: '24px' }} />
              <div style={{ position: 'absolute', top: 0, right: 0, width: '24px', height: '24px', borderRight: '3px solid #062B5B', borderTop: '3px solid #062B5B', borderTopRightRadius: '24px' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '24px', height: '24px', borderLeft: '3px solid #062B5B', borderBottom: '3px solid #062B5B', borderBottomLeftRadius: '24px' }} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '24px', height: '24px', borderRight: '3px solid #3FB26B', borderBottom: '3px solid #3FB26B', borderBottomRightRadius: '24px' }} />

              {tokenFinal ? (
                <QRCodeSVG value={loginUrl} size={110} level="M" />
              ) : (
                <div style={{ width: '110px', height: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderRadius: '12px' }}>
                  <QrCode size={36} color="#94a3b8" />
                  <span style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>Inativo</span>
                </div>
              )}
            </div>
          </div>

          {/* LAYER 6: ASSINATURA DE RODAPÉ */}
          <div style={{ position: 'absolute', bottom: '12px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', zIndex: 20 }}>
            <ShieldCheck size={14} color="#67D38F" />
            <span style={{ fontSize: '9px', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '2px' }}>Identidade Funcional</span>
          </div>

        </div>

        {/* ================================================================= */}
        {/* BOTÕES DE AÇÃO (NÃO SAEM NA IMPRESSÃO)                            */}
        {/* ================================================================= */}
        <div className="w-full flex flex-col gap-3">
          {tokenFinal ? (
            <>
              <Button onClick={handlePrint} className="w-full h-12 text-base font-bold bg-slate-100 hover:bg-slate-200 text-slate-900 border-none transition-transform active:scale-95" variant="secondary" icon={<Printer className="w-5 h-5 text-blue-600" />}>
                Imprimir Documento Oficial
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={handleCopyLink} className="h-11 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200" icon={<Copy className="w-4 h-4" />}>Copiar Link</Button>
                <Button variant="ghost" onClick={handleGerarNovo} isLoading={loading} className="h-11 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100" icon={<RefreshCw className="w-4 h-4" />}>Revogar</Button>
              </div>
            </>
          ) : (
            <Button onClick={handleGerarNovo} className="w-full h-12 text-base shadow-xl bg-blue-600 hover:bg-blue-700 text-white border-none font-bold" isLoading={loading} icon={<Download className="w-5 h-5" />}>
              Gerar Acesso Inicial
            </Button>
          )}
        </div>

      </div>

      <ConfirmModal
        isOpen={confirmRegenerar}
        title="Revogar Acesso"
        description="Gerar um novo código destruirá permanentemente a validade deste crachá. O integrante precisará de um novo crachá impresso."
        variant="warning"
        confirmLabel="Sim, Revogar"
        onConfirm={() => { setConfirmRegenerar(false); executarGerarToken(); }}
        onCancel={() => setConfirmRegenerar(false)}
      />
    </Modal>
  );
}