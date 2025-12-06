import { useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from './ui/Button';
import { toast } from 'sonner';

interface ModalQrCodeProps {
  token: string;
  nomeUsuario: string;
  onClose: () => void;
}

export function ModalQrCode({ token, nomeUsuario, onClose }: ModalQrCodeProps) {
  const loginUrl = `${window.location.origin}/login?magicToken=${token}`;
  const cardRef = useRef<HTMLDivElement>(null);

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(loginUrl);
      toast.success("Link copiado para a área de transferência!");
    } catch (err) {
      toast.error("Não foi possível copiar.");
    }
  };

  const handlePrint = () => {
    // Cria uma janela de impressão focada apenas no conteúdo do cartão
    const printContent = cardRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=600,height=800');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Impressão de Credencial - ${nomeUsuario}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page { size: auto; margin: 0mm; }
              body { display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff; -webkit-print-color-adjust: exact; }
            </style>
          </head>
          <body>
            ${printContent.outerHTML}
            <script>
              setTimeout(() => { window.print(); window.close(); }, 500);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[99] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300 print:bg-white"
      onClick={onClose}
    >
      <div className="flex flex-col items-center gap-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>

        {/* --- CARTÃO PARA IMPRESSÃO --- */}
        <div
          ref={cardRef}
          className="w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-200 relative print:shadow-none print:border-2 print:border-gray-800"
        >
          {/* Cabeçalho do Cartão */}
          <div className="bg-slate-900 text-white p-6 text-center relative overflow-hidden">
            {/* Elementos decorativos de fundo */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute right-[-20%] top-[-20%] w-40 h-40 rounded-full bg-white blur-3xl"></div>
              <div className="absolute left-[-20%] bottom-[-20%] w-40 h-40 rounded-full bg-blue-500 blur-3xl"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              {/* Logo / Ícone da Empresa */}
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm border border-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>

              <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-slate-300 mb-1">Credencial de Acesso</h2>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">{nomeUsuario}</h1>
              <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-white border border-white/10">
                MOTORISTA / OPERADOR
              </span>
            </div>
          </div>

          {/* Corpo do Cartão (QR Code) */}
          <div className="p-8 bg-white flex flex-col items-center">
            <div className="border-4 border-slate-900 rounded-xl p-2 mb-4 bg-white shadow-sm">
              <QRCodeSVG
                value={loginUrl}
                size={180}
                bgColor={"#ffffff"}
                fgColor={"#0f172a"} // Slate-900 para alto contraste
                level={"M"}
                marginSize={0}
              />
            </div>

            <p className="text-center text-xs text-slate-500 font-medium uppercase tracking-wide mb-6">
              Escaneie para entrar no sistema
            </p>

            <div className="w-full border-t border-slate-100 pt-4 flex justify-between items-center text-[10px] text-slate-400">
              <span>Frota Inteligente v2.0</span>
              <span className="font-bold text-slate-600">Acesso Permanente</span>
            </div>
          </div>
        </div>

        {/* --- AÇÕES DE TELA (Não aparecem na impressão) --- */}
        <div className="flex flex-col gap-3 w-full print:hidden">
          <Button
            onClick={handlePrint}
            className="w-full bg-white text-slate-900 hover:bg-slate-50 shadow-lg font-bold h-12 text-base"
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" /></svg>}
          >
            Imprimir Cartão
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              onClick={handleCopyLink}
              className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" /></svg>}
            >
              Copiar Link
            </Button>

            <Button
              variant="secondary"
              onClick={onClose}
              className="bg-transparent text-white border-white/20 hover:bg-white/10"
            >
              Fechar
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}