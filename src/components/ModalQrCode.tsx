import { QRCodeSVG } from 'qrcode.react';

interface ModalQrCodeProps {
  token: string; // Este é o loginToken curto vindo do backend
  nomeUsuario: string;
  onClose: () => void;
}

export function ModalQrCode({ token, nomeUsuario, onClose }: ModalQrCodeProps) {

  // Gera a URL completa para login automático
  // Ex: https://klinfrota.vercel.app/login?magicToken=abc12345
  const loginUrl = `${window.location.origin}/login?magicToken=${token}`;

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
          <h3 className="text-lg font-bold text-primary">Acesso Rápido (QR Code)</h3>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-center text-text-secondary text-sm">
            Peça ao operador <span className="font-bold text-text">{nomeUsuario}</span> para apontar a câmera.
          </p>

          {/* Área do QR Code */}
          <div className="flex justify-center p-4 bg-white rounded-lg border border-gray-100 shadow-inner">
            <QRCodeSVG
              value={loginUrl} // O valor é a URL clicável
              size={220}
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"L"}
              marginSize={2}
            />
          </div>

          {/* Opcional: Mostrar o link apenas se quiser depurar, senão remova este bloco div */}
          {/* <div className="text-center">
               <p className="text-xs text-gray-400 mb-1">Link gerado (debug):</p>
               <p className="text-[10px] font-mono text-gray-500 break-all bg-gray-50 p-2 rounded border">
                 {loginUrl}
               </p>
            </div> */}

          <p className="text-xs text-center text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
            Este código conecta o operador <strong>automaticamente</strong> sem precisar de senha.
          </p>

          <button
            type="button"
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-4 rounded-lg focus:outline-none w-full transition-colors"
            onClick={onClose}
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
}