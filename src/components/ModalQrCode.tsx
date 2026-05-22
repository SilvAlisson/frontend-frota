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
    return map[role] || { bg: 'rgba(255,255,255,.1)', border: 'rgba(255,255,255,.2)' };
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
   * IMPRESSÃO BLINDADA
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
              .print-card { box-shadow: none !important; border: 1px dashed #cbd5e1 !important; transform: scale(0.95); }
            </style>
          </head>
          <body>
            <div class="print-card" style="width: 325px; height: 720px; position: relative; border-radius: 34px; overflow: hidden; background: white;">
              ${printContent.innerHTML}
            </div>
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 500);
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
        {/* COMPOSIÇÃO EDITORIAL PREMIUM (MOCKUP IDÊNTICO)                    */}
        {/* ================================================================= */}
        <div
          ref={cardRef}
          style={{
            position: 'relative', width: '325px', height: '720px',
            background: 'radial-gradient(circle at top right, rgba(255,255,255,0.9), rgba(241,245,249,1))',
            overflow: 'hidden', borderRadius: '34px',
            boxShadow: '0 25px 80px rgba(15,23,42,0.18)', userSelect: 'none'
          }}
        >
          {/* LAYER 0: SHAPES VETORIAIS (A ONDA PERFEITA) */}
          <svg 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
            viewBox="0 0 325 720" 
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
              <filter id="shadow">
                <feDropShadow dx="0" dy="-8" stdDeviation="12" floodOpacity="0.15" />
              </filter>
            </defs>

            {/* ONDA CENTRAL (CURVA S PERFEITA COM SOMBRA) */}
            <path 
              d="M0 330 C90 250 170 250 325 315 L325 470 C220 505 120 505 0 455 Z" 
              fill="url(#blueGradient)" 
              filter="url(#shadow)"
            />
            {/* DESTAQUE VERDE CENTRAL */}
            <path 
              d="M0 320 C90 240 170 245 325 305" 
              stroke="url(#greenGradient)" 
              strokeWidth="6" 
              fill="none" 
            />

            {/* ONDA RODAPÉ */}
            <path d="M0 680 C100 640 220 655 325 620 L325 720 L0 720 Z" fill="url(#blueGradient)" />
          </svg>

          {/* LAYER 1: LOGO KLIN (COM RESPIRO GIGANTE) */}
          <div style={{ position: 'absolute', top: '68px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', zIndex: 10 }}>
            <img 
              src="/assets/klin-logo.png" 
              alt="Klin Engenharia" 
              style={{ height: '72px', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<div style="font-weight:900;font-size:32px;color:#0F172A;letter-spacing:-2px;">KLIN <span style="font-weight:300;font-size:18px;">Engenharia</span></div>';
              }}
            />
          </div>

          {/* LAYER 2: AVATAR GIGANTE CORTANDO A ONDA */}
          <div style={{ position: 'absolute', top: '145px', left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
            {/* Anéis Externos Expandidos */}
            <svg style={{ position: 'absolute', top: '-17.5px', left: '-17.5px', width: '205px', height: '205px', transform: 'rotate(-12deg)' }} viewBox="0 0 205 205">
              <circle cx="102.5" cy="102.5" r="98" stroke="#062B5B" strokeWidth="4" fill="none" strokeDasharray="350 250" strokeLinecap="round" />
              <circle cx="102.5" cy="102.5" r="98" stroke="#3FB26B" strokeWidth="4" fill="none" strokeDasharray="120 500" strokeDashoffset="-300" strokeLinecap="round" />
            </svg>
            
            {/* Foto Base Gigante */}
            <div style={{ position: 'relative', width: '170px', height: '170px', borderRadius: '50%', backgroundColor: '#ffffff', border: '6px solid #ffffff', overflow: 'hidden', boxShadow: '0 25px 50px rgba(15,23,42,0.22)' }}>
              <Avatar nome={user.nome} url={user.fotoUrl} className="w-full h-full border-none shadow-none text-6xl" />
            </div>

            {/* Selo de Verificado Proporcional */}
            <div style={{ position: 'absolute', bottom: '6px', right: '6px', width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#10b981', border: '5px solid #ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.15)' }}>
              <ShieldCheck size={26} color="#ffffff" strokeWidth={2.5} />
            </div>
          </div>

          {/* LAYER 3: NOME EDITORIAL (Pesado e Condensado) */}
          <div style={{ position: 'absolute', top: '345px', left: '0', width: '100%', textAlign: 'center', padding: '0 10px', zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 
              style={{ 
                fontSize: '56px', fontWeight: 900, color: '#ffffff', margin: 0, textTransform: 'uppercase', 
                letterSpacing: '-3px', lineHeight: 0.9, maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden' 
              }}
            >
              {primeiroNome}
            </h2>
            <p style={{ fontSize: '18px', fontWeight: 500, color: '#67D38F', margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '6px' }}>
              {sobrenome}
            </p>
          </div>

          {/* LAYER 4: TAG DE FUNÇÃO */}
          <div style={{ position: 'absolute', top: '445px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', zIndex: 30 }}>
            <div style={{ backgroundColor: roleBadge.bg, border: `1px solid ${roleBadge.border}`, padding: '6px 20px', borderRadius: '99px', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
              <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>{user.role}</span>
              {user.matricula && (
                <span style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '8px', color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: 700, letterSpacing: '1px' }}>Matrícula: {user.matricula}</span>
              )}
            </div>
          </div>

          {/* LAYER 5: QR CODE GIGANTE ("Flutuando") */}
          <div style={{ position: 'absolute', top: '500px', left: '50%', transform: 'translateX(-50%) translateY(-8px)', zIndex: 40 }}>
            <div style={{ position: 'relative', backgroundColor: '#ffffff', padding: '20px', borderRadius: '32px', boxShadow: '0 20px 40px rgba(15,23,42,0.20)' }}>
              {/* CANTONEIRAS VETORIAIS DE CORTE */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '32px', height: '32px', borderLeft: '4px solid #3FB26B', borderTop: '4px solid #3FB26B', borderTopLeftRadius: '32px' }} />
              <div style={{ position: 'absolute', top: 0, right: 0, width: '32px', height: '32px', borderRight: '4px solid #062B5B', borderTop: '4px solid #062B5B', borderTopRightRadius: '32px' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '32px', height: '32px', borderLeft: '4px solid #062B5B', borderBottom: '4px solid #062B5B', borderBottomLeftRadius: '32px' }} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '32px', height: '32px', borderRight: '4px solid #3FB26B', borderBottom: '4px solid #3FB26B', borderBottomRightRadius: '32px' }} />

              {tokenFinal ? (
                <QRCodeSVG value={loginUrl} size={138} level="M" />
              ) : (
                <div style={{ width: '138px', height: '138px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderRadius: '16px' }}>
                  <QrCode size={48} color="#94a3b8" />
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', fontWeight: 700, letterSpacing: '1px' }}>INATIVO</span>
                </div>
              )}
            </div>
          </div>

          {/* LAYER 6: ASSINATURA DE RODAPÉ */}
          <div style={{ position: 'absolute', bottom: '16px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', zIndex: 30 }}>
            <ShieldCheck size={16} color="#67D38F" />
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '2.5px' }}>Identidade Funcional</span>
          </div>

        </div>

        {/* ================================================================= */}
        {/* BOTÕES DE AÇÃO (NÃO SAEM NA IMPRESSÃO)                            */}
        {/* ================================================================= */}
        <div className="w-full flex flex-col gap-3">
          {tokenFinal ? (
            <>
              <Button onClick={handlePrint} className="w-full h-12 text-base font-bold bg-slate-100 hover:bg-slate-200 text-slate-900 border-none transition-transform active:scale-95" variant="secondary" icon={<Printer className="w-5 h-5 text-blue-600" />}>
                Imprimir Crachá 
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