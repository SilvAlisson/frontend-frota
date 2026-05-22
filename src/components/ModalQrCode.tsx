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
            background: '#F8FAFC',
            boxShadow: '0 12px 32px rgba(0,0,0,0.06), 0 3px 10px rgba(0,0,0,0.04)',
            userSelect: 'none',
          }}
        >
          {/* ====================================================== */}
          {/* CAMADA DE FUNDO COM ONDAS DIAGONAIS CRUZADAS            */}
          {/* ====================================================== */}
          <svg
            viewBox="0 0 325 540"
            preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
          >
            <defs>
              <linearGradient id="azulMarinho" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#062B5B" />
                <stop offset="100%" stopColor="#0A3A6E" />
              </linearGradient>
              <linearGradient id="verdePrincipal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E6B3E" />
                <stop offset="100%" stopColor="#3B9E5C" />
              </linearGradient>
              <linearGradient id="verdeSuave" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4CAF7A" />
                <stop offset="100%" stopColor="#7DD4A0" />
              </linearGradient>
              <linearGradient id="azulClaro" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0F4477" />
                <stop offset="100%" stopColor="#1E6BA8" />
              </linearGradient>
            </defs>

            {/* Onda 1 – diagonal descendente da esquerda para direita (azul marinho) */}
            <path
              d="M-20 80 C60 60 140 120 200 80 C260 40 300 100 345 60 L345 160 C290 200 240 140 180 180 C120 220 60 160 -20 190 Z"
              fill="url(#azulMarinho)"
              opacity="0.95"
            />

            {/* Onda 2 – diagonal ascendente da direita para esquerda (verde) */}
            <path
              d="M345 200 C280 170 220 230 160 190 C100 150 40 210 -20 170 L-20 280 C40 320 100 260 160 300 C220 340 280 280 345 320 Z"
              fill="url(#verdePrincipal)"
              opacity="0.90"
            />

            {/* Onda 3 – diagonal descendente (verde suave, mais transparência) */}
            <path
              d="M-20 310 C60 290 140 350 200 310 C260 270 300 330 345 290 L345 390 C290 430 240 370 180 410 C120 450 60 390 -20 430 Z"
              fill="url(#verdeSuave)"
              opacity="0.70"
            />

            {/* Onda 4 – diagonal ascendente (azul claro) */}
            <path
              d="M345 410 C280 380 220 440 160 400 C100 360 40 420 -20 380 L-20 470 C40 510 100 450 160 490 C220 530 280 470 345 510 Z"
              fill="url(#azulClaro)"
              opacity="0.85"
            />

            {/* Onda 5 – faixa final na base (azul marinho sólido) */}
            <path
              d="M-20 480 C60 460 140 520 200 480 C260 440 300 500 345 460 L345 550 L-20 550 Z"
              fill="url(#azulMarinho)"
              opacity="0.95"
            />

            {/* Linhas finas de contorno acompanhando as ondas (textura) */}
            <path
              d="M-20 80 C60 60 140 120 200 80 C260 40 300 100 345 60"
              fill="none"
              stroke="white"
              strokeWidth="0.6"
              opacity="0.15"
            />
            <path
              d="M345 200 C280 170 220 230 160 190 C100 150 40 210 -20 170"
              fill="none"
              stroke="white"
              strokeWidth="0.6"
              opacity="0.12"
            />
            <path
              d="M-20 310 C60 290 140 350 200 310 C260 270 300 330 345 290"
              fill="none"
              stroke="white"
              strokeWidth="0.6"
              opacity="0.10"
            />
            <path
              d="M345 410 C280 380 220 440 160 400 C100 360 40 420 -20 380"
              fill="none"
              stroke="white"
              strokeWidth="0.6"
              opacity="0.12"
            />

            {/* Linhas finas na borda inferior */}
            <path
              d="M-20 480 C60 460 140 520 200 480 C260 440 300 500 345 460"
              fill="none"
              stroke="white"
              strokeWidth="0.6"
              opacity="0.15"
            />
          </svg>

          {/* ====================================================== */}
          {/* EMPRESA */}
          {/* ====================================================== */}
          <div
            style={{
              position: 'absolute',
              top: '28px',
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
                textShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }}
            >
              Klin Engenharia
            </span>
            <div
              style={{
                width: '30px',
                height: '2px',
                background: '#7DD4A0',
                margin: '5px auto 0',
                borderRadius: '1px',
              }}
            />
          </div>

          {/* ====================================================== */}
          {/* FOTO DO COLABORADOR */}
          {/* ====================================================== */}
          <div
            style={{
              position: 'absolute',
              top: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '105px',
              height: '105px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '4px solid white',
              boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
              background: '#fff',
              zIndex: 10,
            }}
          >
            <Avatar nome={user.nome} url={user.fotoUrl} className="w-full h-full border-none shadow-none" />
          </div>

          {/* ====================================================== */}
          {/* NOME DO COLABORADOR */}
          {/* ====================================================== */}
          <div
            style={{
              position: 'absolute',
              top: '205px',
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
                fontSize: '37px',
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
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '2.5px',
                textTransform: 'uppercase',
              }}
            >
              {sobrenome}
            </div>
            <div
              style={{
                width: '36px',
                height: '3px',
                background: 'linear-gradient(90deg, #1E6B3E, #4CAF7A)',
                margin: '10px auto 0',
                borderRadius: '2px',
              }}
            />
          </div>

          {/* ====================================================== */}
          {/* CARGO / FUNÇÃO */}
          {/* ====================================================== */}
          <div
            style={{
              position: 'absolute',
              top: '290px',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #062B5B, #0F4477)',
                color: 'white',
                padding: '7px 22px',
                borderRadius: '20px',
                fontWeight: 700,
                fontSize: '10px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                boxShadow: '0 3px 12px rgba(6,43,91,0.3)',
                border: '1px solid rgba(255,255,255,0.15)',
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
              top: '348px',
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
                borderRadius: '16px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.07)',
                border: '1px solid rgba(30,107,62,0.2)',
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
                    borderRadius: '12px',
                    border: '1px dashed #CBD5E1',
                  }}
                >
                  <QrCode size={40} color="#94a3b8" />
                </div>
              )}
            </div>
          </div>

          {/* ====================================================== */}
          {/* RODAPÉ – IDENTIDADE FUNCIONAL */}
          {/* ====================================================== */}
          <div
            style={{
              position: 'absolute',
              bottom: '14px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              zIndex: 10,
            }}
          >
            <ShieldCheck size={12} color="#7DD4A0" />
            <span
              style={{
                color: 'white',
                fontSize: '9px',
                fontWeight: 600,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                textShadow: '0 1px 3px rgba(0,0,0,0.25)',
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