import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';
// import ExcelJS from 'exceljs';
import * as z from 'zod';
import type { TreinamentoRealizado } from '../types';

// ─────────────────────────────────────────────────────────────────
// Schema de validação — única fonte de verdade do formulário
// ─────────────────────────────────────────────────────────────────
export const treinamentoSchema = z.object({
    nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres')
        .transform(val => {
            let n = val.toUpperCase().replace(/\s+/g, ' ').trim();
            n = n.replace(/^NR[\s\-]*(\d+.*)$/, 'NR $1');
            return n;
        }),
    dataRealizacao: z.string().min(1, 'Data de emissão obrigatória').refine(data => {
        const hoje = new Date();
        hoje.setHours(23, 59, 59, 999);
        return new Date(data) <= hoje;
    }, 'A realização não pode estar no futuro'),
    dataVencimento: z.string().optional().or(z.literal('')),
    descricao: z.string().optional().nullable(),
    comprovanteUrl: z.string().url('URL inválida').optional().or(z.literal('')),
    diasAntecedenciaAlerta: z.number().int().min(1).max(365),
}).refine((data) => {
    if (!data.dataVencimento) return true; // Vitalício passa
    const realizacao = new Date(data.dataRealizacao);
    const vencimento = new Date(data.dataVencimento);
    return vencimento > realizacao;
}, {
    message: "A validade DEVE ser posterior à realização",
    path: ["dataVencimento"] // O erro pisca em vermelho debaixo do input correto!
});

export type TreinamentoForm = z.infer<typeof treinamentoSchema>;

// ─────────────────────────────────────────────────────────────────
// Tipos internos — não expostos ao componente
// ─────────────────────────────────────────────────────────────────
interface CreateTreinamentoPayload {
    userId: string;
    nome: string;
    dataRealizacao: string;
    dataVencimento: string | null;
    descricao: string | null;
    comprovanteUrl: string | null;
    diasAntecedenciaAlerta: number;
}

interface ImportRow {
    nome: string;
    dataRealizacao: string;
    dataVencimento: string;
    descricao: string | null;
}

// ─────────────────────────────────────────────────────────────────
// Funções utilitárias puras (sem side-effects, fáceis de testar)
// ─────────────────────────────────────────────────────────────────
function sortByDateDesc(items: TreinamentoRealizado[]): TreinamentoRealizado[] {
    return [...items].sort(
        (a, b) =>
            new Date(b.dataRealizacao).getTime() - new Date(a.dataRealizacao).getTime()
    );
}

/** Converte "DD/MM/YYYY" → "YYYY-MM-DD" se necessário. */
function normalizeDateString(raw: string): string {
    return raw.includes('/') ? raw.split('/').reverse().join('-') : raw;
}

/** Interface mínima da Row do ExcelJS — tipamos apenas o que realmente usamos */
interface ExcelRow {
    getCell(col: number): { value: unknown };
}

function getCellValue(row: ExcelRow, colIndex: number): string | null {
    const cell = row.getCell(colIndex).value;
    if (cell instanceof Date) return cell.toISOString().split('T')[0];
    if (cell != null && typeof cell === 'object') {
        if ('text' in cell) return (cell as { text: string }).text;
        if ('result' in cell) return String((cell as { result: unknown }).result);
    }
    return cell != null ? String(cell) : null;
}

