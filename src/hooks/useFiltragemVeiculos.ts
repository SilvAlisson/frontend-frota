import { useState, useMemo } from 'react';
import type { Veiculo } from '../types';

export function useFiltragemVeiculos(veiculos: Veiculo[] = []) {
  const [busca, setBusca] = useState('');

  const veiculosFiltrados = useMemo(() => {
    if (!busca) return veiculos;
    const termo = busca.toLowerCase();
    return veiculos.filter(v =>
      v.placa.toLowerCase().includes(termo) ||
      v.modelo.toLowerCase().includes(termo)
    );
  }, [veiculos, busca]);

  return {
    busca,
    setBusca,
    veiculosFiltrados
  };
}


