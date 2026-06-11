import { useState, useMemo } from 'react';
import type { Veiculo } from '../types';
import { useDebounce } from './useDebounce';

export function useFiltragemVeiculos(veiculos: Veiculo[] = []) {
  const [busca, setBusca] = useState('');
  const buscaDebounced = useDebounce(busca, 300);

  const veiculosFiltrados = useMemo(() => {
    if (!buscaDebounced) return veiculos;
    const termo = buscaDebounced.toLowerCase();
    return veiculos.filter(v =>
      v.placa.toLowerCase().includes(termo) ||
      v.modelo.toLowerCase().includes(termo)
    );
  }, [veiculos, buscaDebounced]);

  return {
    busca,
    setBusca,
    veiculosFiltrados
  };
}


