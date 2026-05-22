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
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
          >
            <defs>
              <linearGradient id="azulBase" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#062B5B" />
                <stop offset="100%" stopColor="#0A3A6E" />
              </linearGradient>
              <linearGradient id="verdeBase" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#1E6B3E" />
                <stop offset="100%" stopColor="#3B9E5C" />
              </linearGradient>
              <linearGradient id="verdeClaro" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4CAF7A" />
                <stop offset="100%" stopColor="#8DE0A8" />
              </linearGradient>
              <linearGradient id="azulMedio" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#0F4477" />
                <stop offset="100%" stopColor="#1E6BA8" />
              </linearGradient>
            </defs>

            {/* Faixa superior – azul marinho, descendo da esquerda para direita */}
            <path
              d="M0 0 L325 0 L325 65 Q240 90 160 50 Q80 10 0 55 Z"
              fill="url(#azulBase)"
            />

            {/* Faixa verde – cruza do topo direito ao meio esquerdo */}
            <path
              d="M325 70 Q240 30 160 80 Q80 130 0 90 L0 150 Q80 190 160 140 Q240 90 325 130 Z"
              fill="url(#verdeBase)"
            />

            {/* Faixa verde clara – atravessa o centro */}
            <path
              d="M0 160 Q80 210 160 155 Q240 100 325 155 L325 210 Q240 255 160 205 Q80 155 0 215 Z"
              fill="url(#verdeClaro)"
              opacity="0.5"
            />

            {/* Faixa azul média – da esquerda inferior à direita */}
            <path
              d="M0 230 Q80 275 160 220 Q240 165 325 225 L325 280 Q240 325 160 270 Q80 215 0 280 Z"
              fill="url(#azulMedio)"
              opacity="0.7"
            />

            {/* Faixa azul marinho – base */}
            <path
              d="M0 295 Q80 340 160 285 Q240 230 325 290 L325 350 Q240 395 160 340 Q80 285 0 350 Z"
              fill="url(#azulBase)"
              opacity="0.8"
            />

            {/* Faixa verde – quase na base */}
            <path
              d="M325 355 Q240 315 160 365 Q80 415 0 365 L0 420 Q80 470 160 420 Q240 370 325 420 Z"
              fill="url(#verdeBase)"
              opacity="0.45"
            />

            {/* Faixa inferior – azul marinho sólido */}
            <path
              d="M0 440 L325 440 L325 540 L0 540 Z"
              fill="url(#azulBase)"
            />

            {/* Linhas finas decorativas sobre as faixas */}
            <path d="M0 65 Q240 90 325 65" fill="none" stroke="white" strokeWidth="0.5" opacity="0.2" />
            <path d="M325 130 Q160 140 0 150" fill="none" stroke="white" strokeWidth="0.5" opacity="0.15" />
            <path d="M0 215 Q160 205 325 210" fill="none" stroke="white" strokeWidth="0.5" opacity="0.15" />
            <path d="M325 280 Q160 270 0 280" fill="none" stroke="white" strokeWidth="0.5" opacity="0.12" />
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