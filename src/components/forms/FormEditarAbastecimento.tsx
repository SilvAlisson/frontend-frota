import { useEffect } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { api } from '../../services/api';
import { toast } from 'sonner';
import type { Abastecimento, User, Veiculo, Produto, Fornecedor } from '../../types';

// --- SCHEMA VALIDATION ---
const itemSchema = z.object({
  produtoId: z.string().min(1, "Selecione o produto"),
  quantidade: z.coerce.number().gt(0, "Qtd inválida"),
  valorPorUnidade: z.coerce.number().gt(0, "Valor inválido"),
});

const editSchema = z.object({
  veiculoId: z.string().min(1, "Veículo obrigatório"),
  operadorId: z.string().optional(),
  fornecedorId: z.string().min(1, "Fornecedor obrigatório"),
  kmOdometro: z.coerce.number().min(1, "KM obrigatório"),
  dataHora: z.string().min(1, "Data obrigatória"),
  placaCartaoUsado: z.string().optional(),
  justificativa: z.string().optional(),
  itens: z.array(itemSchema).min(1, "Adicione itens"),
});

type EditFormValues = z.input<typeof editSchema>;

interface FormEditarAbastecimentoProps {
  abastecimentoId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Estilos
const selectStyle = "w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all";
const labelStyle = "block mb-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide";

export function FormEditarAbastecimento({ abastecimentoId, onSuccess, onCancel }: FormEditarAbastecimentoProps) {
  const queryClient = useQueryClient();

  // 1. Buscas de Dados com React Query (Limpo e com Cache)
  const { data: abastecimento, isLoading: loadingAbs } = useQuery<Abastecimento>({
    queryKey: ['abastecimento', abastecimentoId],
    queryFn: async () => {
      const { data } = await api.get(`/abastecimentos/${abastecimentoId}`);
      return data;
    }
  });

  const { data: usuarios = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users')).data,
    staleTime: 1000 * 60 * 5 // Cache de 5 min
  });

  const { data: veiculos = [] } = useQuery<Veiculo[]>({
    queryKey: ['veiculos'],
    queryFn: async () => (await api.get('/veiculos')).data,
    staleTime: 1000 * 60 * 5
  });

  const { data: produtos = [] } = useQuery<Produto[]>({
    queryKey: ['produtos'],
    queryFn: async () => (await api.get('/produtos')).data,
    staleTime: 1000 * 60 * 30
  });

  const { data: fornecedores = [] } = useQuery<Fornecedor[]>({
    queryKey: ['fornecedores'],
    queryFn: async () => (await api.get('/fornecedores')).data,
    staleTime: 1000 * 60 * 30
  });

  // 2. Filtros de Listas
  const produtosCombustivel = produtos.filter(p => ['COMBUSTIVEL', 'ADITIVO'].includes(p.tipo));
  const fornecedoresPosto = fornecedores.filter(f => f.tipo === 'POSTO');
  const motoristas = usuarios.filter(u => ['OPERADOR', 'ENCARREGADO'].includes(u.role));

