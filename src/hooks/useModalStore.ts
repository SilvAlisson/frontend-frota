import { create } from 'zustand';

import type { ComponentProps, ReactNode } from 'react';
import type { ConfirmModal } from '../components/ui/ConfirmModal';
import type { Lightbox } from '../components/ui/Lightbox';
import type { ModalAnalyticsEngine } from '../components/ModalAnalyticsEngine';

export type ModalType = 'CONFIRM' | 'LIGHTBOX' | 'ANALYTICS' | 'CUSTOM';

export type ModalConfig =
  | { type: 'CONFIRM'; props: Omit<ComponentProps<typeof ConfirmModal>, 'isOpen'> }
  | { type: 'LIGHTBOX'; props: ComponentProps<typeof Lightbox> }
  | { type: 'ANALYTICS'; props: Omit<ComponentProps<typeof ModalAnalyticsEngine>, 'isOpen'> }
  | { type: 'CUSTOM'; props: { content: ReactNode } };

export type ModalInstance = ModalConfig & { id: string };

interface ModalState {
  modals: ModalInstance[];
  openModal: <T extends ModalConfig>(type: T['type'], props: T['props']) => string;
  closeModal: (id: string) => void;
  closeAll: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  modals: [],
  openModal: (type, props) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      modals: [...state.modals, { id, type, props } as ModalInstance]
    }));
    return id;
  },
  closeModal: (id) => set((state) => ({
    modals: state.modals.filter(modal => modal.id !== id)
  })),
  closeAll: () => set({ modals: [] })
}));
