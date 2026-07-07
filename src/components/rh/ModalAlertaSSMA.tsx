import { Modal } from '../ui/Modal';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

interface ModalAlertaSSMAProps {
  isOpen: boolean;
  onClose: () => void;
  bloqueios: string[];
}

export function ModalAlertaSSMA({ isOpen, onClose, bloqueios }: ModalAlertaSSMAProps) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="BLOQUEIO OPERACIONAL SSMA"
      className="max-w-md border-error-500/20"
      nested={true} // Pode ser aberto por cima do Modal de Foto
    >
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-full bg-error-500/10 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-error-600" />
        </div>
        
        <h3 className="text-xl font-bold text-text-main mb-2">
          Acesso Interrompido
        </h3>
        
        <p className="text-sm text-text-secondary mb-6">
          Você possui pendências de Segurança e Saúde do Trabalho (SST). Por normas de compliance, o sistema bloqueou automaticamente a abertura da sua jornada.
        </p>

        <div className="w-full bg-error-50/50 rounded-xl border border-error-500/10 p-4 mb-6 text-left">
          <h4 className="text-sm font-bold text-error-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Motivos do Bloqueio:
          </h4>
          <ul className="space-y-2">
            {bloqueios.map((bloqueio, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-error-700">
                <span className="mt-1 text-error-500">•</span>
                <span className="font-medium">{bloqueio}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full space-y-3">
          <Button
            variant="danger"
            className="w-full py-3 text-base shadow-button"
            onClick={onClose}
          >
            Estou ciente
          </Button>
          <p className="text-xs text-text-muted mt-2">
            Tire uma foto desta tela e procure o seu Encarregado ou o setor de RH para regularizar a situação.
          </p>
        </div>
      </div>
    </Modal>
  );
}
