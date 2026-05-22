import { useState, useRef, useMemo } from 'react';
import { Modal } from './ui/Modal';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import { Printer, RefreshCw, Copy, QrCode, ShieldCheck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '../types';
import { ConfirmModal } from './ui/ConfirmModal';

interface ModalQrCodeProps {
  user: User & { loginToken?: string };
  onClose: () => void;
  onUpdate?: () => void;
}

export function ModalQrCode({ user, onClose, onUpdate }: ModalQrCodeProps) {
  const queryClient = useQueryClient();
  const [tokenAtual, setTokenAtual] = useState<string | null>(user.loginToken || null);
  const [loading, setLoading] = useState(false);
  const [confirmRegenerar, setConfirmRegenerar] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const vercelUrl = "https://klinfrota.vercel.app";
  const baseUrl = import.meta.env.VITE_APP_URL || (isLocalhost ? vercelUrl : window.location.origin);
  const tokenFinal = tokenAtual || user.matricula || undefined;
  const loginUrl = tokenFinal ? `${baseUrl}/login?magicToken=${tokenFinal}` : '';

  const nameParts = useMemo(() => (user.nome || '').trim().split(' '), [user.nome]);
  const primeiroNome = nameParts[0] || '';
  const sobrenome = nameParts.slice(1).join(' ');

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
        {/* CARTÃO – DESIGN CORPORATIVO PREMIUM                               */}
        {/* ================================================================= */}
        <div
          ref={cardRef}
          style={{
            position: 'relative',
            width: '325px',
            height: '540px',
            borderRadius: '32px',
            overflow: 'hidden',
            background: 'linear-gradient(160deg, #fafbfc 0%, #f0f2f5 100%)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.08), 0 6px 16px rgba(0,0,0,0.04)',
            userSelect: 'none',
          }}
        >
          {/* SVG decorativo de fundo – curvas orgânicas e textura sutil */}
          <svg
            viewBox="0 0 325 540"
            preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
          >
            <defs>
              <linearGradient id="gradBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0B2B4F" />
                <stop offset="100%" stopColor="#0F4477" />
              </linearGradient>
              <linearGradient id="gradGreen" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2E8B57" />
                <stop offset="100%" stopColor="#5CBF7B" />
              </linearGradient>
              <pattern id="noise" patternUnits="userSpaceOnUse" width="100" height="100">
                <image href="data:image/svg+xml;base64,..." width="100" height="100" />
              </pattern>
            </defs>

            {/* Linhas de elegância – traços finos e suaves */}
            <g opacity="0.04" fill="none" stroke="#1A365D" strokeWidth="1.2">
              <path d="M180 -10 Q280 140 60 560" />
              <path d="M210 -10 Q310 160 90 570" />
              <path d="M240 -10 Q340 180 120 580" />
            </g>

            {/* Onda superior azul (altura sutil) */}
            <path
              d="M0 0 L325 0 L325 55 Q220 0 0 20 Z"
              fill="url(#gradBlue)"
            />

            {/* Linha verde superior */}
            <path
              d="M0 18 Q180 40 325 50"
              stroke="url(#gradGreen)"
              strokeWidth="6"
              fill="none"
            />

            {/* Onda principal – forma orgânica abraçando a área do nome */}
            <path
              d="M0 310 C120 230 220 230 325 290 L325 430 C230 460 100 460 0 410 Z"
              fill="url(#gradBlue)"
            />

            {/* Linha verde principal sobreposta à onda */}
            <path
              d="M0 295 C120 215 220 215 325 280"
              stroke="url(#gradGreen)"
              strokeWidth="7"
              fill="none"
            />
          </svg>

          {/* Furo superior */}
          <div
            style={{
              position: 'absolute',
              top: '18px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '92px',
              height: '22px',
              borderRadius: '999px',
              background: '#e5e7eb',
              boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.08), 0 1px 3px rgba(255,255,255,0.9)',
              zIndex: 5,
            }}
          />

          {/* Logo com respiro */}
          <div
            style={{
              position: 'absolute',
              top: '72px',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <img
              src="/assets/klin-logo.png"
              alt="Klin"
              style={{ width: '150px', objectFit: 'contain', opacity: 0.95 }}
            />
          </div>

          {/* Foto e anel segmentado */}
          <div
            style={{
              position: 'absolute',
              top: '170px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 15,
            }}
          >
            {/* Anel externo (círculo segmentado) */}
            <svg
              viewBox="0 0 170 170"
              style={{
                position: 'absolute',
                width: '170px',
                height: '170px',
                top: '-12px',
                left: '-12px',
                transform: 'rotate(-15deg)',
              }}
            >
              <circle cx="85" cy="85" r="77" stroke="#0F4477" strokeWidth="4" fill="none" strokeDasharray="240 200" strokeLinecap="round" />
              <circle cx="85" cy="85" r="77" stroke="#2E8B57" strokeWidth="4" fill="none" strokeDasharray="70 500" strokeDashoffset="-220" strokeLinecap="round" />
            </svg>

            {/* Moldura da foto */}
            <div
              style={{
                width: '145px',
                height: '145px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '5px solid white',
                boxShadow: '0 16px 32px rgba(0,0,0,0.12)',
                background: '#fff',
              }}
            >
              <Avatar nome={user.nome} url={user.fotoUrl} className="w-full h-full border-none shadow-none" />
            </div>
          </div>

          {/* Nome e sobrenome */}
          <div
            style={{
              position: 'absolute',
              top: '345px',
              width: '100%',
              textAlign: 'center',
              padding: '0 20px',
              zIndex: 20,
            }}
          >
            <h2
              style={{
                margin: 0,
                color: 'white',
                fontSize: '44px',
                fontWeight: 900,
                letterSpacing: '-2.5px',
                lineHeight: 1,
                textTransform: 'uppercase',
              }}
            >
              {primeiroNome}
            </h2>
            <div
              style={{
                marginTop: '8px',
                color: '#A7E0C3',
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '2.2px',
                textTransform: 'uppercase',
              }}
            >
              {sobrenome}
            </div>
            {/* Linha decorativa */}
            <div
              style={{
                width: '48px',
                height: '3px',
                borderRadius: '999px',
                background: 'linear-gradient(90deg, #5CBF7B, #8DE0A8)',
                margin: '14px auto 0',
              }}
            />
          </div>

          {/* Tag da função */}
          <div
            style={{
              position: 'absolute',
              top: '432px',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              zIndex: 20,
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #2E8B57 0%, #4CAF7A 100%)',
                color: 'white',
                padding: '9px 26px',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '11px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                boxShadow: '0 6px 14px rgba(46,139,87,0.25)',
              }}
            >
              {user.role}
            </div>
          </div>

          {/* QR Code com cantoneiras sutis */}
          <div
            style={{
              position: 'absolute',
              bottom: '52px',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              zIndex: 20,
            }}
          >
            <div
              style={{
                position: 'relative',
                background: 'white',
                padding: '10px',
                borderRadius: '20px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
              }}
            >
              {/* Cantoneiras (24x24, borda 3px) */}
              <div style={{ position:'absolute', top:0, left:0, width:'24px', height:'24px', borderTop:'3px solid #2E8B57', borderLeft:'3px solid #2E8B57', borderTopLeftRadius:'20px' }} />
              <div style={{ position:'absolute', top:0, right:0, width:'24px', height:'24px', borderTop:'3px solid #0F4477', borderRight:'3px solid #0F4477', borderTopRightRadius:'20px' }} />
              <div style={{ position:'absolute', bottom:0, left:0, width:'24px', height:'24px', borderBottom:'3px solid #2E8B57', borderLeft:'3px solid #2E8B57', borderBottomLeftRadius:'20px' }} />
              <div style={{ position:'absolute', bottom:0, right:0, width:'24px', height:'24px', borderBottom:'3px solid #0F4477', borderRight:'3px solid #0F4477', borderBottomRightRadius:'20px' }} />

              {tokenFinal ? (
                <QRCodeSVG value={loginUrl} size={108} level="M" />
              ) : (
                <div style={{ width:'108px', height:'108px', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc', borderRadius:'14px' }}>
                  <QrCode size={42} color="#94a3b8" />
                </div>
              )}
            </div>
          </div>

          {/* Rodapé institucional */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              zIndex: 20,
            }}
          >
            <ShieldCheck size={13} color="#2E8B57" />
            <span
              style={{
                color: '#0A2540',
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '3.5px',
                textTransform: 'uppercase',
              }}
            >
              Identidade Funcional
            </span>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-wrap justify-center gap-3 w-full">
          <Button onClick={handleGerarNovo} disabled={loading} isLoading={loading} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            {tokenAtual ? 'Regenerar Credencial' : 'Gerar Credencial'}
          </Button>
          <Button onClick={handleCopyLink} disabled={!loginUrl} variant="outline">
            <Copy className="w-4 h-4 mr-2" />
            Copiar Link
          </Button>
          <Button onClick={handlePrint} variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>

        {/* Modal de confirmação */}
        <ConfirmModal
          isOpen={confirmRegenerar}
          title="Regenerar credencial?"
          description="Isso invalidará o token atual. Deseja continuar?"
          onConfirm={async () => {
            setConfirmRegenerar(false);
            await executarGerarToken();
          }}
          onCancel={() => setConfirmRegenerar(false)}
        />
      </div>
    </Modal>
  );
}