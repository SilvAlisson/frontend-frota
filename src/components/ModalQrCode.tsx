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
   * URL & TOKEN
   * =========================================================
   */
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const vercelUrl = 'https://klinfrota.vercel.app';
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

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: '#e11d48',
      ENCARREGADO: '#2563eb',
      OPERADOR: '#059669',
      RH: '#9333ea',
    };
    return colors[role] || '#475569';
  };

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
      toast.success('Credencial atualizada com sucesso!');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar credencial.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!loginUrl) return;
    navigator.clipboard.writeText(loginUrl);
    toast.success('Link copiado!');
  };

  /**
   * =========================================================
   * IMPRESSÃO BLINDADA (SEM DEPENDER DO TAILWIND)
   * =========================================================
   */
  const handlePrint = () => {
    const printContent = cardRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=900,height=900');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <base href="${window.location.origin}">
            <title>Crachá - ${user.nome}</title>
            <style>
              @page { size: portrait; margin: 0; }
              * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
              body { 
                margin: 0; display: flex; justify-content: center; align-items: center; 
                min-height: 100vh; background: white; 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important; 
              }
              /* Garante a linha de corte e remove sombras na folha A4 */
              .print-card-wrapper {
                border: 1px dashed #cbd5e1;
                border-radius: 24px;
                overflow: hidden;
              }
            </style>
          </head>
          <body>
            <div class="print-card-wrapper">
              ${printContent.outerHTML}
            </div>
            <script>
              // Aguarda o PNG da logo carregar na janela de impressão
              window.onload = () => {
                setTimeout(() => { window.print(); window.close(); }, 600);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Identidade Funcional" className="max-w-[420px]">
      <div className="flex flex-col items-center gap-6">

        {/* ================================================================= */}
        {/* CRACHÁ (LAYOUT ABSOLUTO / ESTILOS INLINE DE ALTA FIDELIDADE)      */}
        {/* ================================================================= */}
        <div
          ref={cardRef}
          style={{
            position: 'relative',
            width: '320px',
            height: '520px',
            backgroundColor: '#ffffff',
            overflow: 'hidden',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
          }}
        >
          {/* LAYER 0: VETOR BACKGROUND (O GRANDE SEGREDO) */}
          <svg 
            viewBox="0 0 320 520" 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#062B5B" />
                <stop offset="100%" stopColor="#0B4C8C" />
              </linearGradient>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#bf953f" />
                <stop offset="50%" stopColor="#fcf6ba" />
                <stop offset="100%" stopColor="#b38728" />
              </linearGradient>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="15" stdDeviation="15" floodColor="#062B5B" floodOpacity="0.25"/>
              </filter>
            </defs>

            {/* Base Background Claro */}
            <rect width="320" height="520" fill="#f8fafc" />

            {/* Textura sutil no fundo branco superior */}
            <path d="M-50,40 L370,120 M-50,60 L370,140 M-50,80 L370,160" stroke="#f1f5f9" strokeWidth="2" fill="none" opacity="0.6" />

            {/* ONDA CENTRAL AZUL (Seção Institucional) */}
            <path 
              d="M0,170 C100,110 220,230 320,150 L320,410 C200,340 100,450 0,390 Z" 
              fill="url(#waveGrad)" 
              filter="url(#shadow)" 
            />

            {/* Acentos Dourados (Linhas Decorativas acompanhando a onda) */}
            <path d="M0,160 C100,100 220,220 320,140" fill="none" stroke="url(#goldGrad)" strokeWidth="2" opacity="0.8" />
            <path d="M0,400 C100,460 200,350 320,420" fill="none" stroke="url(#goldGrad)" strokeWidth="2" opacity="0.8" />

            {/* Overlay Luminoso Interno da Onda */}
            <path d="M0,170 C100,110 220,230 320,150 L320,230 C200,170 100,290 0,250 Z" fill="#ffffff" opacity="0.04" />
          </svg>


          {/* LAYER 1: TOPO CLARO E CLEAN (Logo) */}
          <div style={{ position: 'absolute', top: '30px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', zIndex: 10 }}>
            {/* O SEU ARQUIVO DE LOGO REAL OFICIAL */}
            <img 
              src="/assets/klin-logo.png" 
              alt="Klin Engenharia" 
              style={{ height: '45px', objectFit: 'contain' }} 
              onError={(e) => {
                // Fallback caso a imagem falhe, mas o foco é carregar a imagem!
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<div style="font-weight:900;font-size:24px;color:#0f172a;letter-spacing:-1px;">KLIN <span style="font-weight:300;font-size:16px;">Engenharia</span></div>';
              }}
            />
          </div>


          {/* LAYER 2: INTERSEÇÃO SUPERIOR (Foto vetorizada) */}
          <div style={{ position: 'absolute', top: '105px', left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
            <div style={{ 
              width: '120px', height: '120px', borderRadius: '50%', padding: '4px',
              background: 'linear-gradient(135deg, #bf953f, #fcf6ba, #b38728)', 
              boxShadow: '0 15px 35px rgba(0,0,0,0.2)' 
            }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '4px solid #ffffff', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                <Avatar nome={user.nome} url={user.fotoUrl} className="w-full h-full text-4xl shadow-none border-none" />
              </div>
            </div>
            {/* Ícone de Verificado Posicionado Absoluto em relação à Foto */}
            <div style={{ 
              position: 'absolute', bottom: '4px', right: '4px', width: '30px', height: '30px', 
              borderRadius: '50%', backgroundColor: '#10b981', border: '3px solid #ffffff',
              display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}>
              <ShieldCheck size={18} color="#ffffff" strokeWidth={3} />
            </div>
          </div>


          {/* LAYER 3: ONDA AZUL (Nome, Função, Identidade) */}
          <div style={{ position: 'absolute', top: '240px', left: '0', width: '100%', textAlign: 'center', padding: '0 20px', zIndex: 20 }}>
            <h1 style={{ color: '#ffffff', fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', margin: 0, lineHeight: 1, letterSpacing: '-0.5px' }}>
              {primeiroNome}
            </h1>
            <h2 style={{ color: '#93c5fd', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', margin: '4px 0 0 0', letterSpacing: '1px' }}>
              {sobrenome}
            </h2>

            {/* Badges de Identificação */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
              <div style={{ padding: '4px 12px', borderRadius: '6px', backgroundColor: getRoleColor(user.role), color: '#ffffff', fontSize: '10px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                {user.role}
              </div>
              {user.matricula && (
                <div style={{ padding: '4px 12px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Matrícula: {user.matricula}
                </div>
              )}
            </div>
          </div>


          {/* LAYER 4: INTERSEÇÃO INFERIOR (QR Code com Cantoneiras) */}
          <div style={{ position: 'absolute', top: '350px', left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
            <div style={{ position: 'relative', backgroundColor: '#ffffff', padding: '12px', borderRadius: '16px', boxShadow: '0 15px 40px rgba(0,43,91,0.15)', border: '1px solid #e2e8f0' }}>
              {/* Cantoneiras Amarelas Vetoriais Absolutas */}
              <div style={{ position: 'absolute', top: '-1px', left: '-1px', width: '12px', height: '12px', borderTop: '3px solid #eab308', borderLeft: '3px solid #eab308', borderTopLeftRadius: '16px' }} />
              <div style={{ position: 'absolute', top: '-1px', right: '-1px', width: '12px', height: '12px', borderTop: '3px solid #eab308', borderRight: '3px solid #eab308', borderTopRightRadius: '16px' }} />
              <div style={{ position: 'absolute', bottom: '-1px', left: '-1px', width: '12px', height: '12px', borderBottom: '3px solid #eab308', borderLeft: '3px solid #eab308', borderBottomLeftRadius: '16px' }} />
              <div style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '12px', height: '12px', borderBottom: '3px solid #eab308', borderRight: '3px solid #eab308', borderBottomRightRadius: '16px' }} />

              {tokenFinal ? (
                <QRCodeSVG value={loginUrl} size={100} level="M" />
              ) : (
                <div style={{ width: '100px', height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <QrCode size={32} color="#cbd5e1" />
                </div>
              )}
            </div>
          </div>


          {/* LAYER 5: BASE CLEAN (Assinatura de Segurança) */}
          <div style={{ position: 'absolute', bottom: '16px', left: '0', width: '100%', textAlign: 'center', zIndex: 10 }}>
            <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>
              Acesso Exclusivo Operacional
            </span>
          </div>

        </div>

        {/* ================================================================= */}
        {/* BOTÕES DE CONTROLE DA INTERFACE (NÃO SÃO IMPRESSOS)               */}
        {/* ================================================================= */}
        <div className="w-full flex flex-col gap-3">
          {tokenFinal ? (
            <>
              <Button
                onClick={handlePrint}
                className="w-full h-12 text-base font-bold bg-slate-100 hover:bg-slate-200 text-slate-900 border-none transition-transform active:scale-95"
                variant="secondary"
                icon={<Printer className="w-5 h-5 text-blue-600" />}
              >
                Imprimir Crachá
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={handleCopyLink} className="h-11 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200" icon={<Copy className="w-4 h-4" />}>Copiar Link</Button>
                <Button variant="ghost" onClick={handleGerarNovo} isLoading={loading} className="h-11 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100" icon={<RefreshCw className="w-4 h-4" />}>Revogar</Button>
              </div>
            </>
          ) : (
            <Button onClick={handleGerarNovo} className="w-full h-12 text-base shadow-xl bg-blue-600 hover:bg-blue-700 text-white border-none font-bold" isLoading={loading} icon={<Download className="w-5 h-5" />}>Gerar Acesso Inicial</Button>
          )}
        </div>

      </div>

      <ConfirmModal
        isOpen={confirmRegenerar}
        title="Revogar Acesso"
        description="Gerar um novo código destruirá permanentemente a validade deste crachá. Você precisará imprimir um novo."
        variant="warning"
        confirmLabel="Sim, Revogar"
        onConfirm={() => { setConfirmRegenerar(false); executarGerarToken(); }}
        onCancel={() => setConfirmRegenerar(false)}
      />
    </Modal>
  );
}