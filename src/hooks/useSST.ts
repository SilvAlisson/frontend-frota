import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useMemo } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ProgramaSST = 'PCA' | 'PPR' | 'AET' | 'PGR';
export type StatusSST   = 'PENDENTE' | 'REALIZADO' | 'ATRASADO';

export interface AcaoSST {
  id: string;
  acao: string;
  unidade: string;
  programa: ProgramaSST;
  responsaveis: string;
  vencimento: string; // ISO 8601
  realizado?: string | null;
  observacao?: string | null;
  status: StatusSST;
  createdAt: string;
  updatedAt: string;
}

export type CriarAcaoSSTInput = Omit<AcaoSST, 'id' | 'status' | 'createdAt' | 'updatedAt'>;
export type AtualizarAcaoSSTInput = Partial<CriarAcaoSSTInput> & { status?: StatusSST };

// ─── Constantes ───────────────────────────────────────────────────────────────

const QUERY_KEY = 'sst-acoes';

/** Limiar de dias para considerar "vencimento próximo". */
const DIAS_ALERTA = 15;

// ─── Utilitário de erro ───────────────────────────────────────────────────────

function handleApiError(error: unknown, mensagem: string) {
  console.error(`[SST] ${mensagem}:`, error);
  if (isAxiosError(error)) {
    const serverMsg = error.response?.data?.error || error.response?.data?.message;
    if (serverMsg) return toast.error(serverMsg);
    if (error.code === 'ERR_NETWORK') return toast.error('Sem conexão. Verifique sua rede.');
  }
  toast.error(mensagem);
}

// ─── Hook Principal ───────────────────────────────────────────────────────────

/**
 * **useSST** — Hook centralizado de Gestão SST.
 *
 * Expõe:
 * - `acoes` — lista completa de ações
 * - `acoesFiltradas` — lista filtrada por `filtroPrograma`
 * - `alertas` — ações vencidas ou próximas ao vencimento (≤ 15 dias)
 * - `estatisticas` — contadores por status para o dashboard de metas
 * - Mutações: `criarAcao`, `atualizarAcao`, `deletarAcao`
 */
export function useSST(filtroPrograma?: ProgramaSST | '') {
  const queryClient = useQueryClient();

  // ── Busca de dados ──────────────────────────────────────────────────────────
  const query = useQuery<AcaoSST[]>({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const res = await api.get<AcaoSST[]>('/sst');
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response && error.response.status >= 400 && error.response.status < 500) return false;
      return failureCount < 3;
    },
  });

  const acoes: AcaoSST[] = query.data ?? [];

  // ── Filtragem por programa ──────────────────────────────────────────────────
  const acoesFiltradas = useMemo(() => {
    if (!filtroPrograma) return acoes;
    return acoes.filter((a) => a.programa === filtroPrograma);
  }, [acoes, filtroPrograma]);

  // ── Alertas de vencimento ───────────────────────────────────────────────────
  const alertas = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return acoes
      .filter((a) => a.status !== 'REALIZADO')
      .map((a) => {
        const venc = new Date(a.vencimento);
        venc.setHours(23, 59, 59, 999);
        const diffDias = Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        return { ...a, diffDias };
      })
      .filter(({ diffDias }) => diffDias <= DIAS_ALERTA)
      .sort((a, b) => a.diffDias - b.diffDias);
  }, [acoes]);

  // ── Estatísticas para o dashboard ──────────────────────────────────────────
  const estatisticas = useMemo(() => {
    const total     = acoes.length;
    const realizadas = acoes.filter((a) => a.status === 'REALIZADO').length;
    const atrasadas  = acoes.filter((a) => a.status === 'ATRASADO').length;
    const pendentes  = acoes.filter((a) => a.status === 'PENDENTE').length;
    const progresso  = total > 0 ? Math.round((realizadas / total) * 100) : 0;

    const porPrograma = (['PCA', 'PPR', 'AET', 'PGR'] as ProgramaSST[]).map((prog) => {
      const grupo = acoes.filter((a) => a.programa === prog);
      const feitas = grupo.filter((a) => a.status === 'REALIZADO').length;
      return {
        programa: prog,
        total: grupo.length,
        realizadas: feitas,
        progresso: grupo.length > 0 ? Math.round((feitas / grupo.length) * 100) : 0,
      };
    });

    return { total, realizadas, atrasadas, pendentes, progresso, porPrograma };
  }, [acoes]);

  // ── Mutações CRUD ───────────────────────────────────────────────────────────
  const criarAcao = useMutation({
    mutationFn: (dados: CriarAcaoSSTInput) => api.post<AcaoSST>('/sst', dados).then((r) => r.data),
    onSuccess: () => {
      toast.success('Ação de SST cadastrada com sucesso!');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (err) => handleApiError(err, 'Erro ao cadastrar ação de SST'),
  });

  const atualizarAcao = useMutation({
    mutationFn: ({ id, ...dados }: AtualizarAcaoSSTInput & { id: string }) =>
      api.put<AcaoSST>(`/sst/${id}`, dados).then((r) => r.data),
    onSuccess: () => {
      toast.success('Ação atualizada!');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (err) => handleApiError(err, 'Erro ao atualizar ação de SST'),
  });

  const deletarAcao = useMutation({
    mutationFn: (id: string) => api.delete(`/sst/${id}`),
    onSuccess: () => {
      toast.success('Ação removida.');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (err) => handleApiError(err, 'Erro ao remover ação de SST'),
  });

  return {
    // Dados
    acoes,
    acoesFiltradas,
    alertas,
    estatisticas,

    // Estado da query
    isLoading: query.isLoading,
    isError:   query.isError,

    // Mutações
    criarAcao,
    atualizarAcao,
    deletarAcao,
  };
}
