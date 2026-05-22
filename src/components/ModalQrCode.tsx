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

  /**
   * =========================================================
   * URL
   * =========================================================
   */
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const vercelUrl = "https://klinfrota.vercel.app";
  const baseUrl = import.meta.env.VITE_APP_URL || (isLocalhost ? vercelUrl : window.location.origin);
  const tokenFinal = tokenAtual || user.matricula || undefined;
  const loginUrl = tokenFinal ? `${baseUrl}/login?magicToken=${tokenFinal}` : '';

  /**
   * =========================================================
   * DADOS DO USUÁRIO
   * =========================================================
   */
  const nameParts = useMemo(() => (user.nome || '').trim().split(' '), [user.nome]);
  const primeiroNome = nameParts[0] || '';
  const sobrenome = nameParts.slice(1).join(' ');

  /**
   * =========================================================
   * AÇÕES DA API
   * =========================================================
   */
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

  /**
   * =========================================================
   * IMPRESSÃO BLINDADA
   * =========================================================
   */
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
        {/* CARTÃO REDESENHADO – CORPORATIVO, CLEAN E MINIMALISTA              */}
        {/* ================================================================= */}
        <div
          ref={cardRef}
          style={{
            position: 'relative',
            width: '325px',
            height: '540px',
            borderRadius: '32px',
            overflow: 'hidden',
            background: 'linear-gradient(180deg, #fcfcfc 0%, #f3f4f6 100%)',
            boxShadow: '0 18px 40px rgba(0,0,0,.12), 0 4px 12px rgba(0,0,0,.08)',
            userSelect: 'none',
          }}
        >
          {/* ====================================================== */}
          {/* SVG – CAMADA DE FUNDO (APENAS ELEMENTOS VETORIAIS)      */}
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

            {/* LINHAS DECORATIVAS – EXTREMAMENTE SUTIS (opacidade 0.06) */}
            {/* Saem do topo direito e seguem orgânicas até o canto inferior esquerdo */}
            <g opacity="0.06" fill="none" stroke="#0B4C8C" strokeWidth="1.2">
              <path d="M180 -10 C230 150, 120 380, 40 560" />
              <path d="M200 -10 C260 160, 140 390, 60 570" />
              <path d="M220 -10 C280 170, 160 400, 80 580" />
            </g>

            {/* ONDA SUPERIOR */}
            <path
              d="M0 0 L325 0 L325 55 C250 20 120 25 0 0 Z"
              fill="url(#blueMain)"
            />

            {/* LINHA VERDE SUPERIOR */}
            <path
              d="M0 18 C100 42 210 18 325 50"
              stroke="url(#greenMain)"
              strokeWidth="6"
              fill="none"
            />

            {/* ONDA PRINCIPAL */}
            <path
              d="M0 305
              C75 250 155 240 325 290
              L325 425
              C230 455 130 455 0 410 Z"
              fill="url(#blueMain)"
            />

            {/* LINHA VERDE PRINCIPAL */}
            <path
              d="M0 295
              C80 240 160 235 325 280"
              stroke="url(#greenMain)"
              strokeWidth="7"
              fill="none"
            />
          </svg>

          {/* ====================================================== */}
          {/* FURO SUPERIOR – COM PROFUNDIDADE E SOMBRA INTERNA        */}
          {/* ====================================================== */}
          <div
            style={{
              position: 'absolute',
              top: '18px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '92px',
              height: '22px',
              borderRadius: '999px',
              background: '#ececec',
              boxShadow: 'inset 0 3px 8px rgba(0,0,0,.12), 0 1px 2px rgba(255,255,255,.8)',
              zIndex: 5,
            }}
          />

          {/* ====================================================== */}
          {/* LOGO – COM BASTANTE RESPIRO                              */}
          {/* ====================================================== */}
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
              style={{
                width: '155px',
                objectFit: 'contain',
              }}
            />
          </div>

          {/* ====================================================== */}
          {/* FOTO CENTRAL – TAMANHO 145px, ANEL SEGMENTADO E SOMBRA  */}
          {/* ====================================================== */}
          <div
            style={{
              position: 'absolute',
              top: '170px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 15,
            }}
          >
            {/* ANEL EXTERNO – AZUL E VERDE COM SEGMENTOS INCOMPLETOS */}
            <svg
              viewBox="0 0 170 170"
              style={{
                position: 'absolute',
                width: '170px',
                height: '170px',
                top: '-12px',
                left: '-12px',
                transform: 'rotate(-12deg)',
              }}
            >
              <circle
                cx="85"
                cy="85"
                r="77"
                stroke="#0A4C8B"
                strokeWidth="4"
                fill="none"
                strokeDasharray="260 180"
                strokeLinecap="round"
              />
              <circle
                cx="85"
                cy="85"
                r="77"
                stroke="#46BB73"
                strokeWidth="4"
                fill="none"
                strokeDasharray="70 500"
                strokeDashoffset="-230"
                strokeLinecap="round"
              />
            </svg>

            {/* FOTO COM MOLDURA BRANCA E SOMBRA */}
            <div
              style={{
                width: '145px',
                height: '145px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '6px solid white',
                boxShadow: '0 18px 45px rgba(0,0,0,.18)',
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

          {/* ====================================================== */}
          {/* NOME – IMPACTO VISUAL COM TIPOGRAFIA FORTE               */}
          {/* ====================================================== */}
          <div
            style={{
              position: 'absolute',
              top: '345px',
              width: '100%',
              zIndex: 20,
              textAlign: 'center',
              padding: '0 20px',
            }}
          >
            <h2
              style={{
                margin: 0,
                color: '#FFFFFF',
                fontSize: '42px',
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
                marginTop: '6px',
                color: '#74D89A',
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '1.8px',
                textTransform: 'uppercase',
              }}
            >
              {sobrenome}
            </div>

            {/* LINHA DECORATIVA ABAIXO DO NOME */}
            <div
              style={{
                width: '42px',
                height: '4px',
                borderRadius: '999px',
                background: '#6CDA94',
                margin: '14px auto 0',
              }}
            />
          </div>

          {/* ====================================================== */}
          {/* TAG DE FUNÇÃO – GRADIENTE, SOMBRA E ARREDONDADA        */}
          {/* ====================================================== */}
          <div
            style={{
              position: 'absolute',
              top: '430px',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              zIndex: 20,
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #46BB73, #69D991)',
                color: '#fff',
                padding: '10px 28px',
                borderRadius: '999px',
                fontWeight: 800,
                fontSize: '12px',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                boxShadow: '0 8px 20px rgba(70,187,115,.35)',
              }}
            >
              {user.role}
            </div>
          </div>

          {/* ====================================================== */}
          {/* QR CODE – TAMANHO 108px, CANTONEIRAS SUTIS              */}
          {/* ====================================================== */}
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
                background: '#fff',
                padding: '12px',
                borderRadius: '18px',
                boxShadow: '0 15px 40px rgba(0,0,0,.16)',
              }}
            >
              {/* CANTOS (CANTONEIRAS) – 24px x 24px, borda 3px */}
              <div style={{
                position:'absolute',
                top:0, left:0,
                width:'24px', height:'24px',
                borderTop:'3px solid #46BB73',
                borderLeft:'3px solid #46BB73',
                borderTopLeftRadius:'18px'
              }}/>
              <div style={{
                position:'absolute',
                top:0, right:0,
                width:'24px', height:'24px',
                borderTop:'3px solid #0A4C8B',
                borderRight:'3px solid #0A4C8B',
                borderTopRightRadius:'18px'
              }}/>
              <div style={{
                position:'absolute',
                bottom:0, left:0,
                width:'24px', height:'24px',
                borderBottom:'3px solid #46BB73',
                borderLeft:'3px solid #46BB73',
                borderBottomLeftRadius:'18px'
              }}/>
              <div style={{
                position:'absolute',
                bottom:0, right:0,
                width:'24px', height:'24px',
                borderBottom:'3px solid #0A4C8B',
                borderRight:'3px solid #0A4C8B',
                borderBottomRightRadius:'18px'
              }}/>

              {tokenFinal ? (
                <QRCodeSVG
                  value={loginUrl}
                  size={108}
                  level="M"
                />
              ) : (
                <div
                  style={{
                    width:'108px',
                    height:'108px',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    background:'#f1f5f9',
                    borderRadius:'12px'
                  }}
                >
                  <QrCode size={40} color="#94a3b8" />
                </div>
              )}
            </div>
          </div>

          {/* ====================================================== */}
          {/* RODAPÉ – DISCRETO E CORPORATIVO                         */}
          {/* ====================================================== */}
          <div
            style={{
              position: 'absolute',
              bottom: '14px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              zIndex: 20,
            }}
          >
            <ShieldCheck size={14} color="#46BB73" />
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

        {/* ================================================================= */}
        {/* BOTÕES DE AÇÃO – GERAR, COPIAR LINK, IMPRIMIR                      */}
        {/* ================================================================= */}
        <div className="flex flex-wrap justify-center gap-3 w-full">
          <Button
            onClick={handleGerarNovo}
            disabled={loading}
            isLoading={loading}
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {tokenAtual ? 'Regenerar Credencial' : 'Gerar Credencial'}
          </Button>

          <Button
            onClick={handleCopyLink}
            disabled={!loginUrl}
            variant="outline"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar Link
          </Button>

          <Button onClick={handlePrint} variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>

        {/* ================================================================= */}
        {/* MODAL DE CONFIRMAÇÃO PARA REGENERAR TOKEN                         */}
        {/* ================================================================= */}
        <ConfirmModal
          isOpen={confirmRegenerar}
          title="Regenerar credencial?"
          description="Isso invalidará o token atual."
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