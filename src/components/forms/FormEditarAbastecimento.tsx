import { useEffect, useState, useMemo } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import { 
  Fuel, Save, Plus, X, User as UserIcon, Truck, 
  MapPin, Calendar, CreditCard, Image as ImageIcon, Loader2 
} from 'lucide-react';

// --- DESIGN SYSTEM ---
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select'; 
import type { Abastecimento } from '../../types';

// --- HOOKS ATÔMICOS ---
import { useVeiculos } from '../../hooks/useVeiculos';
import { useUsuarios } from '../../hooks/useUsuarios';
import { useProdutos } from '../../hooks/useProdutos';
import { useFornecedores } from '../../hooks/useFornecedores';

// --- UTILS: Compressão de Imagem ---
const comprimirImagem = (arquivo: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(arquivo);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1600;
        let [w, h] = [img.width, img.height];

        if (w > h) { if (w > MAX_WIDTH) { h *= MAX_WIDTH / w; w = MAX_WIDTH; } }
        else { if (h > MAX_HEIGHT) { w *= MAX_HEIGHT / h; h = MAX_HEIGHT; } }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob((blob) => {
            if (blob) resolve(new File([blob], arquivo.name.replace(/\.[^/.]+$/, ".jpg"), { type: 'image/jpeg', lastModified: Date.now() }));
            else reject(new Error("Erro ao comprimir"));
          }, 'image/jpeg', 0.7);
        } else reject(new Error("Erro canvas"));
      };
    };
    reader.onerror = (err) => reject(err);
  });
};

// --- SCHEMA ---
const itemSchema = z.object({
  produtoId: z.string().min(1, "Selecione o produto"),
  quantidade: z.coerce.number().gt(0, "Qtd inválida"),
  valorPorUnidade: z.coerce.number().min(0, "Valor inválido"),
});

const editSchema = z.object({
  veiculoId: z.string().min(1, "Veículo obrigatório"),
  operadorId: z.string().optional(),
  fornecedorId: z.string().min(1, "Fornecedor obrigatório"),
  kmOdometro: z.coerce.number().min(1, "KM obrigatório"),
  dataHora: z.string().min(1, "Data obrigatória"),
  placaCartaoUsado: z.string().optional(),
  justificativa: z.string().optional(),
  fotoNotaFiscalUrl: z.string().optional().nullable(),
  itens: z.array(itemSchema).min(1, "Adicione itens"),
});

type EditFormInput = z.input<typeof editSchema>;
type EditFormOutput = z.output<typeof editSchema>;

