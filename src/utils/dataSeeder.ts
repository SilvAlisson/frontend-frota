import { api } from '../services/api';
import { db } from '../services/db';

/**
 * Puxa os dados essenciais para o funcionamento do sistema offline
 * e injeta diretamente na tabela masterData do Dexie.
 */
export async function seedOfflineData() {
  // Se estiver offline, não faz o seed
  if (typeof window !== 'undefined' && !window.navigator.onLine) {
    return;
  }

  try {
    let userRole = 'OPERADOR';
    try {
      const userStr = sessionStorage.getItem('klin_user') || localStorage.getItem('klin_user') || localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.role) userRole = user.role;
      }
    } catch { /* ignorar erro de parsing */ }

    const isGestor = userRole === 'ADMIN' || userRole === 'ENCARREGADO';
    
    const rotasEssenciais = [
      { endpoint: isGestor ? '/veiculos' : '/veiculos/operacao', key: 'veiculos_' + (isGestor ? '/veiculos' : '/veiculos/operacao') },
      { endpoint: '/users', key: 'usuarios' },
      { endpoint: isGestor ? '/jornadas/abertas' : '/jornadas/minhas-abertas-operador', key: 'jornadas_ativas_' + userRole }
    ];

    for (const rota of rotasEssenciais) {
      try {
        const { data } = await api.get(rota.endpoint);
        // Salva na tabela masterData
        await db.masterData.put({
          key: rota.key,
          data: data,
          updatedAt: Date.now()
        });
      } catch (err) {
        console.warn(`[DataSeeder] Falha ao pré-carregar ${rota.key}`, err);
      }
    }
  } catch (error) {
    console.error('[DataSeeder] Erro global ao realizar seed de dados:', error);
  }
}
