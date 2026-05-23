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
    <Modal isOpen={true} onClose={onClose} title="Identidade Funcional" className="max-w-[380px]">
      <div className="flex flex-col items-center gap-6">
        <div
          ref={cardRef}
          className="w-full relative select-none shadow-2xl"
          style={{
            aspectRatio: '427 / 585',
            backgroundImage: 'url(/cracha-bg.png)',
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            borderRadius: '5.5%',
            overflow: 'hidden',
          }}
        >
          <div
            className="absolute overflow-hidden rounded-full"
            style={{
              top: '27.1%',
              left: '49.3%',
              transform: 'translateX(-50%)',
              width: '37.5%',
              aspectRatio: '1 / 1',
            }}
          >
            <Avatar
              nome={user.nome}
              url={user.fotoUrl}
              className="w-full h-full rounded-full border-none shadow-none"
            />
          </div>

          <p
            className="absolute text-center text-white font-black uppercase leading-none truncate"
            style={{
              top: '55.5%',
              left: '5%',
              right: '5%',
              fontSize: 'clamp(18px, 8.5vw, 34px)',
              letterSpacing: '0.05em',
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            }}
          >
            {primeiroNome}
          </p>

          <p
            className="absolute text-center font-bold uppercase leading-none truncate"
            style={{
              top: '62.5%',
              left: '5%',
              right: '5%',
              fontSize: 'clamp(7px, 3vw, 13px)',
              letterSpacing: '0.22em',
              color: '#4ade80',
            }}
          >
            {sobrenome}
          </p>

          <p
            className="absolute text-center text-white font-black uppercase"
            style={{
              top: '69.6%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '48%',
              fontSize: 'clamp(7px, 2.8vw, 11.5px)',
              letterSpacing: '0.18em',
              whiteSpace: 'nowrap',
            }}
          >
            {user.role}
          </p>

          <div
            className="absolute flex items-center justify-center"
            style={{
              top: '73.7%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '24.5%',
              aspectRatio: '1 / 1',
            }}
          >
            {tokenFinal ? (
              <QRCodeSVG
                value={loginUrl}
                style={{ width: '100%', height: '100%' }}
                level="M"
                bgColor="transparent"
                fgColor="#0f2b46"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-1 bg-gray-50/60 rounded-xl">
                <QrCode className="w-1/2 h-1/2 opacity-40" />
              </div>
            )}
          </div>
        </div>

        <div className="w-full flex flex-col gap-3">
          {tokenFinal ? (
            <>
              <Button
                onClick={handlePrint}
                className="w-full h-11 text-base font-bold bg-surface-hover hover:bg-border text-text-main border-none transition-transform active:scale-95"
                variant="secondary"
                icon={<Printer className="w-5 h-5 text-primary" />}
              >
                Imprimir Documento
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="secondary"
                  onClick={handleCopyLink}
                  className="h-11 bg-surface-hover hover:bg-border text-text-main border border-border/40"
                  icon={<Copy className="w-4 h-4" />}
                >
                  Copiar
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
        description="Gerar um novo código invalidará o crachá anterior permanentemente. O colaborador precisará de um novo crachá impresso."
        variant="warning"
        confirmLabel="Sim, Renovar"
        onConfirm={() => { setConfirmRegenerar(false); executarGerarToken(); }}
        onCancel={() => setConfirmRegenerar(false)}
      />
    </Modal>
  );
}