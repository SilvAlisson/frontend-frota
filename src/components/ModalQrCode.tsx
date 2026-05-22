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
            borderRadius: '32px',
            overflow: 'hidden',
            background: 'linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)',
            boxShadow: '0 15px 35px rgba(0,0,0,0.07), 0 3px 10px rgba(0,0,0,0.04)',
            userSelect: 'none',
          }}
        >
          <svg
            viewBox="0 0 325 540"
            preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
          >
            <defs>
              <linearGradient id="blue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0B2B4F" />
                <stop offset="100%" stopColor="#0F4477" />
              </linearGradient>
              <linearGradient id="green" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2E8B57" />
                <stop offset="100%" stopColor="#5CBF7B" />
              </linearGradient>
            </defs>

            {/* Linhas decorativas ultra sutis (apenas um leve toque) */}
            <g opacity="0.03" fill="none" stroke="#0B2B4F" strokeWidth="1">
              <path d="M170 -10 Q220 140 10 540" />
              <path d="M200 -10 Q260 160 30 550" />
            </g>

            {/* Onda superior (leve, apenas no topo direito) */}
            <path d="M0 0 L325 0 L325 45 Q280 10 0 10 Z" fill="url(#blue)" />

            {/* Linha verde superior fina */}
            <path d="M0 12 Q180 28 325 42" stroke="url(#green)" strokeWidth="4" fill="none" />

            {/* Onda principal (limpa, atrás do nome e foto, sem exageros) */}
            <path
              d="M0 310 C100 240 200 240 325 290 L325 420 C220 450 110 450 0 410 Z"
              fill="url(#blue)"
            />

            {/* Linha verde sobre a onda principal */}
            <path
              d="M0 295 C100 225 200 225 325 280"
              stroke="url(#green)"
              strokeWidth="5"
              fill="none"
            />
          </svg>

          {/* Furo */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '90px',
              height: '20px',
              borderRadius: '999px',
              background: '#e5e7eb',
              boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.08)',
              zIndex: 5,
            }}
          />

          {/* Nome da empresa em vez da logo */}
          <div
            style={{
              position: 'absolute',
              top: '66px',
              width: '100%',
              textAlign: 'center',
              zIndex: 10,
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '18px',
                fontWeight: 700,
                letterSpacing: '2px',
                color: '#0F4477',
                textTransform: 'uppercase',
              }}
            >
              Klin Engenharia
            </span>
            <div
              style={{
                width: '32px',
                height: '2px',
                background: '#5CBF7B',
                margin: '6px auto 0',
                borderRadius: '1px',
              }}
            />
          </div>

          {/* Foto */}
          <div
            style={{
              position: 'absolute',
              top: '170px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 15,
            }}
          >
            {/* Anel minimalista */}
            <svg
              viewBox="0 0 160 160"
              style={{
                position: 'absolute',
                width: '160px',
                height: '160px',
                top: '-10px',
                left: '-10px',
                transform: 'rotate(-12deg)',
              }}
            >
              <circle cx="80" cy="80" r="72" stroke="#0F4477" strokeWidth="3" fill="none" strokeDasharray="200 160" strokeLinecap="round" />
              <circle cx="80" cy="80" r="72" stroke="#2E8B57" strokeWidth="3" fill="none" strokeDasharray="50 400" strokeDashoffset="-200" strokeLinecap="round" />
            </svg>

            <div
              style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '5px solid white',
                boxShadow: '0 12px 28px rgba(0,0,0,0.10)',
                background: '#fff',
              }}
            >
              <Avatar nome={user.nome} url={user.fotoUrl} className="w-full h-full border-none shadow-none" />
            </div>
          </div>

          {/* Nome do usuário */}
          <div
            style={{
              position: 'absolute',
              top: '340px',
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
                fontSize: '40px',
                fontWeight: 900,
                letterSpacing: '-2px',
                lineHeight: 1,
                textTransform: 'uppercase',
              }}
            >
              {primeiroNome}
            </h2>
            <div
              style={{
                marginTop: '4px',
                color: '#BCE0CA',
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            >
              {sobrenome}
            </div>
          </div>

          {/* Tag da função */}
          <div
            style={{
              position: 'absolute',
              top: '424px',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              zIndex: 20,
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #2E8B57, #4CAF7A)',
                color: 'white',
                padding: '8px 24px',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '11px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                boxShadow: '0 4px 12px rgba(46,139,87,0.2)',
              }}
            >
              {user.role}
            </div>
          </div>

          {/* QR Code */}
          <div
            style={{
              position: 'absolute',
              bottom: '48px',
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
                padding: '8px',
                borderRadius: '16px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
              }}
            >
              {/* Cantoneiras sutis */}
              <div style={{ position:'absolute', top:0, left:0, width:'22px', height:'22px', borderTop:'2px solid #2E8B57', borderLeft:'2px solid #2E8B57', borderTopLeftRadius:'16px' }} />
              <div style={{ position:'absolute', top:0, right:0, width:'22px', height:'22px', borderTop:'2px solid #0F4477', borderRight:'2px solid #0F4477', borderTopRightRadius:'16px' }} />
              <div style={{ position:'absolute', bottom:0, left:0, width:'22px', height:'22px', borderBottom:'2px solid #2E8B57', borderLeft:'2px solid #2E8B57', borderBottomLeftRadius:'16px' }} />
              <div style={{ position:'absolute', bottom:0, right:0, width:'22px', height:'22px', borderBottom:'2px solid #0F4477', borderRight:'2px solid #0F4477', borderBottomRightRadius:'16px' }} />

              {tokenFinal ? (
                <QRCodeSVG value={loginUrl} size={100} level="M" />
              ) : (
                <div style={{ width:'100px', height:'100px', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc', borderRadius:'12px' }}>
                  <QrCode size={40} color="#94a3b8" />
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
              gap: '5px',
              zIndex: 20,
            }}
          >
            <ShieldCheck size={12} color="#2E8B57" />
            <span
              style={{
                color: '#0A2540',
                fontSize: '8px',
                fontWeight: 700,
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