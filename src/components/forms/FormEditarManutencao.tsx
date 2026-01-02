import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';
import { parseDecimal, formatKmVisual } from '../../utils';
import type { Veiculo, Produto, Fornecedor } from '../../types';

const ALVOS_MANUTENCAO = ['VEICULO', 'OUTROS'] as const;
type TipoManutencao = 'CORRETIVA' | 'PREVENTIVA';

// --- SCHEMA ---
const manutencaoSchema = z.object({
  tipo: z.enum(["PREVENTIVA", "CORRETIVA"]),
  alvo: z.enum(ALVOS_MANUTENCAO),
  // Veículo e KM são strings no input (máscara), tratados no submit
  veiculoId: z.string().optional().nullable(),
  kmAtual: z.string().optional().nullable(),
  numeroCA: z.string().optional(),

  fornecedorId: z.string().min(1, "Selecione o fornecedor"),
  data: z.string().min(1, "Data inválida"),
  observacoes: z.string().optional(),
  fotoComprovanteUrl: z.string().optional().nullable(),

  itens: z.array(z.object({
    produtoId: z.string().min(1, "Selecione o item"),
    // Coerce converte string do input para number
    quantidade: z.coerce.number().min(0.01, "Qtd inválida"),
    valorPorUnidade: z.coerce.number().min(0, "Valor inválido"),
  })).min(1, "Adicione pelo menos um item")
}).superRefine((data, ctx) => {
  // Validação Condicional
  if (data.alvo === 'VEICULO' && !data.veiculoId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecione o veículo", path: ["veiculoId"] });
  }
  if (data.alvo === 'OUTROS' && !data.numeroCA) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe o nº do CA", path: ["numeroCA"] });
  }
});

// Tipagem Segura
type ManutencaoFormInput = z.input<typeof manutencaoSchema>;
type ManutencaoFormOutput = z.output<typeof manutencaoSchema>;

