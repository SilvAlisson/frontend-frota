import { useState, useRef } from 'react';
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
  user: User;
  onClose: () => void;
  onUpdate?: () => void;
}

// === COMPONENTE: Logo Institucional ===
const KlinLogo = ({ textClass = "text-text-main", size = "small" }) => (
  <div className={`flex items-center ${size === 'small' ? 'gap-1.5' : 'gap-2.5'}`}>
    <div className={`rounded-full flex items-center justify-center text-white font-bold ${size === 'small' ? 'w-5 h-5 text-[9px]' : 'w-8 h-8 text-[13px]'}`} style={{ backgroundColor: '#2563eb' /* primary */ }}>
      K
    </div>
    <div className={`font-header font-black tracking-tighter ${textClass} ${size === 'small' ? 'text-xs' : 'text-lg'}`}>
      KLIN<span className="font-light"> Engenharia</span>
    </div>
  </div>
);

export function ModalQrCode({ user, onClose, onUpdate }: ModalQrCodeProps) {
  const queryClient = useQueryClient();
  const [tokenAtual, setTokenAtual] = useState<string | null>(
    (user as User & { loginToken?: string }).loginToken || null
  );
  const [loading, setLoading] = useState(false);
  const [confirmRegenerar, setConfirmRegenerar] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  /**
   * ✨ Lógica de Link Protegido
   */
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const vercelUrl = "https://klinfrota.vercel.app";
  const baseUrl = import.meta.env.VITE_APP_URL || (isLocalhost ? vercelUrl : window.location.origin);

  const tokenFinal = tokenAtual || user.matricula;
  const loginUrl = tokenFinal ? `${baseUrl}/login?magicToken=${tokenFinal}` : '';

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
      if (import.meta.env.DEV) console.error(error);
      toast.error("Erro ao gerar credencial.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!loginUrl) return;
    navigator.clipboard.writeText(loginUrl);
    toast.success("Link de acesso copiado!");
  };

  /**
   * ✨ Lógica de Impressão (Blindada com medidas exatas)
   */
  const handlePrint = () => {
    const printContent = cardRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=800,height=900');
    if (printWindow) {
      const styles = Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(style => style.outerHTML)
        .join('\n');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <base href="${window.location.origin}">
            <title>Crachá Funcional - ${user.nome}</title>
            ${styles}
            <style>
              @page { size: portrait; margin: 0mm; }
              body { 
                display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;
                background: white; 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              /* Força a remoção da sombra na impressão e adiciona a linha de corte */
              .no-print-shadow { 
                box-shadow: none !important; 
                border: 1px dashed #cbd5e1 !important; 
              }
            </style>
          </head>
          <body>
            <div style="transform: scale(1.0); transform-origin: center; padding: 20px;">
              ${printContent.outerHTML}
            </div>
            <script>
              window.onload = () => {
                setTimeout(() => { window.print(); window.close(); }, 400);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  /**
   * ✨ Formatação do Nome e Cores
   */
  const nameParts = (user.nome || '').trim().split(' ');
  const primeiroNome = nameParts[0] || '';
  const sobrenome = nameParts.slice(1).join(' ');

  const getRoleBadgeColor = (role: string) => {
    const map: Record<string, string> = {
      'ADMIN': 'bg-rose-100 text-rose-700 border-rose-200',
      'ENCARREGADO': 'bg-blue-100 text-blue-700 border-blue-200',
      'OPERADOR': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'RH': 'bg-purple-100 text-purple-700 border-purple-200',
    };
    return map[role] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Identidade Funcional" className="max-w-[390px]">
      <div className="flex flex-col items-center gap-6">
        
        {/* === CRACHÁ PREMIUM (MODELO LIMPO 100% FIEL) === */}
        <div
          ref={cardRef}
          className="no-print-shadow w-[320px] bg-white rounded-[32px] shadow-2xl overflow-hidden relative flex flex-col select-none border border-border/50"
          style={{ height: '520px' }} // Altura fixa para garantir a proporção na impressão
        >
          {/* === HEADER AZUL === */}
          {/* Usamos backgroundColor inline para garantir que a impressora SEMPRE pinte o fundo */}
          <div className="h-32 relative flex items-center justify-center pt-2" style={{ backgroundColor: '#1a2333' }}>
            {/* Efeito Arqueado Inferior */}
            <div className="absolute -bottom-10 left-0 right-0 h-20 rounded-b-[50%] z-0" style={{ backgroundColor: '#1a2333' }}></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <KlinLogo textClass="text-white" size="large" />
            </div>
          </div>

          {/* === CORPO DO CRACHÁ === */}
          <div className="flex-1 flex flex-col items-center px-6 relative z-10 -mt-16" style={{ backgroundColor: 'transparent' }}>

            {/* Foto Centrada */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-white p-1 shadow-lg ring-1 ring-slate-200">
                <Avatar
                  nome={user.nome}
                  url={user.fotoUrl}
                  className="w-full h-full text-4xl shadow-none border-none"
                />
              </div>
              <div className="absolute bottom-1 right-1 bg-emerald-500 text-white p-1 rounded-full border-[3px] border-white shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            {/* Nome do Colaborador */}
            <div className="text-center mt-5 w-full">
              <h2 className="leading-tight text-slate-900">
                <span className="block text-2xl font-black tracking-tight">{primeiroNome}</span>
                <span className="block text-lg font-light text-slate-600 uppercase tracking-wide">{sobrenome}</span>
              </h2>
            </div>

            {/* Função / Matrícula */}
            <div className="mt-3 flex flex-wrap justify-center items-center gap-2">
              <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getRoleBadgeColor(user.role)}`}>
                {user.role}
              </div>
              {user.matricula && (
                <div className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-slate-200 bg-slate-50 text-slate-600">
                  ID: {user.matricula}
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="mt-auto mb-6 w-full flex flex-col items-center gap-3">
              <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
                {tokenFinal ? (
                  <QRCodeSVG value={loginUrl} size={110} level="M" className="opacity-95" />
                ) : (
                  <div className="w-[110px] h-[110px] flex flex-col gap-1 items-center justify-center bg-slate-50 rounded-xl text-slate-400">
                    <QrCode className="w-8 h-8 opacity-50" />
                    <span className="text-[10px] font-medium">Inativo</span>
                  </div>
                )}
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Acesso Pessoal Único</span>
            </div>
          </div>

          {/* === FOOTER AZUL === */}
          <div className="h-14 relative flex items-center justify-center" style={{ backgroundColor: '#1a2333' }}>
             {/* Efeito Arqueado Superior */}
            <div className="absolute -top-10 left-0 right-0 h-20 rounded-t-[50%] z-0" style={{ backgroundColor: '#1a2333' }}></div>
            
            <div className="relative z-10 flex flex-col items-center gap-1">
              <div className="w-12 h-1 bg-blue-500/50 rounded-full mb-1"></div>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.3em]">Uso Exclusivo Operacional</p>
            </div>
          </div>
        </div>

        {/* === BOTÕES DE AÇÃO === */}
        <div className="w-full flex flex-col gap-3">
          {tokenFinal ? (
            <>
              <Button
                onClick={handlePrint}
                className="w-full h-12 text-base font-bold bg-slate-100 hover:bg-slate-200 text-slate-900 border-none transition-transform active:scale-95"
                variant="secondary"
                icon={<Printer className="w-5 h-5 text-blue-600" />}
              >
                Imprimir Crachá
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="secondary"
                  onClick={handleCopyLink}
                  className="h-11 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                  icon={<Copy className="w-4 h-4" />}
                >
                  Copiar Link
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleGerarNovo}
                  isLoading={loading}
                  className="h-11 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100"
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Renovar
                </Button>
              </div>
            </>
          ) : (
            <Button
              onClick={handleGerarNovo}
              className="w-full h-12 text-base shadow-xl bg-blue-600 hover:bg-blue-700 text-white border-none font-bold"
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