import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';
import { parseDecimal, formatKmVisual } from '../../utils';
import type { Veiculo, Produto, Fornecedor } from '../../types';

const ALVOS_MANUTENCAO = ['VEICULO', 'OUTROS'] as const;
type TipoManutencao = 'CORRETIVA' | 'PREVENTIVA';

const manutencaoSchema = z.object({
  tipo: z.enum(["PREVENTIVA", "CORRETIVA"]),
  alvo: z.enum(ALVOS_MANUTENCAO),
  veiculoId: z.string().optional().nullable(),
  kmAtual: z.string().optional().nullable(),
  numeroCA: z.string().optional(),
  fornecedorId: z.string({ error: "Selecione o fornecedor" }).min(1, "Selecione o fornecedor"),
  data: z.string().min(1, "Data inválida"),
  observacoes: z.string().optional(),
  fotoComprovanteUrl: z.string().optional().nullable(),
  itens: z.array(z.object({
    produtoId: z.string().min(1, "Selecione o item"),
    quantidade: z.coerce.number().min(0.01, "Qtd inválida"),
    valorPorUnidade: z.coerce.number().min(0, "Valor inválido"),
  })).min(1, "Adicione pelo menos um item")
})
  // Refinamentos (superRefine) para validação condicional
  .superRefine((data, ctx) => {
    if (data.alvo === 'VEICULO' && !data.veiculoId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecione o veículo", path: ["veiculoId"] });
    }
    if (data.alvo === 'OUTROS' && !data.numeroCA) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe o nº do CA", path: ["numeroCA"] });
    }
  });

