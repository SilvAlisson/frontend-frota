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
            boxShadow: '0 10px 30px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
            userSelect: 'none',
          }}
        >
          {/* SVG com ondas estilizadas */}
          <svg
            viewBox="0 0 325 540"
            preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
          >
            <defs>
              <linearGradient id="azul" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#062B5B" />
                <stop offset="100%" stopColor="#0F4477" />
              </linearGradient>
              <linearGradient id="verde" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2E8B57" />
                <stop offset="100%" stopColor="#5CBF7B" />
              </linearGradient>
              <linearGradient id="azulClaro" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0F4477" />
                <stop offset="100%" stopColor="#1A5BA0" />
              </linearGradient>
            </defs>

            {/* Onda superior principal – com ponta no meio */}
            <path
              d="M0 0 L325 0 L325 90 Q280 120 240 80 Q200 40 160 100 Q120 160 80 90 Q40 20 0 60 Z"
              fill="url(#azul)"
            />

            {/* Onda verde sobre a azul (efeito de camada) */}
            <path
              d="M0 0 L325 0 L325 85 Q290 110 250 78 Q210 46 170 95 Q130 145 90 85 Q50 25 0 55 Z"
              fill="url(#verde)"
              opacity="0.3"
            />

            {/* Onda inferior – com duas pontas */}
            <path
              d="M0 420 L0 370 Q40 340 80 380 Q120 420 160 370 Q200 320 240 380 Q280 440 325 390 L325 540 L0 540 Z"
              fill="url(#azulClaro)"
            />

            {/* Onda verde na base */}
            <path
              d="M0 430 L0 385 Q45 350 85 390 Q125 430 165 380 Q205 330 245 390 Q285 450 325 400 L325 540 L0 540 Z"
              fill="url(#verde)"
              opacity="0.25"
            />

            {/* Detalhes decorativos: círculos vazados sutis */}
            <circle cx="60" cy="50" r="25" fill="none" stroke="white" strokeWidth="0.8" opacity="0.15" />
            <circle cx="280" cy="380" r="18" fill="none" stroke="white" strokeWidth="0.8" opacity="0.12" />
            <circle cx="30" cy="410" r="30" fill="none" stroke="white" strokeWidth="0.6" opacity="0.08" />
            <circle cx="300" cy="40" r="14" fill="none" stroke="white" strokeWidth="0.6" opacity="0.10" />

            {/* Pequenos triângulos/ondas pontiagudas no canto */}
            <path d="M310 60 L320 50 L330 65 Z" fill="white" opacity="0.08" />
            <path d="M15 380 L5 370 L-5 385 Z" fill="white" opacity="0.06" />
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
                textShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            >
              Klin Engenharia
            </span>
            <div
              style={{
                width: '24px',
                height: '2px',
                background: '#5CBF7B',
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
              top: '72px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '4px solid white',
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
              background: '#fff',
              zIndex: 10,
            }}
          >
            <Avatar nome={user.nome} url={user.fotoUrl} className="w-full h-full border-none shadow-none" />
          </div>

          {/* ====================================================== */}
          {/* NOME DO USUÁRIO */}
          {/* ====================================================== */}
          <div
            style={{
              position: 'absolute',
              top: '200px',
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
                fontSize: '38px',
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
                color: '#64748B',
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '2.5px',
                textTransform: 'uppercase',
              }}
            >
              {sobrenome}
            </div>

            {/* Linha decorativa abaixo do nome */}
            <div
              style={{
                width: '40px',
                height: '3px',
                background: 'linear-gradient(90deg, #2E8B57, #5CBF7B)',
                margin: '10px auto 0',
                borderRadius: '2px',
              }}
            />
          </div>

          {/* ====================================================== */}
          {/* FUNÇÃO */}
          {/* ====================================================== */}
          <div
            style={{
              position: 'absolute',
              top: '285px',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #0F4477, #1A5BA0)',
                color: 'white',
                padding: '7px 20px',
                borderRadius: '20px',
                fontWeight: 700,
                fontSize: '10px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                boxShadow: '0 3px 10px rgba(15,68,119,0.25)',
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
              top: '340px',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <div
              style={{
                background: 'white',
                padding: '12px',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                border: '1px solid #E2E8F0',
              }}
            >
              {/* Cantoneiras sutis */}
              <div style={{
                position: 'absolute', top: 0, left: 0,
                width: '20px', height: '20px',
                borderTop: '2px solid #2E8B57', borderLeft: '2px solid #2E8B57',
                borderTopLeftRadius: '16px'
              }} />
              <div style={{
                position: 'absolute', top: 0, right: 0,
                width: '20px', height: '20px',
                borderTop: '2px solid #0F4477', borderRight: '2px solid #0F4477',
                borderTopRightRadius: '16px'
              }} />
              <div style={{
                position: 'absolute', bottom: 0, left: 0,
                width: '20px', height: '20px',
                borderBottom: '2px solid #2E8B57', borderLeft: '2px solid #2E8B57',
                borderBottomLeftRadius: '16px'
              }} />
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                width: '20px', height: '20px',
                borderBottom: '2px solid #0F4477', borderRight: '2px solid #0F4477',
                borderBottomRightRadius: '16px'
              }} />

              {tokenFinal ? (
                <QRCodeSVG value={loginUrl} size={105} level="M" />
              ) : (
                <div
                  style={{
                    width: '105px',
                    height: '105px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    border: '1px dashed #CBD5E1',
                  }}
                >
                  <QrCode size={42} color="#94a3b8" />
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
            <ShieldCheck size={12} color="white" />
            <span
              style={{
                color: 'white',
                fontSize: '9px',
                fontWeight: 600,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                opacity: 0.9,
                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
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