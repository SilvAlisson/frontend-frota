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
            background: '#ffffff',
            boxShadow: '0 10px 30px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
            userSelect: 'none',
          }}
        >
          {/* SVG decorativo de fundo */}
          <svg
            viewBox="0 0 325 540"
            preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
          >
            <defs>
              <linearGradient id="blueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0A2A4A" />
                <stop offset="100%" stopColor="#0F4477" />
              </linearGradient>
              <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2E8B57" />
                <stop offset="100%" stopColor="#5CBF7B" />
              </linearGradient>
            </defs>

            {/* Faixa superior azul (cabeçalho limpo) */}
            <rect x="0" y="0" width="325" height="135" fill="url(#blueGrad)" />

            {/* Linha verde fina separando o cabeçalho */}
            <rect x="0" y="135" width="325" height="3" fill="url(#greenGrad)" />

            {/* Padrão geométrico sutil no cabeçalho (linhas diagonais finas) */}
            <g opacity="0.06" stroke="#ffffff" strokeWidth="1">
              <line x1="0" y1="30" x2="325" y2="80" />
              <line x1="0" y1="60" x2="325" y2="110" />
              <line x1="0" y1="90" x2="325" y2="140" />
              <line x1="0" y1="120" x2="200" y2="135" />
            </g>

            {/* Pequeno detalhe geométrico no canto superior direito */}
            <circle cx="310" cy="20" r="40" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.15" />
            <circle cx="310" cy="20" r="60" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.08" />

            {/* Rodapé azul inferior (faixa final limpa) */}
            <rect x="0" y="480" width="325" height="60" fill="url(#blueGrad)" />

            {/* Linha verde fina separando o rodapé */}
            <rect x="0" y="477" width="325" height="3" fill="url(#greenGrad)" />
          </svg>

          {/* ====================================================== */}
          {/* CABEÇALHO – EMPRESA + FOTO + NOME                       */}
          {/* ====================================================== */}

          {/* Nome da empresa */}
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
                fontSize: '16px',
                fontWeight: 700,
                letterSpacing: '3px',
                textTransform: 'uppercase',
              }}
            >
              Klin Engenharia
            </span>
            <div
              style={{
                width: '28px',
                height: '2px',
                background: '#5CBF7B',
                margin: '6px auto 0',
                borderRadius: '1px',
              }}
            />
          </div>

          {/* Foto (menor, com espaço adequado) */}
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
              border: '4px solid white',
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
              background: '#fff',
              zIndex: 10,
            }}
          >
            <Avatar nome={user.nome} url={user.fotoUrl} className="w-full h-full border-none shadow-none" />
          </div>

          {/* Nome do usuário (agora na área branca, com espaço) */}
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
                color: '#0A2A4A',
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
                color: '#64748B',
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            >
              {sobrenome}
            </div>
          </div>

          {/* ====================================================== */}
          {/* CORPO – FUNÇÃO + QR CODE                                 */}
          {/* ====================================================== */}

          {/* Tag da função */}
          <div
            style={{
              position: 'absolute',
              top: '278px',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <div
              style={{
                background: '#0F4477',
                color: 'white',
                padding: '8px 22px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '11px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                boxShadow: '0 2px 8px rgba(15,68,119,0.2)',
              }}
            >
              {user.role}
            </div>
          </div>

          {/* QR Code (área dedicada, sem sobreposição) */}
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
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              }}
            >
              {tokenFinal ? (
                <QRCodeSVG value={loginUrl} size={110} level="M" />
              ) : (
                <div
                  style={{
                    width: '110px',
                    height: '110px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    border: '1px dashed #CBD5E1',
                  }}
                >
                  <QrCode size={44} color="#94a3b8" />
                </div>
              )}
            </div>
          </div>

          {/* ====================================================== */}
          {/* RODAPÉ – IDENTIDADE FUNCIONAL                            */}
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
            <ShieldCheck size={12} color="#5CBF7B" />
            <span
              style={{
                color: 'white',
                fontSize: '9px',
                fontWeight: 600,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                opacity: 0.9,
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