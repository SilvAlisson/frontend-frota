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
    borderRadius: '34px',
    overflow: 'hidden',
    background: '#FAFAFA',
    boxShadow:
      '0 30px 80px rgba(15,23,42,.18), 0 8px 25px rgba(15,23,42,.08)',
    userSelect: 'none',
  }}
>

  {/* ====================================================== */}
  {/* FUNDO */}
  {/* ====================================================== */}

  {/* textura topo */}
  <div
    style={{
      position: 'absolute',
      top: '-90px',
      right: '-80px',
      width: '360px',
      height: '360px',
      borderRadius: '50%',
      background:
        'repeating-radial-gradient(circle at center, transparent, transparent 8px, rgba(10,76,139,.05) 8px, rgba(10,76,139,.05) 9px)',
      zIndex: 0,
    }}
  />

  {/* textura inferior */}
  <div
    style={{
      position: 'absolute',
      bottom: '-120px',
      left: '-120px',
      width: '360px',
      height: '360px',
      borderRadius: '50%',
      background:
        'repeating-radial-gradient(circle at center, transparent, transparent 8px, rgba(10,76,139,.05) 8px, rgba(10,76,139,.05) 9px)',
      zIndex: 0,
    }}
  />

  {/* ====================================================== */}
  {/* FORMAS SUPERIORES */}
  {/* ====================================================== */}

  {/* azul */}
  <div
    style={{
      position: 'absolute',
      top: '-130px',
      left: '-100px',
      width: '480px',
      height: '240px',
      background: '#082B57',
      borderRadius: '50%',
      transform: 'rotate(-17deg)',
      zIndex: 1,
    }}
  />

  {/* verde */}
  <div
    style={{
      position: 'absolute',
      top: '-95px',
      left: '-60px',
      width: '430px',
      height: '210px',
      background: '#4FA06B',
      borderRadius: '50%',
      transform: 'rotate(-14deg)',
      zIndex: 2,
    }}
  />

  {/* branco separador */}
  <div
    style={{
      position: 'absolute',
      top: '-75px',
      left: '-40px',
      width: '420px',
      height: '180px',
      background: '#FAFAFA',
      borderRadius: '50%',
      transform: 'rotate(-14deg)',
      zIndex: 3,
    }}
  />

  {/* ====================================================== */}
  {/* FORMAS CENTRAIS */}
  {/* ====================================================== */}

  {/* verde */}
  <div
    style={{
      position: 'absolute',
      bottom: '80px',
      left: '-120px',
      width: '520px',
      height: '240px',
      background: '#56A86F',
      borderRadius: '50%',
      transform: 'rotate(11deg)',
      zIndex: 1,
    }}
  />

  {/* faixa branca */}
  <div
    style={{
      position: 'absolute',
      bottom: '108px',
      left: '-110px',
      width: '520px',
      height: '190px',
      background: '#FAFAFA',
      borderRadius: '50%',
      transform: 'rotate(11deg)',
      zIndex: 2,
    }}
  />

  {/* azul principal */}
  <div
    style={{
      position: 'absolute',
      bottom: '40px',
      left: '-90px',
      width: '500px',
      height: '280px',
      background: '#082B57',
      borderRadius: '50%',
      transform: 'rotate(11deg)',
      zIndex: 3,
    }}
  />

  {/* ====================================================== */}
  {/* FURO */}
  {/* ====================================================== */}

  <div
    style={{
      position: 'absolute',
      top: '22px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '92px',
      height: '22px',
      borderRadius: '999px',
      background: '#ECECEC',
      boxShadow: 'inset 0 3px 10px rgba(0,0,0,.16)',
      zIndex: 20,
    }}
  />

  {/* ====================================================== */}
  {/* LOGO */}
  {/* ====================================================== */}

  <div
    style={{
      position: 'absolute',
      top: '78px',
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      zIndex: 20,
    }}
  >
    <img
      src="/assets/klin-logo.png"
      alt="Klin"
      style={{
        width: '160px',
        objectFit: 'contain',
      }}
    />
  </div>

  {/* ====================================================== */}
  {/* FOTO */}
  {/* ====================================================== */}

  <div
    style={{
      position: 'absolute',
      top: '175px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 25,
    }}
  >

    {/* aro */}
    <div
      style={{
        padding: '7px',
        borderRadius: '50%',
        background:
          'linear-gradient(135deg,#0A3A6E 0%,#0A3A6E 55%,#5BB274 55%,#5BB274 100%)',
        boxShadow: '0 15px 35px rgba(0,0,0,.16)',
      }}
    >
      <div
        style={{
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '5px solid white',
          background: '#fff',
        }}
      >
        <Avatar
          nome={user.nome}
          url={user.fotoUrl}
          className="w-full h-full border-none shadow-none"
        />
      </div>
    </div>
  </div>

  {/* ====================================================== */}
  {/* NOME */}
  {/* ====================================================== */}

  <div
    style={{
      position: 'absolute',
      top: '350px',
      width: '100%',
      textAlign: 'center',
      zIndex: 30,
      padding: '0 20px',
    }}
  >
    <h1
      style={{
        margin: 0,
        color: '#FFFFFF',
        fontSize: '44px',
        fontWeight: 900,
        letterSpacing: '-2px',
        lineHeight: 1,
        textTransform: 'uppercase',
        textShadow:
          '0 0 15px rgba(255,255,255,.25)',
      }}
    >
      {primeiroNome}
    </h1>

    <div
      style={{
        marginTop: '6px',
        color: '#74D89A',
        fontSize: '13px',
        fontWeight: 600,
        letterSpacing: '1.7px',
        textTransform: 'uppercase',
      }}
    >
      {sobrenome}
    </div>

    <div
      style={{
        width: '42px',
        height: '4px',
        borderRadius: '999px',
        background: '#74D89A',
        margin: '14px auto 0',
      }}
    />
  </div>

  {/* ====================================================== */}
  {/* FUNÇÃO */}
  {/* ====================================================== */}

  <div
    style={{
      position: 'absolute',
      top: '435px',
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      zIndex: 30,
    }}
  >
    <div
      style={{
        background:
          'linear-gradient(135deg,#4EA768,#6DCC8F)',
        color: '#fff',
        padding: '10px 34px',
        borderRadius: '999px',
        fontWeight: 800,
        fontSize: '12px',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        boxShadow:
          '0 10px 25px rgba(78,167,104,.35)',
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
      bottom: '58px',
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      zIndex: 40,
    }}
  >
    <div
      style={{
        position: 'relative',
        background: '#fff',
        padding: '12px',
        borderRadius: '18px',
        boxShadow:
          '0 15px 40px rgba(0,0,0,.18)',
      }}
    >

      {/* bordas */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '18px',
          borderTop: '4px solid #5BB274',
          borderLeft: '4px solid #5BB274',
          borderBottom: '4px solid #0A3A6E',
          borderRight: '4px solid #0A3A6E',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          background: '#fff',
          borderRadius: '12px',
          padding: '4px',
        }}
      >
        {tokenFinal ? (
          <QRCodeSVG
            value={loginUrl}
            size={112}
            level="M"
          />
        ) : (
          <div
            style={{
              width: '112px',
              height: '112px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#F1F5F9',
              borderRadius: '10px',
            }}
          >
            <QrCode size={42} color="#94A3B8" />
          </div>
        )}
      </div>
    </div>
  </div>

  {/* ====================================================== */}
  {/* RODAPÉ */}
  {/* ====================================================== */}

  <div
    style={{
      position: 'absolute',
      bottom: '14px',
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px',
      zIndex: 50,
    }}
  >
    <ShieldCheck size={15} color="#56A86F" />

    <span
      style={{
        color: '#0A3161',
        fontSize: '10px',
        fontWeight: 800,
        letterSpacing: '3px',
        textTransform: 'uppercase',
      }}
    >
      IDENTIDADE FUNCIONAL
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