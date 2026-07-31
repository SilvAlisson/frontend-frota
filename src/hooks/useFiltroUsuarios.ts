import { useState, useMemo } from 'react';
import type { User } from '../types';
import { useDebounce } from './useDebounce';

function getCleanName(fullName: string) {
  return fullName.startsWith('[INATIVO]') ? fullName.replace('[INATIVO]', '').trim() : fullName;
}

export function useFiltroUsuarios(usuarios: User[]) {
  const [busca, setBusca] = useState('');
  const [filtroRole, setFiltroRole] = useState<string>('TODOS');
  const [mostrarInativos, setMostrarInativos] = useState(false);

  const buscaDebounced = useDebounce(busca, 300);

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      const isInativo = u.nome.startsWith('[INATIVO]');
      if (!mostrarInativos && isInativo) return false;

      const nomeReal = getCleanName(u.nome);

      const matchBusca = !buscaDebounced || 
        nomeReal.toLowerCase().includes(buscaDebounced.toLowerCase()) ||
        u.email.toLowerCase().includes(buscaDebounced.toLowerCase()) ||
        (u.matricula && u.matricula.includes(buscaDebounced));
        
      const matchRole = filtroRole === 'TODOS' || u.role === filtroRole;
      
      return matchBusca && matchRole;
    });
  }, [usuarios, mostrarInativos, buscaDebounced, filtroRole]);

  return {
    busca,
    setBusca,
    filtroRole,
    setFiltroRole,
    mostrarInativos,
    setMostrarInativos,
    usuariosFiltrados,
    getCleanName
  };
}