interface FormEditarManutencaoProps {
  osParaEditar: any;
  veiculos: Veiculo[];
  produtos: Produto[];
  fornecedores: Fornecedor[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function FormEditarManutencao({
  osParaEditar, veiculos, produtos, fornecedores, onSuccess, onCancel
}: FormEditarManutencaoProps) {

  // Extração de CA (Lógica legada mantida)
  const caMatch = osParaEditar.observacoes?.match(/\[CA: (.+?)\]/);
  const caExistente = caMatch ? caMatch[1] : '';
  const obsLimpa = osParaEditar.observacoes?.replace(/\[CA: .+?\] /, '') || '';

  const [abaAtiva, setAbaAtiva] = useState<TipoManutencao>(osParaEditar.tipo || 'CORRETIVA');

  // Filtros Otimizados
  const fornecedoresFiltrados = useMemo(() => fornecedores.filter(f => {
    if (abaAtiva === 'CORRETIVA') return !['POSTO', 'LAVA_JATO'].includes(f.tipo);
    return true;
  }), [fornecedores, abaAtiva]);

  const produtosManutencao = useMemo(() =>
    produtos.filter(p => !['COMBUSTIVEL', 'ADITIVO', 'LAVAGEM'].includes(p.tipo)),
    [produtos]);

  const {
    register, control, handleSubmit, watch, setValue,
    formState: { errors, isSubmitting }
  } = useForm<ManutencaoFormInput, any, ManutencaoFormOutput>({ // [CORREÇÃO: Tipagem]
    resolver: zodResolver(manutencaoSchema),
    defaultValues: {
      tipo: osParaEditar.tipo,
      alvo: osParaEditar.veiculoId ? 'VEICULO' : 'OUTROS',
      veiculoId: osParaEditar.veiculoId || '',
      kmAtual: osParaEditar.kmAtual ? formatKmVisual(String(osParaEditar.kmAtual)) : '',
      numeroCA: caExistente,
      fornecedorId: osParaEditar.fornecedorId,
      data: new Date(osParaEditar.data).toISOString().slice(0, 10),
      observacoes: obsLimpa,
      fotoComprovanteUrl: osParaEditar.fotoComprovanteUrl,
      itens: osParaEditar.itens.map((i: any) => ({
        produtoId: i.produtoId,
        quantidade: Number(i.quantidade),
        valorPorUnidade: Number(i.valorPorUnidade)
      }))
    },
    mode: 'onBlur' // [CORREÇÃO: UX]
  });

  const { fields, append, remove } = useFieldArray({ control, name: "itens" });

  const alvoSelecionado = watch('alvo');
  const itensWatch = useWatch({ control, name: 'itens' });

  // Sincroniza Aba com Form
  useEffect(() => { setValue('tipo', abaAtiva); }, [abaAtiva, setValue]);

  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("kmAtual", formatKmVisual(e.target.value));
  };

  const totalGeral = itensWatch?.reduce((acc, item) =>
    acc + ((Number(item?.quantidade) || 0) * (Number(item?.valorPorUnidade) || 0)), 0
  ) || 0;

  const onSubmit = async (data: ManutencaoFormOutput) => {
    let obsFinal = data.observacoes || '';
    if (data.alvo === 'OUTROS' && data.numeroCA) {
      obsFinal = `[CA: ${data.numeroCA}] ${obsFinal}`;
    }

    const payload = {
      ...data,
      // parseDecimal converte a string formatada "1.000" para number 1000
      kmAtual: data.kmAtual ? parseDecimal(data.kmAtual) : null,
      observacoes: obsFinal,
      data: new Date(data.data).toISOString(),
    };

    try {
      await api.put(`/ordens-servico/${osParaEditar.id}`, payload);
      toast.success("Manutenção atualizada!");
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar registro.");
    }
  };

  // Estilos
  const labelStyle = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1";
  const selectStyle = "w-full h-10 px-3 bg-white border border-border rounded-input text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer placeholder:text-gray-400 disabled:bg-gray-50";

  return (
    <div className="bg-white rounded-xl shadow-lg border border-border overflow-hidden flex flex-col h-full max-h-[85vh]">

      {/* HEADER */}
      <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Editar Manutenção</h3>
          <p className="text-xs text-gray-500">Ajuste de peças, valores ou datas.</p>
        </div>
        <div className="w-10 h-10 bg-white rounded-lg border border-border flex items-center justify-center text-primary shadow-sm">
          🔧
        </div>
      </div>

      {/* TABS DE TIPO */}
      <div className="flex border-b border-border shrink-0">
        {['CORRETIVA', 'PREVENTIVA'].map(tipo => (
          <button
            key={tipo}
            type="button"
            onClick={() => setAbaAtiva(tipo as TipoManutencao)}
            disabled={isSubmitting} // [CORREÇÃO] Bloqueio
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 ${abaAtiva === tipo ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-400 hover:text-gray-600 hover:bg-background'}`}
          >
            {tipo}
          </button>
        ))}
      </div>

      {/* FORMULÁRIO */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* SELEÇÃO DE ALVO */}
        <div className="bg-background p-1 rounded-lg flex border border-border">
          {ALVOS_MANUTENCAO.map(alvo => (
            <button
              key={alvo}
              type="button"
              onClick={() => setValue('alvo', alvo)}
              disabled={isSubmitting} // [CORREÇÃO] Bloqueio
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all shadow-sm disabled:opacity-50 ${alvoSelecionado === alvo ? 'bg-white text-gray-800 shadow' : 'bg-transparent text-gray-400 shadow-none'}`}
            >
              {alvo === 'VEICULO' ? 'Veículo da Frota' : 'Outro Equipamento'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {alvoSelecionado === 'VEICULO' ? (
            <>
              <div>
                <label className={labelStyle}>Veículo</label>
                <div className="relative">
                  <select {...register("veiculoId")} className={selectStyle} disabled={isSubmitting}>
                    {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-2.5 text-gray-400 text-xs">▼</div>
                </div>
                {errors.veiculoId && <span className="text-xs text-red-500 mt-1">{errors.veiculoId.message}</span>}
              </div>
              <div>
                <Input
                  label="KM no Momento"
                  {...register("kmAtual")}
                  onChange={(e) => { register("kmAtual").onChange(e); handleKmChange(e); }}
                  error={errors.kmAtual?.message}
                  disabled={isSubmitting}
                />
              </div>
            </>
          ) : (
            <div className="md:col-span-2">
              <Input
                label="Identificação (CA/Série)"
                {...register("numeroCA")}
                error={errors.numeroCA?.message}
                disabled={isSubmitting}
              />
            </div>
          )}

          <div>
            <label className={labelStyle}>Fornecedor</label>
            <div className="relative">
              <select {...register("fornecedorId")} className={selectStyle} disabled={isSubmitting}>
                {fornecedoresFiltrados.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
              <div className="pointer-events-none absolute right-3 top-2.5 text-gray-400 text-xs">▼</div>
            </div>
            {errors.fornecedorId && <span className="text-xs text-red-500 mt-1">{errors.fornecedorId.message}</span>}
          </div>

          <div>
            <Input
              label="Data do Serviço"
              type="date"
              {...register("data")}
              error={errors.data?.message}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* SEÇÃO DE ITENS */}
        <div className="border-t border-border pt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Peças e Serviços</h4>
            <span className="bg-background text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-border">
              Total: {totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => {
              const errItem = errors.itens?.[index];
              return (
                <div key={field.id} className="bg-background p-3 rounded-xl border border-border relative group transition-all hover:border-primary/30 hover:shadow-sm">

                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={isSubmitting}
                    className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full w-6 h-6 border border-border shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 z-10 disabled:hidden"
                  >
                    &times;
                  </button>

                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 sm:col-span-6">
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Item</label>
                      <select
                        {...register(`itens.${index}.produtoId`)}
                        disabled={isSubmitting}
                        className={`w-full text-xs p-2.5 bg-white rounded-lg border outline-none focus:border-primary transition-all disabled:bg-gray-50 ${errItem?.produtoId ? 'border-red-300' : 'border-border'}`}
                      >
                        {produtosManutencao.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                      </select>
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block text-center">Qtd</label>
                      <input
                        type="number" step="0.1"
                        {...register(`itens.${index}.quantidade`)}
                        disabled={isSubmitting}
                        className="w-full text-xs p-2.5 text-center bg-white rounded-lg border border-border outline-none focus:border-primary disabled:bg-gray-50"
                      />
                    </div>
                    <div className="col-span-8 sm:col-span-4">
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block text-right">Valor Unit.</label>
                      <input
                        type="number" step="0.01"
                        {...register(`itens.${index}.valorPorUnidade`)}
                        disabled={isSubmitting}
                        className="w-full text-xs p-2.5 text-right bg-white rounded-lg border border-border outline-none focus:border-primary font-mono disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => append({ produtoId: '', quantidade: 1, valorPorUnidade: 0 })}
            disabled={isSubmitting}
            className="w-full mt-3 py-3 border-2 border-dashed border-border rounded-xl text-xs font-bold text-gray-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50"
          >
            + Adicionar Outro Item
          </button>
          {errors.itens && <p className="text-xs text-red-500 mt-2 text-right">{errors.itens.root?.message}</p>}
        </div>

        {/* OBSERVAÇÕES */}
        <div>
          <label className={labelStyle}>Observações Adicionais</label>
          <textarea
            {...register("observacoes")}
            rows={3}
            disabled={isSubmitting}
            className="w-full px-3 py-3 text-sm bg-white border border-border rounded-input outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none transition-all placeholder:text-gray-300 disabled:bg-gray-50"
            placeholder="Detalhes sobre o serviço realizado..."
          />
        </div>

        {/* BOTÕES */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting} className="flex-1 shadow-lg shadow-primary/20">
            Salvar Alterações
          </Button>
        </div>

      </form>
    </div>
  );
}