import { useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from './ui/Button';
import { toast } from 'sonner';

interface ModalQrCodeProps {
  token: string;
  nomeUsuario: string;
  fotoUrl?: string | null; // Nova prop opcional
  onClose: () => void;
}

export function ModalQrCode({ token, nomeUsuario, fotoUrl, onClose }: ModalQrCodeProps) {
  const loginUrl = `${window.location.origin}/login?magicToken=${token}`;
  const cardRef = useRef<HTMLDivElement>(null);

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
      toast.success("Link copiado!");
    } catch (err) {
      toast.error("Erro ao copiar.");
    }
  };

  const handlePrint = () => {
    const printContent = cardRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=600,height=800');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Crachá - ${nomeUsuario}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page { size: portrait; margin: 0; }
              body { 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                background: #fff; 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
              }
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
      <div className="flex flex-col items-center gap-6" onClick={(e) => e.stopPropagation()}>

        {/* --- ÁREA DO CRACHÁ (VERTICAL) --- */}
        <div
          ref={cardRef}
          className="w-[320px] h-[520px] bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-200 relative flex flex-col print:shadow-none print:border print:border-gray-300"
        >
          {/* Fundo Decorativo Superior */}
          <div className="h-[140px] bg-slate-900 relative w-full">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute right-[-20px] top-[-20px] w-32 h-32 rounded-full bg-blue-500 blur-2xl"></div>
              <div className="absolute left-10 bottom-[-10px] w-20 h-20 rounded-full bg-white blur-2xl"></div>
            </div>

            {/* Logo Centralizada no Topo */}
            <div className="absolute top-4 left-0 right-0 flex justify-center">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                <span className="text-[10px] font-bold text-white tracking-widest uppercase">Frota Inteligente</span>
              </div>
            </div>
          </div>

          {/* Conteúdo Central (Foto + Dados) */}
          <div className="flex-1 flex flex-col items-center -mt-16 px-6 relative z-10">

            {/* FOTO / AVATAR (Círculo Grande) */}
            <div className="w-32 h-32 rounded-full bg-white p-1.5 shadow-lg mb-3">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-4xl font-bold text-slate-500 border border-slate-100 overflow-hidden relative">
                {fotoUrl ? (
                  <img src={fotoUrl} alt={nomeUsuario} className="w-full h-full object-cover" />
                ) : (
                  <span>{nomeUsuario.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>

            {/* Nome e Cargo */}
            <h2 className="text-2xl font-extrabold text-slate-900 text-center leading-tight mb-1">
              {nomeUsuario.split(' ')[0]}
              <span className="block text-lg font-semibold text-slate-500">
                {nomeUsuario.split(' ').slice(1).join(' ')}
              </span>
            </h2>

            <div className="bg-blue-50 text-blue-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-100 mb-6">
              Operador de Equipamentos
            </div>

            {/* QR Code */}
            <div className="bg-white p-2 border-2 border-dashed border-slate-200 rounded-xl">
              <QRCodeSVG
                value={loginUrl}
                size={140}
                bgColor={"#ffffff"}
                fgColor={"#0f172a"}
                level={"M"}
              />
            </div>
          </div>

          {/* Rodapé do Crachá */}
          <div className="py-3 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-medium uppercase">Acesso Permanente</p>
          </div>
        </div>

        {/* --- BOTÕES DE AÇÃO (Não impressos) --- */}
        <div className="flex flex-col gap-3 w-full max-w-[320px] print:hidden">
          <Button
            onClick={handlePrint}
            className="w-full bg-white text-slate-900 hover:bg-slate-50 shadow-lg font-bold h-12"
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" /></svg>}
          >
            Imprimir Crachá
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              onClick={handleCopyLink}
              className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
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