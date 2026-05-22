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

        <div
          ref={cardRef}
          style={{
            position: 'relative',
            width: '325px',
            height: '540px',
            borderRadius: '28px',
            overflow: 'hidden',
            background: '#FFFFFF',
            boxShadow: '0 12px 32px rgba(0,0,0,0.06), 0 3px 10px rgba(0,0,0,0.04)',
            userSelect: 'none',
          }}
        >
          {/* ====================================================== */}
          {/* ELEMENTOS GRÁFICOS ABSTRATOS – FAIXAS CURVAS MODERNAS   */}
          {/* ====================================================== */}
          <svg
  viewBox="0 0 325 540"
  preserveAspectRatio="none"
  style={{
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  }}
>
  <defs>
    <linearGradient id="blueMain" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#062B5B" />
      <stop offset="100%" stopColor="#0A4C8B" />
    </linearGradient>

    <linearGradient id="greenMain" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#41B66E" />
      <stop offset="100%" stopColor="#6CDA94" />
    </linearGradient>
  </defs>

  {/* fundo */}
  <rect width="325" height="540" fill="#FAFAFA" />

  {/* linhas superiores */}
  <g opacity="0.06">
    <path d="M180 -10 C270 30 300 70 340 150" stroke="#0B4C8C" strokeWidth="1" fill="none"/>
    <path d="M190 -10 C280 35 310 80 350 165" stroke="#0B4C8C" strokeWidth="1" fill="none"/>
    <path d="M200 -10 C290 40 320 90 360 180" stroke="#0B4C8C" strokeWidth="1" fill="none"/>
    <path d="M210 -10 C300 45 330 100 370 195" stroke="#0B4C8C" strokeWidth="1" fill="none"/>
  </g>

  {/* onda topo */}
  <path
    d="M0 0 L325 0 L325 55 C250 20 120 25 0 0 Z"
    fill="url(#blueMain)"
  />

  {/* linha verde topo */}
  <path
    d="M0 18 C100 42 210 18 325 50"
    stroke="url(#greenMain)"
    strokeWidth="6"
    fill="none"
  />

  {/* onda principal */}
  <path
    d="
      M0 305
      C75 250 155 240 325 290
      L325 425
      C230 455 130 455 0 410 Z
    "
    fill="url(#blueMain)"
  />

  {/* linha verde principal */}
  <path
    d="
      M0 295
      C80 240 160 235 325 280
    "
    stroke="url(#greenMain)"
    strokeWidth="7"
    fill="none"
  />

  {/* linhas inferiores */}
  <g opacity="0.06">
    <path d="M-20 515 C60 470 120 480 180 560" stroke="#0B4C8C" strokeWidth="1" fill="none"/>
    <path d="M-20 525 C70 480 130 490 190 570" stroke="#0B4C8C" strokeWidth="1" fill="none"/>
    <path d="M-20 535 C80 490 140 500 200 580" stroke="#0B4C8C" strokeWidth="1" fill="none"/>
  </g>
</svg>
          {/* ====================================================== */}
          {/* EMPRESA */}
          {/* ====================================================== */}
          <div
            style={{
              position: 'absolute',
              top: '24px',
              width: '100%',
              textAlign: 'center',
              zIndex: 10,
            }}
          >
            <span
              style={{
                color: 'white',
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '4px',
                textTransform: 'uppercase',
              }}
            >
              Klin Engenharia
            </span>
            <div
              style={{
                width: '28px',
                height: '2px',
                background: '#8DE0A8',
                margin: '4px auto 0',
                borderRadius: '1px',
              }}
            />
          </div>

          {/* ====================================================== */}
          {/* FOTO */}
          {/* ====================================================== */}
          <div
            style={{
              position: 'absolute',
              top: '78px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid white',
              boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
              background: '#fff',
              zIndex: 10,
            }}
          >
            <Avatar nome={user.nome} url={user.fotoUrl} className="w-full h-full border-none shadow-none" />
          </div>

          {/* ====================================================== */}
          {/* NOME */}
          {/* ====================================================== */}
          <div
            style={{
              position: 'absolute',
              top: '195px',
              width: '100%',
              textAlign: 'center',
              padding: '0 24px',
              zIndex: 10,
            }}
          >
            <h2
              style={{
                margin: 0,
                color: '#062B5B',
                fontSize: '36px',
                fontWeight: 900,
                letterSpacing: '-1.5px',
                lineHeight: 1.1,
                textTransform: 'uppercase',
              }}
            >
              {primeiroNome}
            </h2>
            <div
              style={{
                marginTop: '2px',
                color: '#475569',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '2.5px',
                textTransform: 'uppercase',
              }}
            >
              {sobrenome}
            </div>
            <div
              style={{
                width: '32px',
                height: '2px',
                background: '#1E6B3E',
                margin: '8px auto 0',
                borderRadius: '1px',
              }}
            />
          </div>

          {/* ====================================================== */}
          {/* FUNÇÃO */}
          {/* ====================================================== */}
          <div
            style={{
              position: 'absolute',
              top: '275px',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <div
              style={{
                background: '#062B5B',
                color: 'white',
                padding: '6px 20px',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '10px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            >
              {user.role}
            </div>
          </div>

          {/* ====================================================== */}
          {/* QR CODE */}
          {/* ====================================================== */}
          <div
            style={{
              position: 'absolute',
              top: '330px',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <div
              style={{
                background: 'white',
                padding: '10px',
                borderRadius: '12px',
                boxShadow: '0 3px 12px rgba(0,0,0,0.06)',
              }}
            >
              {tokenFinal ? (
                <QRCodeSVG value={loginUrl} size={100} level="M" />
              ) : (
                <div
                  style={{
                    width: '100px',
                    height: '100px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#F8FAFC',
                    borderRadius: '10px',
                    border: '1px dashed #CBD5E1',
                  }}
                >
                  <QrCode size={38} color="#94a3b8" />
                </div>
              )}
            </div>
          </div>

          {/* ====================================================== */}
          {/* RODAPÉ */}
          {/* ====================================================== */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              zIndex: 10,
            }}
          >
            <ShieldCheck size={11} color="#8DE0A8" />
            <span
              style={{
                color: 'white',
                fontSize: '8px',
                fontWeight: 600,
                letterSpacing: '3px',
                textTransform: 'uppercase',
              }}
            >
              Identidade Funcional
            </span>
          </div>
        </div>

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