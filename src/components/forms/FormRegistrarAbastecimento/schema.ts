import { z } from 'zod';

export const abastecimentoSchema = z.object({
  veiculoId: z.string().min(1, "Selecione o veículo"),
  operadorId: z.string().min(1, "Selecione o integrante responsável"),
  kmAtual: z.string().min(1, "KM do painel é obrigatório"),
  dataHora: z.string().min(1, "Data e hora são obrigatórias"),
  observacoes: z.string().optional(),
  fornecedorId: z.string().optional(),
  itens: z.array(z.object({
    produtoId: z.string().optional(),
    quantidade: z.union([z.string(), z.number()]).optional(),
    valorUnitario: z.string().optional(), 
  })).optional()
});

export type AbastecimentoFormValues = z.output<typeof abastecimentoSchema>;

export interface AbastecimentoPayload {
  veiculoId: string;
  operadorId: string;
  fornecedorId: string;
  kmOdometro: number;
  dataHora: string;
  observacoes?: string;
  itens: {
    produtoId: string;
    quantidade: number;
    valorTotal: number;
    valorPorUnidade: number;
  }[];
}