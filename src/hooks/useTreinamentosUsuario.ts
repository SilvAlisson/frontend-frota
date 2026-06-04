import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import * as z from 'zod';
import type { TreinamentoRealizado } from '../types';
import axios from 'axios'; // We need axios for err instanceof axios.AxiosError

export const treinamentoSchema = z.object({
    nome: z.string()
        .min(2, "Nome muito curto")
        .transform(val => val.toUpperCase().trim()),

    dataRealizacao: z.string()
        .min(1, "Data obrigatória"),

    dataVencimento: z.string().optional().or(z.literal('')),

    descricao: z.string().optional().nullable(),

    comprovanteUrl: z.string().url("URL inválida").optional().or(z.literal('')),
});

export type TreinamentoForm = z.infer<typeof treinamentoSchema>;

interface TreinamentoRaw {
    nome: string;
    dataRealizacao: string;
    dataVencimento: string;
    descricao: string | null;
}

export function useTreinamentosUsuario(userId: string) {
    const [treinamentos, setTreinamentos] = useState<TreinamentoRealizado[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTreinamentos = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get<TreinamentoRealizado[]>(`/treinamentos/usuario/${userId}`);
            const sorted = response.data.sort((a, b) =>
                new Date(b.dataRealizacao).getTime() - new Date(a.dataRealizacao).getTime()
            );
            setTreinamentos(sorted);
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.status === 404) {
                setTreinamentos([]);
            } else {
                if (import.meta.env.DEV) console.error(err);
                // toast.error("Erro ao carregar histórico de certificações.");
            }
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchTreinamentos();
    }, [fetchTreinamentos]);

    const addTreinamento = async (data: TreinamentoForm): Promise<void> => {
        const payload = {
            userId: userId,
            nome: data.nome,
            dataRealizacao: new Date(data.dataRealizacao).toISOString(),
            dataVencimento: data.dataVencimento ? new Date(data.dataVencimento).toISOString() : null,
            descricao: data.descricao || null,
            comprovanteUrl: data.comprovanteUrl || null
        };

        const promise = api.post('/treinamentos', payload);

        await toast.promise(promise, {
            loading: 'A registar treinamento...',
            success: () => {
                fetchTreinamentos();
                return 'Certificação inserida com sucesso!';
            },
            error: 'Falha ao salvar a certificação.'
        });
    };

    const removeTreinamento = async (id: string): Promise<void> => {
        const promise = api.delete(`/treinamentos/${id}`);

        await toast.promise(promise, {
            loading: 'A remover Registro...',
            success: () => {
                setTreinamentos(prev => prev.filter(t => t.id !== id));
                return 'Registro removido com sucesso.';
            },
            error: 'Erro ao excluir Registro da base de dados.'
        });
    };

    const importarPlanilha = async (file: File): Promise<number> => {
        const importTask = async () => {
            const workbook = new ExcelJS.Workbook();
            const buffer = await file.arrayBuffer();
            await workbook.xlsx.load(buffer);

            const worksheet = workbook.worksheets[0];
            const rawData: TreinamentoRaw[] = [];

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1) { // Pula cabeçalho
                    const getCellValue = (colIndex: number): string | null => {
                        const cell = row.getCell(colIndex).value;
                        if (cell && typeof cell === 'object') {
                            if ('text' in cell) return cell.text;
                            if ('result' in cell) return String(cell.result);
                        }
                        if (cell instanceof Date) {
                            return cell.toISOString().split('T')[0];
                        }
                        return cell !== undefined && cell !== null ? String(cell) : null;
                    };

                    rawData.push({
                        nome: (getCellValue(1) || '').trim(),
                        dataRealizacao: getCellValue(2) || '',
                        dataVencimento: getCellValue(3) || '',
                        descricao: (getCellValue(4) || '').trim() || null
                    });
                }
            });

            const validos = rawData
                .map(item => {
                    if (!item.dataRealizacao) return null;
                    if (item.dataRealizacao.includes('/')) {
                        const [d, m, y] = item.dataRealizacao.split('/');
                        item.dataRealizacao = `${y}-${m}-${d}`;
                    }
                    if (item.dataVencimento && item.dataVencimento.includes('/')) {
                        const [d, m, y] = item.dataVencimento.split('/');
                        item.dataVencimento = `${y}-${m}-${d}`;
                    }

                    const result = treinamentoSchema.safeParse(item);
                    return result.success ? { ...result.data, userId: userId } : null;
                })
                .filter((item): item is (TreinamentoForm & { userId: string }) => item !== null);

            if (validos.length === 0) throw new Error("Nenhum dado válido encontrado na folha de cálculo.");

            await api.post('/treinamentos/importar', {
                userId: userId,
                treinamentos: validos
            });

            return validos.length;
        };

        const promise = importTask();
        toast.promise(promise, {
            loading: 'A ler folha de cálculo...',
            success: (c) => {
                fetchTreinamentos();
                return `${c} certificações importadas!`;
            },
            error: (err) => {
                if (err instanceof Error) {
                     return err.message;
                }
                return "Falha na importação do Arquivo.";
            }
        });
        
        return await promise;
    };

    return {
        treinamentos,
        loading,
        addTreinamento,
        removeTreinamento,
        importarPlanilha,
        fetchTreinamentos
    };
}
