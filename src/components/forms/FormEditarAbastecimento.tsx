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
  MapPin, Calendar, CreditCard, Image as ImageIcon, Loader2, Info
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
import { desformatarDinheiro, formatarDinheiro } from '../../lib/formatters';

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

// --- SCHEMA ZOD V4 COMPATÍVEL ---
const itemSchema = z.object({
  produtoId: z.string().min(1, "Selecione o produto"),
  quantidade: z.union([z.string(), z.number()]).transform(v => Number(v)).refine(v => !isNaN(v) && v > 0, "Inválido"),
  // Lidamos com o valor monetário como string pelo fato de ter máscara, ou number se já vier formatado
  valorPorUnidade: z.union([z.string(), z.number()]).transform(v => typeof v === 'string' ? desformatarDinheiro(v) : Number(v)).refine(v => !isNaN(v) && v >= 0, "Valor inválido"),
});

const editSchema = z.object({
  veiculoId: z.string().min(1, "Veículo obrigatório"),
  operadorId: z.string().optional(),
  fornecedorId: z.string().min(1, "Fornecedor obrigatório"),
  kmOdometro: z.union([z.string(), z.number()]).transform(v => Number(v)).refine(v => !isNaN(v) && v >= 1, "Inválido"),
  dataHora: z.string().min(1, "Data obrigatória"),
  placaCartaoUsado: z.string().optional().nullable(),
  justificativa: z.string().optional().nullable(),
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

  // 📡 DADOS GLOBAIS COM CACHE
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

  // Filtros de Selects
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

  const totalGeral = useMemo(() => {
    return (itensWatch || []).reduce((acc, item) => {
        const qtd = Number(item?.quantidade || 0);
        // Suporta tanto o valor bruto numérico (se intocado) quanto a string com máscara
        const unit = typeof item?.valorPorUnidade === 'string' ? desformatarDinheiro(item.valorPorUnidade) : Number(item?.valorPorUnidade || 0);
        return acc + (qtd * unit);
    }, 0);
  }, [itensWatch]);

  // 3. Populate Form (Garantindo formatação de dinheiro)
  useEffect(() => {
    if (abastecimento) {
      const abs = abastecimento as any;
      reset({
        veiculoId: abs.veiculoId || abs.veiculo?.id,
        operadorId: abs.operadorId || usuarios.find(u => u.nome === abs.operador?.nome)?.id || '',
        fornecedorId: abs.fornecedorId || fornecedores.find(f => f.nome === abs.fornecedor?.nome)?.id || '',
        kmOdometro: Number(abs.kmOdometro),
        // Fuso horário correção
        dataHora: new Date(new Date(abs.dataHora).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
        placaCartaoUsado: abs.placaCartaoUsado || '',
        justificativa: abs.justificativa || '',
        fotoNotaFiscalUrl: abs.fotoNotaFiscalUrl,
        itens: abs.itens?.map((i: any) => ({
          produtoId: i.produtoId || i.produto?.id || '',
          quantidade: i.quantidade,
          // Transforma o número que vem do banco (ex: 5.9) em string visual (5,90) para a máscara
          valorPorUnidade: (i.valorPorUnidade || ((i.produto as any)?.valorAtual || 0)).toFixed(2).replace('.', ',')
        })) || []
      });
      if (abs.fotoNotaFiscalUrl) setPreviewFoto(abs.fotoNotaFiscalUrl);
    }
  }, [abastecimento, usuarios, fornecedores, reset]);

  // 4. Upload System
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

  // 5. Mutation API
  const updateMutation = useMutation({
    mutationFn: async (data: EditFormOutput) => {
      await api.put(`/abastecimentos/${abastecimentoId}`, {
        ...data,
        dataHora: new Date(data.dataHora).toISOString(),
        itens: data.itens.map(i => ({
          produtoId: i.produtoId,
          quantidade: Number(i.quantidade),
          valorPorUnidade: Number(i.valorPorUnidade) // Já validado pelo Zod
        }))
      });
    },
    onSuccess: () => {
      toast.success("Abastecimento atualizado!");
      queryClient.invalidateQueries({ queryKey: ['abastecimentos'] });
      queryClient.invalidateQueries({ queryKey: ['abastecimento', abastecimentoId] });
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erro ao salvar alterações.");
    }
  });

  const isLocked = isSubmitting || uploading || updateMutation.isPending;

  // Loader UI
  if (isLoadingDados) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center space-y-4 animate-in fade-in">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-bold text-text-secondary uppercase tracking-widest animate-pulse">Sincronizando Banco de Dados...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-surface rounded-2xl shadow-float border border-border/60 overflow-hidden max-h-[90vh]">
      
      {/* HEADER PREMIUM */}
      <div className="bg-gradient-to-r from-background to-surface-hover/30 px-6 sm:px-8 py-5 border-b border-border/60 flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-xl font-black text-text-main tracking-tight flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary shadow-sm">
                <Fuel className="w-5 h-5" />
            </div>
            Modo Edição Avançado
          </h3>
          <p className="text-sm text-text-secondary font-medium mt-1">Correção de Odômetro e Detalhes da Nota Fiscal.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="flex-1 flex flex-col overflow-hidden min-h-0">
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-8 min-h-0">

          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* FOTO E RECIBO */}
            <div className="w-full lg:w-1/3 flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                  <span className="w-1.5 h-4 bg-primary rounded-full shadow-sm"></span>
                  <label className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">Comprovante</label>
              </div>

              <div className="relative aspect-[3/4] bg-surface-hover/30 rounded-2xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center overflow-hidden group hover:border-primary/50 transition-colors cursor-pointer shadow-sm">
                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Processando...</span>
                  </div>
                ) : previewFoto ? (
                  <>
                    <img src={previewFoto} alt="Nota Fiscal" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                       <ImageIcon className="w-10 h-10 text-white" />
                       <span className="text-white text-[11px] font-black uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-md">Substituir Imagem</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-text-muted p-6 opacity-60 group-hover:opacity-100 group-hover:text-primary transition-colors">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3" />
                    <p className="text-xs font-bold uppercase tracking-widest">Adicionar Nota Fiscal</p>
                  </div>
                )}
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleFotoChange} disabled={isLocked} />
              </div>
            </div>

            {/* DADOS GERAIS */}
            <div className="w-full lg:w-2/3 space-y-5">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                  <span className="w-1.5 h-4 bg-amber-500 rounded-full shadow-sm"></span>
                  <label className="text-[10px] font-black text-amber-600 tracking-[0.2em] uppercase">Informações Operacionais</label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                    <Select label="Veículo Oficial" options={veiculosOptions} icon={<Truck className="w-4 h-4"/>} {...register('veiculoId')} error={errors.veiculoId?.message} disabled={isLocked} />
                </div>
                
                <Select label="Operador / Motorista" options={motoristasOptions} icon={<UserIcon className="w-4 h-4"/>} {...register('operadorId')} disabled={isLocked} />
                <Select label="Posto Fornecedor" options={fornecedoresOptions} icon={<MapPin className="w-4 h-4"/>} {...register('fornecedorId')} error={errors.fornecedorId?.message} disabled={isLocked} />
                
                <Input label="Odômetro Registado" type="number" {...register('kmOdometro')} error={errors.kmOdometro?.message as string} disabled={isLocked} className="font-mono font-bold text-lg text-primary" />
                <Input label="Cartão da Frota (Final)" maxLength={4} placeholder="Ex: 1234" icon={<CreditCard className="w-4 h-4"/>} {...register('placaCartaoUsado')} disabled={isLocked} className="font-mono text-center tracking-widest font-black" />
                
                <div className="md:col-span-2">
                    <Input label="Data e Hora Exata" type="datetime-local" icon={<Calendar className="w-4 h-4"/>} {...register('dataHora')} error={errors.dataHora?.message} disabled={isLocked} />
                </div>
              </div>
            </div>
          </div>

          {/* MATRIZ DE ITENS */}
          <div className="pt-2">
            <div className="flex justify-between items-end mb-4 px-1">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-primary rounded-full shadow-sm"></span>
                    <label className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">Itens Consumidos</label>
                </div>
                <div className="bg-surface border border-border px-4 py-2 rounded-xl text-sm font-medium shadow-sm flex items-center gap-3">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Valor Final:</span>
                    <span className="font-mono font-black text-primary text-lg">R$ {totalGeral.toFixed(2)}</span>
                </div>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-surface-hover/20 p-5 rounded-2xl border border-border/60 shadow-sm relative group hover:border-primary/40 transition-colors duration-300">
                  <button type="button" onClick={() => remove(index)} disabled={isLocked} className="absolute -top-3 -right-3 bg-surface text-text-muted hover:text-white hover:bg-error rounded-full w-8 h-8 border border-border/60 shadow-md flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-all">
                    <X className="w-4 h-4" />
                  </button>

                  <div className="md:col-span-6">
                    <Select label="Produto" options={produtosOptions} {...register(`itens.${index}.produtoId`)} error={errors.itens?.[index]?.produtoId?.message} disabled={isLocked} containerClassName="!mb-0" />
                  </div>

                  <div className="md:col-span-3">
                    <Input label="Litros / Qtd" type="number" step="any" {...register(`itens.${index}.quantidade`)} error={errors.itens?.[index]?.quantidade?.message as string} className="text-center font-mono font-bold" containerClassName="!mb-0" disabled={isLocked} />
                  </div>

                  <div className="md:col-span-3">
                    <Input 
                      label="Preço Un." 
                      {...register(`itens.${index}.valorPorUnidade`, {
                         onChange: (e) => {
                             e.target.value = formatarDinheiro(e.target.value);
                             setValue(`itens.${index}.valorPorUnidade`, e.target.value);
                         }
                      })} 
                      error={errors.itens?.[index]?.valorPorUnidade?.message as string} 
                      className="text-right font-mono font-black text-emerald-600" 
                      containerClassName="!mb-0" 
                      disabled={isLocked} 
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button type="button" variant="secondary" onClick={() => append({ produtoId: '', quantidade: 0, valorPorUnidade: 0 })} disabled={isLocked} icon={<Plus className="w-4 h-4" />} className="w-full mt-4 border-dashed font-bold shadow-sm">
            Adicionar Novo Combustível / Aditivo
            </Button>
          </div>

          <div className="pt-4 border-t border-border/50 space-y-1.5">
             <label className="flex items-center gap-1.5 text-xs font-bold text-text-secondary uppercase tracking-wider ml-1">
               <Info className="w-3.5 h-3.5" /> Motivo da Edição (Auditoria)
             </label>
             <textarea
               {...register('justificativa')}
               disabled={isLocked}
               className="w-full px-4 py-3 text-sm text-text-main bg-surface border border-border/60 rounded-xl transition-all duration-300 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-text-muted disabled:bg-background/50 disabled:cursor-not-allowed resize-none shadow-sm h-20"
               placeholder="Explique o motivo de estar alterando o registro original..."
             />
          </div>

        </div>

        {/* FOOTER PREMIUM */}
        <div className="px-6 sm:px-8 py-5 bg-surface-hover/30 border-t border-border/60 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
          <Button type="button" variant="ghost" onClick={onCancel} className="w-full sm:w-auto font-bold" disabled={isLocked}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            isLoading={isLocked} 
            className="w-full sm:w-auto px-10 shadow-button hover:shadow-float-primary font-black uppercase tracking-tight" 
            icon={!isLocked ? <Save className="w-4 h-4" /> : undefined}
          >
            Gravar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}