  // 3. Configuração do Formulário
  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema)
  });

  const { fields, append, remove } = useFieldArray({ control, name: "itens" });
  const itensWatch = useWatch({ control, name: "itens" });

  const totalGeral = itensWatch?.reduce((acc, item) => 
    acc + (Number(item.quantidade || 0) * Number(item.valorPorUnidade || 0)), 0
  ) || 0;

  // 4. Popula o formulário quando os dados chegam
  useEffect(() => {
    if (abastecimento) {
      reset({
        veiculoId: abastecimento.veiculoId || (abastecimento.veiculo as any)?.id,
        // Tenta pegar o ID direto (se o backend mandar) ou busca pelo objeto relacionado
        operadorId: (abastecimento as any).operadorId || usuarios.find(u => u.nome === abastecimento.operador?.nome)?.id || '',
        fornecedorId: (abastecimento as any).fornecedorId || fornecedores.find(f => f.nome === abastecimento.fornecedor?.nome)?.id || '',
        
        kmOdometro: abastecimento.kmOdometro,
        dataHora: new Date(abastecimento.dataHora).toISOString().slice(0, 16),
        placaCartaoUsado: abastecimento.placaCartaoUsado || '',
        justificativa: abastecimento.justificativa || '',
        
        itens: abastecimento.itens.map(i => ({
          produtoId: (i as any).produtoId || i.produto.id,
          quantidade: i.quantidade,
          // Garante que pegamos o valor unitário corretamente
          valorPorUnidade: (i as any).valorPorUnidade || (i.produto as any).valorAtual || 0
        }))
      });
    }
  }, [abastecimento, usuarios, fornecedores, reset]);

  // 5. Mutação para Salvar
  const updateMutation = useMutation({
    mutationFn: async (data: EditFormValues) => {
      await api.put(`/abastecimentos/${abastecimentoId}`, {
        ...data,
        dataHora: new Date(data.dataHora).toISOString(),
        itens: data.itens.map(i => ({
          produtoId: i.produtoId,
          quantidade: Number(i.quantidade),
          valorPorUnidade: Number(i.valorPorUnidade)
        }))
      });
    },
    onSuccess: () => {
      toast.success("Abastecimento atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['abastecimentos'] }); // Atualiza a lista principal
      onSuccess();
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.response?.data?.error || "Erro ao salvar alterações.");
    }
  });

  const onSubmit = (data: EditFormValues) => {
    updateMutation.mutate(data);
  };

  if (loadingAbs) return (
    <div className="flex flex-col items-center justify-center py-12 space-y-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="text-sm text-gray-500">Carregando dados...</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <h3 className="text-lg font-bold text-gray-800">Editar Abastecimento</h3>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelStyle}>Veículo</label>
          <select className={selectStyle} {...register('veiculoId')}>
            {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>)}
          </select>
          {errors.veiculoId && <p className="text-xs text-red-500 mt-1">{errors.veiculoId.message}</p>}
        </div>

        <div>
          <label className={labelStyle}>Motorista</label>
          <select className={selectStyle} {...register('operadorId')}>
            <option value="">Selecione...</option>
            {motoristas.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
        </div>

        <div>
          <label className={labelStyle}>Fornecedor</label>
          <select className={selectStyle} {...register('fornecedorId')}>
            {fornecedoresPosto.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
          {errors.fornecedorId && <p className="text-xs text-red-500 mt-1">{errors.fornecedorId.message}</p>}
        </div>

        <div>
          <Input 
            label="KM Odômetro" 
            type="number" 
            {...register('kmOdometro')} 
            error={errors.kmOdometro?.message} 
          />
        </div>

        <div>
          <label className={labelStyle}>Data/Hora</label>
          <Input 
            type="datetime-local" 
            {...register('dataHora')} 
            error={errors.dataHora?.message} 
          />
        </div>

        <div>
          <Input 
            label="Final Cartão" 
            {...register('placaCartaoUsado')} 
            maxLength={4}
            placeholder="Ex: 1234"
          />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Itens do Abastecimento</label>
            <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">
              Total: R$ {totalGeral.toFixed(2)}
            </span>
        </div>
        
        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-12 gap-2 mb-3 items-end bg-white p-2 rounded-lg border border-gray-100">
            <div className="col-span-5">
                <label className="block text-[10px] text-gray-400 font-bold mb-1">Produto</label>
                <select className={selectStyle + " py-2 text-xs"} {...register(`itens.${index}.produtoId`)}>
                    {produtosCombustivel.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
            </div>
            <div className="col-span-3">
                <label className="block text-[10px] text-gray-400 font-bold mb-1">Qtd</label>
                <Input placeholder="0" type="number" step="any" {...register(`itens.${index}.quantidade`)} className="!py-2 text-xs" />
            </div>
            <div className="col-span-3">
                <label className="block text-[10px] text-gray-400 font-bold mb-1">Valor Un.</label>
                <Input placeholder="R$ 0,00" type="number" step="0.01" {...register(`itens.${index}.valorPorUnidade`)} className="!py-2 text-xs" />
            </div>
            <div className="col-span-1 flex justify-center pb-1">
                {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors" title="Remover item">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}
            </div>
          </div>
        ))}
        <Button 
          type="button" 
          variant="secondary" 
          onClick={() => append({ produtoId: '', quantidade: 0, valorPorUnidade: 0 })} 
          className="text-xs w-full mt-1 border-dashed border-gray-300 hover:border-primary/50"
        >
          + Adicionar Item
        </Button>
      </div>

      <div className="pt-2">
        <label className={labelStyle}>Justificativa (Opcional)</label>
        <textarea
          className="w-full px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none h-20"
          {...register('justificativa')}
          placeholder="Motivo da edição..."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1" disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting} className="flex-1 shadow-lg shadow-primary/20">
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
}