// ─────────────────────────────────────────────────────────────────
// Hook principal
// ─────────────────────────────────────────────────────────────────
export function useTreinamentosUsuario(userId: string, cargoId?: string | null) {
    const queryClient = useQueryClient();
    const queryKey = ['treinamentos', userId] as const;
    const cargoQueryKey = ['cargos'] as const;

    // ── Leitura de Cargos (Para extrair obrigações) ──────────────
    interface Requisito {
        id: string;
        nome: string;
        diasAntecedenciaAlerta: number;
    }
    interface CargoResponse {
        id: string;
        requisitos?: Requisito[];
    }

    const { data: cargos = [], isLoading: loadingCargos } = useQuery<CargoResponse[]>({
        queryKey: cargoQueryKey,
        queryFn: async () => {
            const { data } = await api.get<CargoResponse[]>('/cargos');
            return data;
        },
        staleTime: 1000 * 60 * 5, // 5 min cache
        enabled: !!cargoId, // Só busca se tiver cargo associado
    });

    const { data: rawTreinamentos = [], isLoading: loadingTreinamentos } = useQuery<TreinamentoRealizado[]>({
        queryKey,
        queryFn: async () => {
            try {
                const { data } = await api.get<TreinamentoRealizado[]>(
                    `/treinamentos/usuario/${userId}`
                );
                return data;
            } catch (err: unknown) {
                const status = (err as { response?: { status?: number } })?.response?.status;
                if (status === 404) return [];
                throw err;
            }
        },
        staleTime: 1000 * 60 * 2,
    });

    // ── Mesclagem (Realizados + Pendentes) ───────────────────────
    const treinamentos = React.useMemo(() => {
        const normalize = (n: string) => n.toUpperCase().replace(/\s+/g, ' ').trim();
        type TreinamentoMesclado = TreinamentoRealizado & { status: 'CONCLUIDO' | 'PENDENTE'; isObrigatorio: boolean; diasAntecedenciaAlerta?: number };
        const realizados = sortByDateDesc(rawTreinamentos).map(t => ({ ...t, status: 'CONCLUIDO' as const, isObrigatorio: false })) as TreinamentoMesclado[];
        const mapaRealizados = new Map(realizados.map(t => [normalize(t.nome), t]));

        const cargoUsuario = cargos.find(c => c.id === cargoId);

        if (cargoUsuario && cargoUsuario.requisitos) {
            cargoUsuario.requisitos.forEach((req: Requisito) => {
                const normName = normalize(req.nome);
                if (mapaRealizados.has(normName)) {
                    const existente = mapaRealizados.get(normName)!;
                    existente.isObrigatorio = true;
                } else {
                    realizados.push({
                        id: `pending-${req.id}`,
                        nome: req.nome,
                        dataRealizacao: '',
                        userId,
                        status: 'PENDENTE',
                        isObrigatorio: true,
                        diasAntecedenciaAlerta: req.diasAntecedenciaAlerta,
                        dataVencimento: null,
                        descricao: null,
                        comprovanteUrl: null,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    } as typeof realizados[0]);
                }
            });
        }

        return realizados.sort((a, b) => {
            if (a.status !== b.status) return a.status === 'PENDENTE' ? -1 : 1;
            return new Date(b.dataRealizacao).getTime() - new Date(a.dataRealizacao).getTime();
        });
    }, [rawTreinamentos, cargos, cargoId, userId]);



    // ── Mutations ────────────────────────────────────────────────
    const addMutation = useMutation({
        mutationFn: (payload: CreateTreinamentoPayload) =>
            api.post('/treinamentos', payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    const removeMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/treinamentos/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    // ── Ações públicas ───────────────────────────────────────────
    const addTreinamento = async (data: TreinamentoForm): Promise<void> => {
        // 🛡️ MURALHA DE DUPLICIDADE REMOVIDA
        // O backend agora aceita recadastros (renovações) para manter o histórico.

        const payload: CreateTreinamentoPayload = {
            userId,
            nome: data.nome,
            dataRealizacao: new Date(data.dataRealizacao).toISOString(),
            dataVencimento: data.dataVencimento
                ? new Date(data.dataVencimento).toISOString()
                : null,
            descricao: data.descricao ?? null,
            comprovanteUrl: data.comprovanteUrl || null,
            diasAntecedenciaAlerta: data.diasAntecedenciaAlerta,
        };

        await toast.promise(addMutation.mutateAsync(payload), {
            loading: 'Registrando certificação...',
            success: 'Certificação inserida com sucesso!',
            error: 'Falha ao salvar a certificação.',
        });
    };

    const removeTreinamento = async (id: string): Promise<void> => {
        await toast.promise(removeMutation.mutateAsync(id), {
            loading: 'Removendo registro...',
            success: 'Registro removido com sucesso.',
            error: 'Erro ao excluir registro da base de dados.',
        });
    };

    const importarPlanilha = async (file: File): Promise<number> => {
        const task = async (): Promise<number> => {
            const ExcelJS = (await import('exceljs')).default;
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(await file.arrayBuffer());

            const worksheet = workbook.worksheets[0];
            const rawRows: ImportRow[] = [];

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // pula cabeçalho
                rawRows.push({
                    nome: (getCellValue(row, 1) ?? '').trim(),
                    dataRealizacao: getCellValue(row, 2) ?? '',
                    dataVencimento: getCellValue(row, 3) ?? '',
                    descricao: (getCellValue(row, 4) ?? '').trim() || null,
                });
            });

            const valid = rawRows
                .map(item => {
                    const result = treinamentoSchema.safeParse({
                        ...item,
                        dataRealizacao: normalizeDateString(item.dataRealizacao),
                        dataVencimento: normalizeDateString(item.dataVencimento),
                    });
                    return result.success ? { ...result.data, userId } : null;
                })
                .filter((item): item is TreinamentoForm & { userId: string } => item !== null);

            if (valid.length === 0)
                throw new Error('Nenhum dado válido encontrado na planilha.');

            await api.post('/treinamentos/importar', { userId, treinamentos: valid });
            await queryClient.invalidateQueries({ queryKey });
            return valid.length;
        };

        const promise = task();
        toast.promise(promise, {
            loading: 'Lendo planilha...',
            success: (n) => `${n} certificação(ões) importada(s) com sucesso!`,
            error: (e: unknown) => `Erro na importação: ${e instanceof Error ? e.message : 'erro desconhecido'}`,
        });
        return promise;
    };

    return {
        treinamentos,
        cargos,
        loading: loadingTreinamentos || loadingCargos,
        addTreinamento,
        removeTreinamento,
        importarPlanilha,
    };
}
