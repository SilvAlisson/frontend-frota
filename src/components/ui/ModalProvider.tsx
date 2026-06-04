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
        const { id, type, props: rawProps } = modal;
        const props = rawProps as Record<string, unknown>;
        
        switch (type) {
          case 'CONFIRM':
            return (
              <ConfirmModal
                key={id}
                isOpen={true}
                onCancel={() => {
                  if (typeof props.onCancel === 'function') props.onCancel();
                  closeModal(id);
                }}
                onConfirm={async () => {
                  if (typeof props.onConfirm === 'function') await props.onConfirm();
                  closeModal(id);
                }}
                title={props.title as string}
                description={props.description as string | undefined}
                variant={props.variant as React.ComponentProps<typeof ConfirmModal>['variant']}
                confirmLabel={props.confirmLabel as string | undefined}
                cancelLabel={props.cancelLabel as string | undefined}
              />
            );
            
          case 'LIGHTBOX':
            return (
              <Lightbox
                key={id}
                src={props.src as string}
                alt={props.alt as string}
                caption={props.caption as string | undefined}
                onClose={() => {
                  if (typeof props.onClose === 'function') props.onClose();
                  closeModal(id);
                }}
              />
            );

          case 'ANALYTICS':
            return (
              <ModalAnalyticsEngine
                key={id}
                isOpen={true}
                metric={props.metric as React.ComponentProps<typeof ModalAnalyticsEngine>['metric']}
                title={props.title as string}
                onClose={() => {
                  if (typeof props.onClose === 'function') props.onClose();
                  closeModal(id);
                }}
              />
            );

          case 'CUSTOM':
            return (
              <div key={id}>
                {props.content as React.ReactNode}
              </div>
            );

          default:
            return null;
        }
      })}
    </>
  );
}
