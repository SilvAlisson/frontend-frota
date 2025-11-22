import { QRCodeSVG } from 'qrcode.react';

interface ModalQrCodeProps {
  token: string;
  nomeUsuario: string;
  onClose: () => void;
}

export function ModalQrCode({ token, nomeUsuario, onClose }: ModalQrCodeProps) {

  const loginUrl = `${window.location.origin}/login?magicToken=${token}`;

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
          Acesso Rápido (QR Code)
        </h3>
        <p className="text-center text-text-secondary text-sm">
          Peça ao operador <span className="font-bold text-text">{nomeUsuario}</span> para apontar a câmera do celular.
        </p>

        {/* Área do QR Code */}
        <div className="flex justify-center p-4 bg-white rounded-lg border border-gray-100 shadow-inner">
          <QRCodeSVG
            value={loginUrl} // Agora é uma URL!
            size={220}
            bgColor={"#ffffff"}
            fgColor={"#000000"}
            level={"L"}
            marginSize={2}
          />
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">O link gerado é:</p>
          <p className="text-xs font-mono text-gray-600 break-all bg-gray-50 p-2 rounded border border-gray-200">
            {loginUrl}
          </p>
        </div>

        <p className="text-xs text-center text-blue-600 bg-blue-50 p-2 rounded border border-blue-100">
          Este código conecta o operador <strong>automaticamente</strong> sem precisar de senha.
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