import { create } from 'zustand';

export type ModalType = 'CONFIRM' | 'LIGHTBOX' | 'ANALYTICS' | 'CUSTOM';

interface ModalState {
  modals: {
    id: string; // ID único para a instância do modal aberto
    type: ModalType;
    props: unknown;
  }[];
  openModal: <T extends Record<string, unknown>>(type: ModalType, props: T) => string;
  closeModal: (id: string) => void;
  closeAll: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  modals: [],
  openModal: (type, props) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      modals: [...state.modals, { id, type, props }]
    }));
    return id;
  },
  closeModal: (id) => set((state) => ({
    modals: state.modals.filter(modal => modal.id !== id)
  })),
  closeAll: () => set({ modals: [] })
}));
