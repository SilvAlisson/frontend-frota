import { z } from 'zod';

export const abastecimentoSchema = z.object({
  veiculoId: z.string().min(1, "Selecione o veículo"),
  operadorId: z.string().min(1, "Selecione o motorista"),
  fornecedorId: z.string().min(1, "Selecione o posto"),
  kmAtual: z.string().min(1, "KM Obrigatório"),
  dataHora: z.string(),
  itens: z.array(z.object({
    produtoId: z.string().min(1, "Selecione o produto"),
    quantidade: z.any()
      .transform((val: any) => Number(val))
      .refine((val: number) => !isNaN(val) && val >= 0.01, "Qtd inválida"),
    valorUnitario: z.string().min(1, "Valor inválido"), 
  })).min(1, "Adicione pelo menos um item")
});

export type AbastecimentoFormValues = z.output<typeof abastecimentoSchema>;

export interface AbastecimentoPayload {
  veiculoId: string;
  operadorId: string;
  fornecedorId: string;
  kmOdometro: number;
  dataHora: string;
  itens: {
    produtoId: string;
    quantidade: number;
    valorTotal: number;
    valorPorUnidade: number;
  }[];
}