import type { Veiculo } from '../types/veiculo';

export function calculateVehicleHealth(veiculo: Veiculo): number {
  let score = 100;

  if (veiculo.status === 'EM_MANUTENCAO') {
    score -= 40;
  } else if (veiculo.status === 'INATIVO' || veiculo.status === 'QUEBRADO' as string) {
    return 0;
  }

  const today = new Date();
  
  if (veiculo.vencimentoCiv) {
    const civDate = new Date(veiculo.vencimentoCiv);
    if (civDate < today) {
      score -= 30;
    } else if (civDate.getTime() - today.getTime() < 15 * 24 * 60 * 60 * 1000) {
      score -= 10;
    }
  }

  if (veiculo.vencimentoCipp) {
    const cippDate = new Date(veiculo.vencimentoCipp);
    if (cippDate < today) {
      score -= 30;
    } else if (cippDate.getTime() - today.getTime() < 15 * 24 * 60 * 60 * 1000) {
      score -= 10;
    }
  }

  return Math.max(0, score);
}
