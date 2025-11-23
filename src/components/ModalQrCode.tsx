import { QRCodeSVG } from 'qrcode.react';
import { Button } from './ui/Button';

interface ModalQrCodeProps {
  token: string;
  nomeUsuario: string;
  onClose: () => void;
}

export function ModalQrCode({ token, nomeUsuario, onClose }: ModalQrCodeProps) {

  // MUDANÇA CRÍTICA: Gera uma URL completa em vez de JSON
  // Isso faz a câmera do celular reconhecer como link e abrir o navegador
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
          <h3 className="text-lg font-bold text-primary">Acesso Rápido</h3>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-center text-text-secondary text-sm">
            Peça ao operador <span className="font-bold text-text">{nomeUsuario}</span> para apontar a câmera.
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

          {/* Sem texto de link aqui em baixo, apenas a instrução */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-center">
            <p className="text-xs text-blue-800">
              Este código conecta o operador <strong>automaticamente</strong>.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={onClose}
          >
            Fechar Janela
          </Button>
        </div>
      </div>
    </div>
  );
}