interface FormEditarAbastecimentoProps {
  abastecimentoId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function FormEditarAbastecimento({ abastecimentoId, onSuccess, onCancel }: FormEditarAbastecimentoProps) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);

  // 📡 DADOS GLOBAIS COM CACHE (ATÔMICOS)
  const { data: usuarios = [], isLoading: loadU } = useUsuarios();
  const { data: veiculos = [], isLoading: loadV } = useVeiculos();
  const { data: produtos = [], isLoading: loadP } = useProdutos();
  const { data: fornecedores = [], isLoading: loadF } = useFornecedores();

  // 1. Query Específica do Abastecimento
  const { data: abastecimento, isLoading: loadingAbs } = useQuery<Abastecimento>({
    queryKey: ['abastecimento', abastecimentoId],
    queryFn: async () => (await api.get(`/abastecimentos/${abastecimentoId}`)).data,
    retry: 1
  });

  const isLoadingDados = loadU || loadV || loadP || loadF || loadingAbs;

  // Filtros
  const produtosCombustivel = useMemo(() => produtos.filter(p => ['COMBUSTIVEL', 'ADITIVO'].includes(p.tipo)), [produtos]);
  const fornecedoresPosto = useMemo(() => fornecedores.filter(f => f.tipo === 'POSTO'), [fornecedores]);
  const motoristas = useMemo(() => usuarios.filter(u => ['OPERADOR', 'ENCARREGADO'].includes(u.role)), [usuarios]);

  const veiculosOptions = useMemo(() => veiculos.map(v => ({ value: v.id, label: `${v.placa} - ${v.modelo}` })), [veiculos]);
  const motoristasOptions = useMemo(() => motoristas.map(u => ({ value: u.id, label: u.nome })), [motoristas]);
  const fornecedoresOptions = useMemo(() => fornecedoresPosto.map(f => ({ value: f.id, label: f.nome })), [fornecedoresPosto]);
  const produtosOptions = useMemo(() => produtosCombustivel.map(p => ({ value: p.id, label: p.nome })), [produtosCombustivel]);

  // 2. Form Setup
  const { register, control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<EditFormInput, any, EditFormOutput>({
    resolver: zodResolver(editSchema),
    mode: 'onBlur'
  });

  const { fields, append, remove } = useFieldArray({ control, name: "itens" });
  const itensWatch = useWatch({ control, name: "itens" });

  const totalGeral = (itensWatch || []).reduce((acc, item) =>
    acc + (Number(item?.quantidade || 0) * Number(item?.valorPorUnidade || 0)), 0
  ) || 0;

  // 3. Populate
  useEffect(() => {
    if (abastecimento) {
      const abs = abastecimento as any;
      reset({
        veiculoId: abs.veiculoId || abs.veiculo?.id,
        operadorId: abs.operadorId || usuarios.find(u => u.nome === abs.operador?.nome)?.id || '',
        fornecedorId: abs.fornecedorId || fornecedores.find(f => f.nome === abs.fornecedor?.nome)?.id || '',
        kmOdometro: Number(abs.kmOdometro),
        dataHora: new Date(abs.dataHora).toISOString().slice(0, 16),
        placaCartaoUsado: abs.placaCartaoUsado || '',
        justificativa: abs.justificativa || '',
        fotoNotaFiscalUrl: abs.fotoNotaFiscalUrl,
        itens: abs.itens?.map((i: any) => ({
          produtoId: i.produtoId || i.produto?.id || '',
          quantidade: i.quantidade,
          valorPorUnidade: i.valorPorUnidade || ((i.produto as any)?.valorAtual || 0)
        })) || []
      });
      if (abs.fotoNotaFiscalUrl) setPreviewFoto(abs.fotoNotaFiscalUrl);
    }
  }, [abastecimento, usuarios, fornecedores, reset]);

  // 4. Upload
  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    try {
      setUploading(true);
      const compressedFile = await comprimirImagem(file);
      const fileName = `abastecimento-${Date.now()}-${Math.random().toString(36).substring(2,9)}.jpg`;
      const { data: uploadData, error } = await supabase.storage.from('fotos-frota').upload(`public/${fileName}`, compressedFile);
      if (error) throw error;
      const { data: publicUrl } = supabase.storage.from('fotos-frota').getPublicUrl(uploadData.path);
      setValue('fotoNotaFiscalUrl', publicUrl.publicUrl);
      setPreviewFoto(publicUrl.publicUrl);
      toast.success("Foto atualizada!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar foto.");
    } finally {
      setUploading(false);
    }
  };

  // 5. Mutation
  const updateMutation = useMutation({
    mutationFn: async (data: EditFormOutput) => {
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
      toast.success("Atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['abastecimentos'] });
      queryClient.invalidateQueries({ queryKey: ['abastecimento', abastecimentoId] });
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erro ao salvar.");
    }
  });

  const isLocked = isSubmitting || uploading || updateMutation.isPending;

  // Renderiza um loader elegante enquanto as listas não carregam
  if (isLoadingDados) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-text-muted animate-pulse">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-surface min-h-0">
      
      {/* HEADER FIXO */}
      <div className="px-6 py-4 border-b border-border flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-lg font-bold text-text-main">Editar Abastecimento</h3>
          <p className="text-xs text-text-secondary">Ajuste os dados e comprovante.</p>
        </div>
        <div className="p-2 bg-surface-hover rounded-lg text-primary">
          <Fuel className="w-5 h-5" />
        </div>
      </div>

      {/* BODY COM SCROLL INTERNO */}
      <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="flex-1 flex flex-col overflow-hidden min-h-0">
        
        {/* MIOLO ROLÁVEL */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 min-h-0">

          <div className="flex flex-col md:flex-row gap-6">
            {/* Foto */}
            <div className="w-full md:w-1/3 flex flex-col gap-2">
              <span className="text-xs font-bold text-text-secondary uppercase ml-1">Comprovante</span>
              <div className="relative aspect-[3/4] bg-surface-hover/30 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center overflow-hidden group hover:border-primary transition-colors cursor-pointer">
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-xs text-text-muted">Enviando...</span>
                  </div>
                ) : previewFoto ? (
                  <>
                    <img src={previewFoto} alt="Nota" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                       <ImageIcon className="w-8 h-8 text-white" />
                       <span className="text-white text-xs font-bold bg-black/20 px-2 py-1 rounded">Trocar Foto</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-text-muted p-4">
                    <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Clique para adicionar</p>
                  </div>
                )}
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleFotoChange} disabled={isLocked} />
              </div>
            </div>

            {/* Campos */}
            <div className="w-full md:w-2/3 grid grid-cols-1 gap-5 content-start">
              <Select label="Veículo" options={veiculosOptions} icon={<Truck className="w-4 h-4"/>} {...register('veiculoId')} error={errors.veiculoId?.message} disabled={isLocked} />
              <Select label="Motorista" options={motoristasOptions} icon={<UserIcon className="w-4 h-4"/>} {...register('operadorId')} disabled={isLocked} />
              <Select label="Fornecedor" options={fornecedoresOptions} icon={<MapPin className="w-4 h-4"/>} {...register('fornecedorId')} error={errors.fornecedorId?.message} disabled={isLocked} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="KM Odômetro" type="number" {...register('kmOdometro')} error={errors.kmOdometro?.message} disabled={isLocked} />
                <Input label="Cartão (Final)" maxLength={4} placeholder="Ex: 1234" icon={<CreditCard className="w-4 h-4"/>} {...register('placaCartaoUsado')} disabled={isLocked} containerClassName="!mb-0" />
              </div>
              <Input label="Data e Hora" type="datetime-local" icon={<Calendar className="w-4 h-4"/>} {...register('dataHora')} error={errors.dataHora?.message} disabled={isLocked} containerClassName="!mb-0" />
            </div>
          </div>

          {/* Itens */}
          <div className="bg-surface-hover/30 rounded-xl border border-border p-4">
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Itens</label>
              <span className="bg-surface border border-border px-3 py-1 rounded-lg text-xs font-mono font-bold text-primary shadow-sm">
                Total: R$ {totalGeral.toFixed(2)}
              </span>
            </div>
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-3 items-end bg-surface p-3 rounded-xl border border-border shadow-sm relative group hover:border-primary/30 transition-colors">
                  <button type="button" onClick={() => remove(index)} disabled={isLocked} className="absolute -top-2 -right-2 bg-surface text-text-muted hover:text-error rounded-full w-6 h-6 border border-border shadow-sm flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-all">
                    <X className="w-3 h-3" />
                  </button>
                  <div className="col-span-12 sm:col-span-5">
                    <Select options={produtosOptions} {...register(`itens.${index}.produtoId`)} className="h-9 text-xs" disabled={isLocked} containerClassName="!mb-0" />
                  </div>
                  <div className="col-span-6 sm:col-span-3">
                    <Input label="Qtd" type="number" step="any" {...register(`itens.${index}.quantidade`)} className="h-9 text-xs text-center" containerClassName="!mb-0" disabled={isLocked} />
                  </div>
                  <div className="col-span-6 sm:col-span-4">
                    <Input label="R$ Unit" type="number" step="0.001" {...register(`itens.${index}.valorPorUnidade`)} className="h-9 text-xs text-right font-mono font-bold" containerClassName="!mb-0" disabled={isLocked} />
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => append({ produtoId: '', quantidade: 0, valorPorUnidade: 0 })} disabled={isLocked} className="w-full mt-3 py-2 border border-dashed border-border rounded-lg text-xs font-bold text-text-muted hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-1 h-10">
              <Plus className="w-4 h-4" /> Adicionar Combustível / Aditivo
            </button>
          </div>

          <Input label="Justificativa (Opcional)" {...register('justificativa')} disabled={isLocked} placeholder="Motivo da alteração..." />
        </div>

        {/* FOOTER FIXO */}
        <div className="flex gap-3 p-4 border-t border-border bg-surface-hover/30 shrink-0">
          <Button type="button" variant="ghost" onClick={onCancel} className="flex-1" disabled={isLocked}>Cancelar</Button>
          
          <Button 
            type="submit" 
            variant="primary" 
            isLoading={isLocked} 
            disabled={isLocked} 
            className="flex-[2] shadow-lg" 
            icon={!isLocked ? <Save className="w-4 h-4" /> : undefined}
          >
            {isLocked ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
}