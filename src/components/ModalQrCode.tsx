import { useState, useRef, useMemo } from 'react';
import { Modal } from './ui/Modal';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import {
  Printer,
  RefreshCw,
  Copy,
  QrCode,
  ShieldCheck,
  Download,
} from 'lucide-react';

import { useQueryClient } from '@tanstack/react-query';

import type { User } from '../types';

import { ConfirmModal } from './ui/ConfirmModal';

interface ModalQrCodeProps {
  user: User;
  onClose: () => void;
  onUpdate?: () => void;
}

/**
 * =========================================================
 * CONFIG
 * =========================================================
 */

export function ModalQrCode({
  user,
  onClose,
  onUpdate,
}: ModalQrCodeProps) {
  const queryClient = useQueryClient();

  const [tokenAtual, setTokenAtual] = useState<string | null>(
    (user as User & { loginToken?: string }).loginToken || null
  );

  const [loading, setLoading] = useState(false);

  const [confirmRegenerar, setConfirmRegenerar] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  /**
   * =========================================================
   * URL
   * =========================================================
   */

  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  const vercelUrl = 'https://klinfrota.vercel.app';

  const baseUrl =
    import.meta.env.VITE_APP_URL ||
    (isLocalhost ? vercelUrl : window.location.origin);

  const tokenFinal = tokenAtual || user.matricula;

  const loginUrl = tokenFinal
    ? `${baseUrl}/login?magicToken=${tokenFinal}`
    : '';

  /**
   * =========================================================
   * USER
   * =========================================================
   */

  const nameParts = useMemo(
    () => (user.nome || '').trim().split(' '),
    [user.nome]
  );

  const primeiroNome = nameParts[0] || '';

  const sobrenome = nameParts.slice(1).join(' ');

  /**
   * =========================================================
   * ROLE BADGE
   * =========================================================
   */

  const getRoleBadge = (role: string) => {
    const map: Record<
      string,
      {
        bg: string;
        border: string;
        text: string;
      }
    > = {
      ADMIN: {
        bg: 'rgba(244,63,94,.12)',
        border: 'rgba(244,63,94,.2)',
        text: '#E11D48',
      },

      ENCARREGADO: {
        bg: 'rgba(59,130,246,.12)',
        border: 'rgba(59,130,246,.2)',
        text: '#2563EB',
      },

      OPERADOR: {
        bg: 'rgba(16,185,129,.12)',
        border: 'rgba(16,185,129,.2)',
        text: '#059669',
      },

      RH: {
        bg: 'rgba(168,85,247,.12)',
        border: 'rgba(168,85,247,.2)',
        text: '#9333EA',
      },
    };

    return (
      map[role] || {
        bg: '#F8FAFC',
        border: '#E2E8F0',
        text: '#334155',
      }
    );
  };

  const roleBadge = getRoleBadge(user.role);

  /**
   * =========================================================
   * GENERATE TOKEN
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
      const { data } = await api.post(
        `/auth/user/${user.id}/generate-token`
      );

      setTokenAtual(data.loginToken);

      await queryClient.invalidateQueries({
        queryKey: ['users'],
      });

      toast.success('Credencial atualizada com sucesso!');

      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(error);

      toast.error('Erro ao gerar credencial.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * =========================================================
   * COPY
   * =========================================================
   */

  const handleCopyLink = () => {
    if (!loginUrl) return;

    navigator.clipboard.writeText(loginUrl);

    toast.success('Link copiado!');
  };

  /**
   * =========================================================
   * PRINT
   * =========================================================
   */

  const handlePrint = () => {
    const printContent = cardRef.current;

    if (!printContent) return;

    const printWindow = window.open(
      '',
      '',
      'width=900,height=900'
    );

    if (printWindow) {
      const styles = Array.from(
        document.head.querySelectorAll(
          'style, link[rel="stylesheet"]'
        )
      )
        .map((style) => style.outerHTML)
        .join('\n');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Crachá - ${user.nome}</title>

            ${styles}

            <style>
              @page {
                size: auto;
                margin: 0;
              }

              body {
                margin: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: white;

                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              .card-print {
                transform: scale(1);
              }
            </style>
          </head>

          <body>
            <div class="card-print">
              ${printContent.outerHTML}
            </div>

            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 400);
              };
            </script>
          </body>
        </html>
      `);

      printWindow.document.close();
    }
  };

  /**
   * =========================================================
   * COMPONENT
   * =========================================================
   */

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Identidade Funcional"
      className="max-w-[420px]"
    >
      <div className="flex flex-col items-center gap-6">

        {/* ================================================= */}
        {/* CARD */}
        {/* ================================================= */}

        <div
          ref={cardRef}
          className="
            relative
            w-[325px]
            h-[540px]
            overflow-hidden
            rounded-[34px]
            bg-white
            border
            border-slate-200
            shadow-[0_25px_80px_rgba(15,23,42,0.18)]
            select-none
          "
        >
          {/* ================================================= */}
          {/* BACKGROUND */}
          {/* ================================================= */}

          <div className="absolute inset-0 bg-white" />

          {/* ================================================= */}
          {/* TOP WAVES */}
          {/* ================================================= */}

          <svg
            className="absolute inset-0"
            viewBox="0 0 325 540"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="blueGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#062B5B" />
                <stop offset="100%" stopColor="#0B4C8C" />
              </linearGradient>

              <linearGradient
                id="greenGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#3FB26B" />
                <stop offset="100%" stopColor="#67D38F" />
              </linearGradient>
            </defs>

            {/* TOP */}
            <path
              d="
                M0 0
                L325 0
                L325 80
                C240 50 140 60 0 35
                Z
              "
              fill="url(#blueGradient)"
            />

            {/* GREEN LINE */}
            <path
              d="
                M0 42
                C110 60 210 42 325 72
              "
              stroke="url(#greenGradient)"
              strokeWidth="5"
              fill="none"
            />

            {/* MAIN BLUE WAVE */}
            <path
              d="
                M0 285
                C80 215 205 355 325 270
                L325 430
                C220 470 110 470 0 405
                Z
              "
              fill="url(#blueGradient)"
            />

            {/* GREEN STROKE */}
            <path
              d="
                M0 280
                C80 210 205 350 325 265
              "
              stroke="url(#greenGradient)"
              strokeWidth="7"
              fill="none"
            />

            {/* FOOTER */}
            <path
              d="
                M0 515
                C100 480 220 495 325 460
                L325 540
                L0 540
                Z
              "
              fill="url(#blueGradient)"
            />

            {/* DECORATIVE LINES */}
            <g opacity="0.12">
              {Array.from({ length: 10 }).map((_, i) => (
                <path
                  key={i}
                  d={`
                    M${-40 + i * 10} 520
                    C120 460 220 470 360 390
                  `}
                  stroke="#3FB26B"
                  strokeWidth="1"
                  fill="none"
                />
              ))}
            </g>

            {/* TOP LINES */}
            <g opacity="0.08">
              {Array.from({ length: 10 }).map((_, i) => (
                <path
                  key={`top-${i}`}
                  d={`
                    M${140 + i * 10} 0
                    C260 40 260 90 325 140
                  `}
                  stroke="#0B4C8C"
                  strokeWidth="1"
                  fill="none"
                />
              ))}
            </g>
          </svg>

          {/* ================================================= */}
          {/* CONTENT */}
          {/* ================================================= */}

          <div className="relative z-10 h-full flex flex-col items-center">

            {/* ================================================= */}
            {/* HOLE */}
            {/* ================================================= */}

            <div
              className="
                mt-5
                w-[88px]
                h-[18px]
                rounded-full
                bg-white
                border
                border-slate-300
                shadow-inner
              "
            />

            {/* ================================================= */}
            {/* LOGO */}
            {/* ================================================= */}

            <div className="mt-8 flex flex-col items-center">
              {/* USE SUA LOGO REAL */}
              <img
                src="/assets/klin-logo.png"
                alt="Klin Engenharia"
                className="w-[190px] object-contain"
              />
            </div>

            {/* ================================================= */}
            {/* PHOTO */}
            {/* ================================================= */}

            <div className="relative mt-10">

              {/* OUTER RING */}
              <div
                className="
                  absolute
                  inset-[-10px]
                  rounded-full
                  border-[4px]
                  border-white
                  opacity-90
                "
              />

              {/* CUSTOM STROKES */}
              <svg
                className="
                  absolute
                  inset-[-16px]
                  w-[160px]
                  h-[160px]
                  -rotate-12
                "
                viewBox="0 0 160 160"
              >
                <circle
                  cx="80"
                  cy="80"
                  r="72"
                  stroke="#062B5B"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray="280 180"
                  strokeLinecap="round"
                />

                <circle
                  cx="80"
                  cy="80"
                  r="72"
                  stroke="#3FB26B"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray="80 400"
                  strokeDashoffset="-220"
                  strokeLinecap="round"
                />
              </svg>

              {/* PHOTO */}
              <div
                className="
                  relative
                  w-[150px]
                  h-[150px]
                  rounded-full
                  overflow-hidden
                  border-[6px]
                  border-white
                  shadow-[0_20px_50px_rgba(15,23,42,0.22)]
                  bg-white
                "
              >
                <Avatar
                  nome={user.nome}
                  url={user.fotoUrl}
                  className="w-full h-full border-none shadow-none"
                />
              </div>

              {/* VERIFIED */}
              <div
                className="
                  absolute
                  bottom-2
                  right-2
                  w-10
                  h-10
                  rounded-full
                  bg-emerald-500
                  border-4
                  border-white
                  flex
                  items-center
                  justify-center
                  shadow-lg
                "
              >
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* ================================================= */}
            {/* NAME */}
            {/* ================================================= */}

            <div className="mt-12 text-center px-6">

              <h2
                className="
                  text-[44px]
                  font-black
                  leading-none
                  tracking-[-0.04em]
                  text-white
                  drop-shadow-sm
                "
              >
                {primeiroNome}
              </h2>

              <p
                className="
                  mt-2
                  text-[15px]
                  uppercase
                  tracking-[0.08em]
                  font-medium
                  text-[#A7F3D0]
                "
              >
                {sobrenome}
              </p>

              <div
                className="
                  mx-auto
                  mt-4
                  w-12
                  h-[3px]
                  rounded-full
                  bg-[#67D38F]
                "
              />
            </div>

            {/* ================================================= */}
            {/* ROLE */}
            {/* ================================================= */}

            <div
              className="
                mt-6
                px-7
                py-3
                rounded-full
                border
                backdrop-blur-sm
                shadow-lg
              "
              style={{
                background: roleBadge.bg,
                borderColor: roleBadge.border,
                color: '#FFFFFF',
              }}
            >
              <span
                className="
                  text-[13px]
                  font-black
                  uppercase
                  tracking-[0.16em]
                "
              >
                {user.role}
              </span>
            </div>

            {/* ================================================= */}
            {/* QR */}
            {/* ================================================= */}

            <div className="mt-auto mb-10 flex flex-col items-center">

              <div className="relative">

                {/* CORNERS */}
                <div className="absolute inset-0 pointer-events-none">

                  <div className="absolute top-0 left-0 w-6 h-6 border-l-[3px] border-t-[3px] rounded-tl-xl border-[#3FB26B]" />

                  <div className="absolute top-0 right-0 w-6 h-6 border-r-[3px] border-t-[3px] rounded-tr-xl border-[#062B5B]" />

                  <div className="absolute bottom-0 left-0 w-6 h-6 border-l-[3px] border-b-[3px] rounded-bl-xl border-[#062B5B]" />

                  <div className="absolute bottom-0 right-0 w-6 h-6 border-r-[3px] border-b-[3px] rounded-br-xl border-[#3FB26B]" />
                </div>

                <div
                  className="
                    relative
                    bg-white
                    rounded-[24px]
                    p-4
                    shadow-[0_15px_40px_rgba(15,23,42,0.20)]
                  "
                >
                  {tokenFinal ? (
                    <QRCodeSVG
                      value={loginUrl}
                      size={122}
                      level="M"
                      includeMargin={false}
                    />
                  ) : (
                    <div
                      className="
                        w-[122px]
                        h-[122px]
                        flex
                        flex-col
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-slate-100
                      "
                    >
                      <QrCode className="w-10 h-10 text-slate-400" />

                      <span className="text-xs text-slate-500">
                        Inativo
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#67D38F]" />

                <span
                  className="
                    text-[11px]
                    uppercase
                    tracking-[0.24em]
                    font-bold
                    text-white
                  "
                >
                  Identidade Funcional
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* ACTIONS */}
        {/* ================================================= */}

        <div className="w-full flex flex-col gap-3">

          {tokenFinal ? (
            <>
              <Button
                onClick={handlePrint}
                className="
                  w-full
                  h-12
                  text-base
                  font-bold
                  bg-slate-100
                  hover:bg-slate-200
                  text-slate-900
                  border-none
                "
                variant="secondary"
                icon={
                  <Printer className="w-5 h-5 text-blue-600" />
                }
              >
                Imprimir Crachá
              </Button>

              <div className="grid grid-cols-2 gap-3">

                <Button
                  variant="secondary"
                  onClick={handleCopyLink}
                  className="
                    h-11
                    bg-slate-50
                    hover:bg-slate-100
                    text-slate-700
                    border
                    border-slate-200
                  "
                  icon={<Copy className="w-4 h-4" />}
                >
                  Copiar Link
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleGerarNovo}
                  isLoading={loading}
                  className="
                    h-11
                    bg-red-50
                    hover:bg-red-100
                    text-red-600
                    border
                    border-red-100
                  "
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Renovar
                </Button>
              </div>
            </>
          ) : (
            <Button
              onClick={handleGerarNovo}
              className="
                w-full
                h-12
                text-base
                font-bold
                text-white
                border-none
                shadow-xl
              "
              style={{
                background:
                  'linear-gradient(135deg,#062B5B,#0B4C8C)',
              }}
              isLoading={loading}
              icon={<Download className="w-5 h-5" />}
            >
              Gerar Acesso Inicial
            </Button>
          )}
        </div>
      </div>

      {/* ================================================= */}
      {/* CONFIRM */}
      {/* ================================================= */}

      <ConfirmModal
        isOpen={confirmRegenerar}
        title="Renovar QR Code"
        description="Gerar um novo código invalidará o crachá anterior permanentemente."
        variant="warning"
        confirmLabel="Sim, Renovar"
        onConfirm={() => {
          setConfirmRegenerar(false);

          executarGerarToken();
        }}
        onCancel={() => setConfirmRegenerar(false)}
      />
    </Modal>
  );
}