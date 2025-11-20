import { QRCodeSVG } from 'qrcode.react';
import { Button } from './ui/Button'; // Componente Visual

interface ModalQrCodeProps {
  token: string;
  nomeUsuario: string;
  onClose: () => void;
}

export function ModalQrCode({ token, nomeUsuario, onClose }: ModalQrCodeProps) {
  
  // O valor que o scanner do Operador irá ler
  const qrCodeValue = JSON.stringify({
    app: "klin-frota",
    token: token
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose} 
    >
      <div 
        className="bg-white rounded-card shadow-2xl w-full max-w-sm overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Cabeçalho */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 text-center">
           <h3 className="text-lg font-bold text-primary">Login por QR Code</h3>
        </div>

        <div className="p-6 space-y-6">
            <p className="text-center text-text-secondary text-sm">
              Peça ao operador <span className="font-bold text-text">{nomeUsuario}</span> para ler este código.
            </p>
            
            {/* Área do QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <QRCodeSVG
                  value={qrCodeValue}
                  size={200} 
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"L"}
                />
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-center">
                <p className="text-xs text-blue-800">
                  Este QR Code é <strong>único e permanente</strong>. Pode imprimi-lo e plastificá-lo para uso diário.
                </p>
            </div>
            
            <Button 
              type="button" 
              variant="secondary" 
              className="w-full"
              onClick={onClose}
            >
              Fechar
            </Button>
        </div>
      </div>
    </div>
  );
}