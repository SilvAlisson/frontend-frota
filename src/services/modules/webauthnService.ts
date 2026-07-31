import { api } from '../../services/api';
import type { PasskeyDevice } from '../../hooks/useWebAuthn';

export const webauthnService = {
  async getPasskeys(): Promise<PasskeyDevice[]> {
    const { data } = await api.get<PasskeyDevice[]>('/users/me/passkeys');
    return data;
  },

  async deletePasskey(passkeyId: string): Promise<void> {
    await api.delete(`/users/me/passkeys/${passkeyId}`);
  }
};
