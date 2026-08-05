import { useModalStore } from '../../hooks/useModalStore';
import { ConfirmModal } from './ConfirmModal';
import { Lightbox } from './Lightbox';
import { ModalAnalyticsEngine } from "../ModalAnalyticsEngine";

export function ModalProvider() {
  const { modals, closeModal } = useModalStore();

  if (modals.length === 0) return null;

  return (
    <>
      {modals.map(modal => {
        
        if (modal.type === 'CONFIRM') {
          return (
            <ConfirmModal
              key={modal.id}
              isOpen={true}
              onCancel={() => {
                if (modal.props.onCancel) modal.props.onCancel();
                closeModal(modal.id);
              }}
              onConfirm={async () => {
                if (modal.props.onConfirm) await modal.props.onConfirm();
                closeModal(modal.id);
              }}
              title={modal.props.title}
              description={modal.props.description}
              variant={modal.props.variant}
              confirmLabel={modal.props.confirmLabel}
              cancelLabel={modal.props.cancelLabel}
            />
          );
        }

        if (modal.type === 'LIGHTBOX') {
          return (
            <Lightbox
              key={modal.id}
              src={modal.props.src}
              alt={modal.props.alt}
              caption={modal.props.caption}
              onClose={() => {
                if (modal.props.onClose) modal.props.onClose();
                closeModal(modal.id);
              }}
            />
          );
        }

        if (modal.type === 'ANALYTICS') {
          return (
            <ModalAnalyticsEngine
              key={modal.id}
              isOpen={true}
              metric={modal.props.metric}
              title={modal.props.title}
              onClose={() => {
                if (modal.props.onClose) modal.props.onClose();
                closeModal(modal.id);
              }}
            />
          );
        }

        if (modal.type === 'CUSTOM') {
          return (
            <div key={modal.id}>
              {modal.props.content}
            </div>
          );
        }

        return null;
      })}
    </>
  );
}
