import { QRCodeSVG } from 'qrcode.react';

interface ModalQrCodeProps {
  token: string;
  nomeUsuario: string;
  onClose: () => void;
}

export function ModalQrCode({ token, nomeUsuario, onClose }: ModalQrCodeProps) {
  
  const qrCodeValue = JSON.stringify({
    app: "klin-frota", 
    token: token
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose} 
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm space-y-4"
        onClick={(e) => e.stopPropagation()} 
      >
        <h3 className="text-xl font-semibold text-klin-azul text-center">
          Login por QR Code
        </h3>
        <p className="text-center text-text-secondary">
          Peça ao operador <span className="font-bold text-text">{nomeUsuario}</span> para ler este código.
        </p>
        
        {/* O Componente do QR Code */}
        <div className="flex justify-center p-4 bg-gray-100 rounded-lg">
          <QRCodeSVG
            value={qrCodeValue}
            size={256}
            bgColor={"#ffffff"}
            fgColor={"#000000"}
            level={"L"}
            includeMargin={true}
          />
        </div>

        <p className="text-sm text-center text-warning">
          Este código expira em **5 minutos** e só pode ser usado **uma vez**.
        </p>
        
        <button 
          type="button" 
          className="bg-gray-200 hover:bg-gray-300 text-text-secondary font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          onClick={onClose}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}