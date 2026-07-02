import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
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

function getCellValue(row: ExcelJS.Row, colIndex: number): string | null {
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
export function useTreinamentosUsuario(userId: string) {
    const queryClient = useQueryClient();
    const queryKey = ['treinamentos', userId] as const;

    // ── Leitura ──────────────────────────────────────────────────
    const { data: treinamentos = [], isLoading: loading } = useQuery<TreinamentoRealizado[]>({
        queryKey,
        queryFn: async () => {
            try {
                const { data } = await api.get<TreinamentoRealizado[]>(
                    `/treinamentos/usuario/${userId}`
                );
                return sortByDateDesc(data);
            } catch (err: unknown) {
                // 404 = usuário não tem treinamentos — retorna lista vazia, não é erro
                const status = (err as { response?: { status?: number } })?.response?.status;
                if (status === 404) return [];
                throw err;
            }
        },
        staleTime: 1000 * 60 * 2, // 2 min de cache
    });

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
        const normalizeNome = (n: string) => n.replace(/\s+/g, '').toUpperCase();
        const nomeAlvo = normalizeNome(data.nome);
        
        const duplicado = treinamentos.find(t => normalizeNome(t.nome) === nomeAlvo);
        
        if (duplicado) {
            toast.error(`A certificação "${duplicado.nome}" já está ativa!`, {
                description: "Para renovar, edite ou exclua o registro existente."
            });
            return; // Interrompe a execução, toast já exibido
        }
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
            success: count => `${count} certificações importadas com sucesso!`,
            error: err => (err instanceof Error ? err.message : 'Falha na importação do arquivo.'),
        });
        return promise.catch(() => 0); // Evita o Unhandled Promise Rejection
    };

    return { treinamentos, loading, addTreinamento, removeTreinamento, importarPlanilha };
}
