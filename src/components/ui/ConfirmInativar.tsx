import { AlertTriangle, UserX } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmInativarProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  userName: string;
  isLoading: boolean;
}

export function ConfirmInativar({ isOpen, onClose, onConfirm, userName, isLoading }: ConfirmInativarProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Desligamento" className="max-w-md">
      <div className="p-2 space-y-4">
        <div className="flex items-center gap-3 text-center mx-auto">
          <div className="p-3 bg-error/10 rounded-full text-error">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-text-main">Tem certeza?</p>
            <p className="text-sm text-text-secondary mt-1">
              <strong>{userName}</strong> será desligado imediatamente.
            </p>
          </div>
        </div>

        <div className="bg-error/5 border border-error/20 rounded-xl p-4 text-sm text-error">
          <AlertTriangle className="w-4 h-4 inline mr-1" />
          <strong>O que acontece:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Acesso revogado instantaneamente (sessões derrubadas)</li>
            <li>QR Code invalidado</li>
            <li>Nome prefixado com "[INATIVO] "</li>
            <li>Registro de auditoria criado</li>
            <li><strong>Dados preservados</strong> para histórico/compliance</li>
          </ul>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1" disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} className="flex-1" disabled={isLoading}>
            {isLoading ? 'Desligando...' : 'Confirmar Desligamento'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