type ManutencaoFormInput = z.input<typeof manutencaoSchema>;

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

  const caMatch = osParaEditar.observacoes?.match(/\[CA: (.+?)\]/);
  const caExistente = caMatch ? caMatch[1] : '';
  const obsLimpa = osParaEditar.observacoes?.replace(/\[CA: .+?\] /, '') || '';

  const [abaAtiva, setAbaAtiva] = useState<TipoManutencao>(osParaEditar.tipo || 'CORRETIVA');

  const fornecedoresFiltrados = fornecedores.filter(f => {
    if (abaAtiva === 'CORRETIVA') {
      return !['POSTO', 'LAVA_JATO'].includes(f.tipo);
    }
    return true;
  });

  const produtosManutencao = produtos.filter(p => !['COMBUSTIVEL', 'ADITIVO', 'LAVAGEM'].includes(p.tipo));

  const {
    register, control, handleSubmit, watch, setValue,
    formState: { errors, isSubmitting } // CORREÇÃO: Agora usamos 'errors'
  } = useForm<ManutencaoFormInput>({
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
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "itens" });
  const alvoSelecionado = watch('alvo');
  const itensObservados = watch('itens');

  useEffect(() => {
    setValue('tipo', abaAtiva);
  }, [abaAtiva, setValue]);

  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("kmAtual", formatKmVisual(e.target.value));
  };

  const onSubmit = async (data: ManutencaoFormInput) => {
    let obsFinal = data.observacoes || '';
    if (data.alvo === 'OUTROS' && data.numeroCA) {
      obsFinal = `[CA: ${data.numeroCA}] ${obsFinal}`;
    }

    const payload = {
      ...data,
      kmAtual: data.kmAtual ? parseDecimal(data.kmAtual) : null,
      observacoes: obsFinal,
      data: new Date(data.data).toISOString(),
    };

    try {
      await api.put(`/ordens-servico/${osParaEditar.id}`, payload);
      toast.success("Manutenção atualizada com sucesso!");
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar registro.");
    }
  };

  const totalGeral = (itensObservados || []).reduce((acc, item) =>
    acc + ((Number(item?.quantidade) || 0) * (Number(item?.valorPorUnidade) || 0)), 0
  );

  return (
    <div className="bg-white p-6 rounded-card shadow-lg border border-primary/20 relative animate-in fade-in zoom-in-95">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">Editar Manutenção</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      <div className="flex mb-6 border-b border-gray-200">
        <button type="button" onClick={() => setAbaAtiva('CORRETIVA')} className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wide transition-colors ${abaAtiva === 'CORRETIVA' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-400 hover:text-gray-600'}`}>Corretiva</button>
        <button type="button" onClick={() => setAbaAtiva('PREVENTIVA')} className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wide transition-colors ${abaAtiva === 'PREVENTIVA' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>Preventiva</button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        <div className="flex p-1 bg-gray-50 rounded-lg border border-gray-200 mb-2">
          <button type="button" onClick={() => setValue('alvo', 'VEICULO')} className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${alvoSelecionado === 'VEICULO' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'}`}>Veículo</button>
          <button type="button" onClick={() => setValue('alvo', 'OUTROS')} className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${alvoSelecionado === 'OUTROS' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'}`}>Caixa / Equip.</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {alvoSelecionado === 'VEICULO' ? (
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">Veículo</label>
                <select {...register("veiculoId")} className="w-full px-3 py-2 bg-white border rounded-md focus:ring-2 focus:ring-primary outline-none text-sm">
                  {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa}</option>)}
                </select>
                {/* CORREÇÃO: Exibindo erro */}
                {errors.veiculoId && <span className="text-xs text-red-500">{errors.veiculoId.message}</span>}
              </div>
              <div>
                <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">KM</label>
                <Input
                  {...register("kmAtual")}
                  onChange={(e) => {
                    register("kmAtual").onChange(e);
                    handleKmChange(e);
                  }}
                  error={errors.kmAtual?.message} // CORREÇÃO: Passando erro
                />
              </div>
            </div>
          ) : (
            <div className="md:col-span-2">
              <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">CA</label>
              <Input {...register("numeroCA")} error={errors.numeroCA?.message} /> {/* CORREÇÃO */}
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">Fornecedor</label>
            <select {...register("fornecedorId")} className="w-full px-3 py-2 bg-white border rounded-md focus:ring-2 focus:ring-primary outline-none text-sm">
              {fornecedoresFiltrados.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
            {/* CORREÇÃO: Exibindo erro */}
            {errors.fornecedorId && <span className="text-xs text-red-500">{errors.fornecedorId.message}</span>}
          </div>

          <div className="md:col-span-2">
            <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">Data</label>
            <Input type="date" {...register("data")} error={errors.data?.message} /> {/* CORREÇÃO */}
          </div>
        </div>

        {/* Itens */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-bold uppercase text-gray-500">Itens</h4>
            <span className="text-[10px] bg-white px-2 py-0.5 rounded border text-gray-400">{fields.length} itens</span>
          </div>

          {fields.map((field, index) => {
            // CORREÇÃO: Capturar erros específicos do item
            const itemError = errors.itens?.[index];

            return (
              <div key={field.id} className="grid grid-cols-12 gap-2 mb-2 items-center">
                <div className="col-span-6">
                  <select
                    {...register(`itens.${index}.produtoId`)}
                    className={`w-full p-2 text-sm border rounded bg-white ${itemError?.produtoId ? 'border-red-300' : ''}`}
                  >
                    {produtosManutencao.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    {...register(`itens.${index}.quantidade`)}
                    className={`w-full p-2 text-sm border rounded text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${itemError?.quantidade ? 'border-red-300' : ''}`}
                    placeholder="Qtd"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    step="0.01"
                    {...register(`itens.${index}.valorPorUnidade`)}
                    className={`w-full p-2 text-sm border rounded text-right outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${itemError?.valorPorUnidade ? 'border-red-300' : ''}`}
                    placeholder="R$"
                  />
                </div>
                <div className="col-span-1 text-right">
                  <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600 font-bold text-lg">×</button>
                </div>
              </div>
            );
          })}

          <div className="flex justify-between mt-3 pt-2 border-t border-gray-200">
            <button type="button" onClick={() => append({ produtoId: '', quantidade: 1, valorPorUnidade: 0 })} className="text-xs text-blue-600 font-bold hover:underline">+ Adicionar Item</button>
            <span className="text-sm font-bold text-gray-700">Total: R$ {totalGeral.toFixed(2)}</span>
          </div>

          {/* CORREÇÃO: Erro geral de itens */}
          {errors.itens && <p className="text-xs text-red-500 mt-2 text-right">{errors.itens.root?.message}</p>}
        </div>

        <Input label="Observações" {...register("observacoes")} />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" className="flex-1" isLoading={isSubmitting}>Salvar Alterações</Button>
        </div>
      </form>
    </div>
  );
}