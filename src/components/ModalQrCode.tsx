import { useState, useRef, useMemo } from 'react';
import { Modal } from './ui/Modal';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import { Printer, RefreshCw, QrCode, Download, Share2, Fingerprint } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '../types';
import { ConfirmModal } from './ui/ConfirmModal';
import { useReactToPrint } from 'react-to-print';
import { useWebAuthn } from '../hooks/useWebAuthn';

interface ModalQrCodeProps {
  user: User & { loginToken?: string };
  onClose: () => void;
  onUpdate?: () => void;
}

export function ModalQrCode({ user, onClose, onUpdate }: ModalQrCodeProps) {
  const queryClient = useQueryClient();
  const { registerDevice, isRegistering } = useWebAuthn();
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
      const { data } = await api.post(`/auth-custom/user/${user.id}/generate-token`);
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

  const handleCopyLink = () => {
    if (!loginUrl) return;
    navigator.clipboard.writeText(loginUrl);
    toast.success("Link copiado!");
  };

  const handleShare = async () => {
    if (!loginUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Acesso - Frota KLIN',
          text: `Olá ${primeiroNome}, aqui está seu acesso rápido para o sistema da Frota KLIN:\n`,
          url: loginUrl,
        });
        toast.success("Compartilhado com sucesso!");
      } catch (err) {
        if (import.meta.env.DEV) console.log("Erro ao compartilhar ou compartilhamento cancelado", err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: cardRef,
    documentTitle: `Crachá - ${user.nome}`,
    pageStyle: `
      @page { size: auto; margin: 0; }
      body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .print-cracha { width: 380px !important; height: auto !important; box-shadow: none !important; margin: auto !important; }
    `
  });

  return (
    <Modal isOpen={true} onClose={onClose} title="Identidade Funcional" className="max-w-[380px]">
      <div className="flex flex-col items-center gap-6">
        <div
          ref={cardRef}
          className="w-full relative select-none shadow-2xl print-cracha"
          style={{
            containerType: 'inline-size',
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
              top: '26%',
              left: '50.2%',
              transform: 'translateX(-50%)',
              width: '37.5%',
              aspectRatio: '1 / 1',
            }}
          >
            <Avatar
              nome={user.nome}
              url={user.fotoUrl || user.image}
              className="w-full h-full rounded-full border-none shadow-none"
            />
          </div>

          <p
            className="absolute text-center text-white font-black uppercase leading-none truncate"
            style={{
              top: '53.5%',
              left: '5%',
              right: '5%',
              fontSize: 'clamp(18px, 8.5cqi, 34px)',
              letterSpacing: '0.05em',
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            }}
          >
            {primeiroNome}
          </p>

          <p
            className="absolute text-center font-bold uppercase leading-none truncate"
            style={{
              top: '60.5%',
              left: '5%',
              right: '5%',
              fontSize: 'clamp(7px, 3cqi, 13px)',
              letterSpacing: '0.22em',
              color: '#4ade80',
            }}
          >
            {sobrenome}
          </p>

          <p
            className="absolute text-center text-white font-black uppercase"
            style={{
              top: '65.4%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80%',
              fontSize: 'clamp(7px, 2.8cqi, 11.5px)',
              letterSpacing: '0.18em',
              whiteSpace: 'nowrap',
            }}
          >
            {user.role}
          </p>

          <div
            className="absolute flex items-center justify-center"
            style={{
              top: '80.5%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '27%',
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
                onClick={registerDevice}
                isLoading={isRegistering}
                className="w-full h-11 text-base font-black bg-surface hover:bg-surface-hover text-text-main border-border/60 transition-transform active:scale-95 mb-1 shadow-sm"
                variant="secondary"
                icon={!isRegistering ? <Fingerprint className="w-5 h-5 text-primary" /> : undefined}
              >
                Cadastrar Biometria no Aparelho
              </Button>

              <Button
                onClick={handlePrint}
                className="w-full h-11 text-sm font-bold bg-surface-hover hover:bg-border text-text-main border-none transition-transform active:scale-95"
                variant="secondary"
                icon={<Printer className="w-5 h-5 text-primary" />}
              >
                Imprimir Documento
              </Button>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="secondary"
                  onClick={handleShare}
                  className="h-11 px-0 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                  icon={<Share2 className="w-4 h-4" />}
                >
                  Enviar
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleGerarNovo}
                  isLoading={loading}
                  className="h-11 px-0 bg-error/10 hover:bg-error/20 text-error border border-error/20"
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
