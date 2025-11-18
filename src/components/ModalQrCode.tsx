import { QRCodeSVG } from 'qrcode.react';

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose} 
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm space-y-4"
        onClick={(e) => e.stopPropagation()} 
      >
        <h3 className="text-xl font-semibold text-primary text-center">
          Login por QR Code
        </h3>
        <p className="text-center text-text-secondary">
          Peça ao operador <span className="font-bold text-text">{nomeUsuario}</span> para ler este código.
        </p>
        
        {/* Área do QR Code */}
        <div className="flex justify-center p-4 bg-gray-100 rounded-lg">
          {/* MUDANÇA: Wrapper branco para criar a margem (Quiet Zone) */}
          <div className="bg-white p-4 rounded-md shadow-sm">
            <QRCodeSVG
              value={qrCodeValue}
              size={200} // Tamanho ajustado para caber melhor
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"L"}
              // Removemos 'includeMargin' e 'margin' pois o div pai (bg-white p-4) já faz isso.
            />
          </div>
        </div>

        <p className="text-sm text-center text-gray-600 bg-blue-50 p-2 rounded border border-blue-100">
          Este QR Code é <strong>único e permanente</strong> para este motorista.
          <br/>
          Pode imprimi-lo e plastificá-lo para uso diário.
        </p>
        
        <button 
          type="button" 
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          onClick={onClose}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}