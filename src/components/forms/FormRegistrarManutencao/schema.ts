// src/components/forms/FormRegistrarManutencao/schema.ts
import { z } from 'zod';

export const ALVOS_MANUTENCAO = ['VEICULO', 'OUTROS'] as const;
export type TipoManutencao = 'CORRETIVA' | 'PREVENTIVA';

export const manutencaoSchema = z.object({
  tipo: z.enum(["PREVENTIVA", "CORRETIVA"]),
  alvo: z.enum(ALVOS_MANUTENCAO),
  
  veiculoId: z.string().optional().nullable(),
  kmAtual: z.string().optional().nullable(),
  numeroCA: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),

  fornecedorId: z.string().min(1, "Selecione o fornecedor"),
  data: z.string().min(1, "Data é obrigatória"),
  
  itens: z.array(z.object({
    produtoId: z.string().min(1, "Selecione o serviço/peça"),
    quantidade: z.any()
      .transform((val: any) => Number(val))
      .refine((val: number) => !isNaN(val) && val >= 0.01, "Qtd inválida"),
    valorPorUnidade: z.string().min(1, "Valor inválido"),
  })).min(1, "Adicione pelo menos um item")
}).superRefine((data, ctx) => {
  if (data.alvo === 'VEICULO' && !data.veiculoId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecione o veículo", path: ["veiculoId"] });
  }
  if (data.alvo === 'OUTROS' && !data.numeroCA) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe o nº do CA/Série", path: ["numeroCA"] });
  }
});

export type ManutencaoFormValues = z.output<typeof manutencaoSchema>;

export interface PayloadOrdemServico {
  tipo: string;
  veiculoId: string | null;
  fornecedorId: string;
  kmAtual: number | null;
  data: string;
  observacoes: string;
  itens: { produtoId: string; quantidade: number; valorPorUnidade: number }[];
}