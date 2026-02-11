import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import { 
  Trash2, Plus, AlertTriangle, Wrench, Truck, Gauge, 
  Calendar, DollarSign, Check, Image as ImageIcon, Loader2 
} from 'lucide-react';

// --- DESIGN SYSTEM ---
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';

// --- UTILS ---
import { parseDecimal, formatKmVisual } from '../../utils';
import type { Veiculo, Produto, Fornecedor } from '../../types';

const ALVOS_MANUTENCAO = ['VEICULO', 'OUTROS'] as const;
type TipoManutencao = 'CORRETIVA' | 'PREVENTIVA';

// --- FUNÇÃO DE COMPRESSÃO ---
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
const manutencaoSchema = z.object({
  tipo: z.enum(["PREVENTIVA", "CORRETIVA"]),
  alvo: z.enum(ALVOS_MANUTENCAO),
  
  veiculoId: z.string().nullish(),
  kmAtual: z.string().nullish(),
  numeroCA: z.string().nullish(),

  fornecedorId: z.string().min(1, "Obrigatório"),
  data: z.string().min(1, "Data inválida"),
  observacoes: z.string().nullish(),
  fotoComprovanteUrl: z.string().nullish(),

  itens: z.array(z.object({
    produtoId: z.string().min(1, "Selecione o item"),
    quantidade: z.coerce.number().min(0.01, "Qtd inválida"),
    valorPorUnidade: z.coerce.number().min(0, "Valor inválido"),
  })).min(1, "Adicione pelo menos um item")
}).superRefine((data, ctx) => {
  if (data.alvo === 'VEICULO' && !data.veiculoId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecione o veículo", path: ["veiculoId"] });
  }
  if (data.alvo === 'OUTROS' && !data.numeroCA) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe o nº do CA", path: ["numeroCA"] });
  }
});

type ManutencaoFormInput = z.input<typeof manutencaoSchema>;
type ManutencaoFormOutput = z.output<typeof manutencaoSchema>;

interface FormEditarManutencaoProps {
  osParaEditar: any;
  veiculos: Veiculo[];
  produtos: Produto[];
  fornecedores: Fornecedor[];
  onSuccess: () => void;
  onClose: () => void;
}

export function FormEditarManutencao({
  osParaEditar, veiculos, produtos, fornecedores, onSuccess, onClose
}: FormEditarManutencaoProps) {

  const caMatch = osParaEditar.observacoes?.match(/\[CA: (.+?)\]/);
  const caExistente = caMatch ? caMatch[1] : '';
  const obsLimpa = osParaEditar.observacoes?.replace(/\[CA: .+?\] /, '') || '';

  const [abaAtiva, setAbaAtiva] = useState<TipoManutencao>(osParaEditar.tipo || 'CORRETIVA');
  const [uploading, setUploading] = useState(false);
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);

  const {
    register, control, handleSubmit, watch, setValue,
    formState: { errors, isSubmitting }
  } = useForm<ManutencaoFormInput, any, ManutencaoFormOutput>({
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

  // Inicializa preview da foto
  useEffect(() => {
    if (osParaEditar.fotoComprovanteUrl) {
      setPreviewFoto(osParaEditar.fotoComprovanteUrl);
    }
  }, [osParaEditar]);

  const { fields, append, remove } = useFieldArray({ control, name: "itens" });

  const alvoSelecionado = watch('alvo');
  const fornecedorIdSelecionado = watch('fornecedorId');
  const itensWatch = useWatch({ control, name: 'itens' });

  // Sincroniza Aba
  useEffect(() => { setValue('tipo', abaAtiva); }, [abaAtiva, setValue]);

  // --- FILTROS ---
  const produtosManutencao = useMemo(() => {
    let lista = produtos.filter(p => !['COMBUSTIVEL', 'ADITIVO', 'LAVAGEM'].includes(p.tipo));
    
    if (fornecedorIdSelecionado) {
      const fornecedor = fornecedores.find(f => f.id === fornecedorIdSelecionado);
      if (fornecedor?.produtosOferecidos?.length) {
        const ids = fornecedor.produtosOferecidos.map(p => p.id);
        lista = lista.filter(p => ids.includes(p.id));
      }
    }
    return lista.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [produtos, fornecedorIdSelecionado, fornecedores]);

  const fornecedoresOpcoes = useMemo(() => 
    fornecedores
      .filter(f => abaAtiva === 'CORRETIVA' ? !['POSTO', 'LAVA_JATO'].includes(f.tipo) : true)
      .map(f => ({ value: f.id, label: f.nome })),
    [fornecedores, abaAtiva]
  );

  const veiculosOpcoes = useMemo(() => 
    veiculos.map(v => ({ value: v.id, label: v.placa })),
    [veiculos]
  );

  const produtosOpcoes = useMemo(() => 
    produtosManutencao.map(p => ({ value: p.id, label: p.nome })),
    [produtosManutencao]
  );

  // --- CÁLCULOS ---
  const totalGeral = (itensWatch || []).reduce((acc, item) =>
    acc + ((Number(item?.quantidade) || 0) * (Number(item?.valorPorUnidade) || 0)), 0
  );

  // --- UPLOAD HANDLER ---
  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    
    try {
      setUploading(true);
      const compressedFile = await comprimirImagem(file);
      
      const fileName = `manutencao-${Date.now()}-${Math.random().toString(36).substring(2,9)}.jpg`;
      const { data: uploadData, error } = await supabase.storage.from('fotos-frota').upload(`public/${fileName}`, compressedFile);
      
      if (error) throw error;
      
      const { data: publicUrl } = supabase.storage.from('fotos-frota').getPublicUrl(uploadData.path);
      
      setValue('fotoComprovanteUrl', publicUrl.publicUrl);
      setPreviewFoto(publicUrl.publicUrl);
      toast.success("Foto atualizada com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar foto.");
    } finally {
      setUploading(false);
    }
  };

  // --- SUBMIT ---
  const onSubmit = async (data: ManutencaoFormOutput) => {
    let obsFinal = data.observacoes || '';
    if (data.alvo === 'OUTROS' && data.numeroCA) {
      obsFinal = `[CA: ${data.numeroCA}] ${obsFinal}`;
    }

    const payload = {
      ...data,
      veiculoId: data.alvo === 'VEICULO' ? data.veiculoId : null,
      kmAtual: (data.alvo === 'VEICULO' && data.kmAtual) ? parseDecimal(data.kmAtual) : null,
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

  const isLocked = isSubmitting || uploading;

  // [CORREÇÃO]: Container limpo para o Modal
  return (
    <div className="flex flex-col h-full w-full bg-surface">
      
      {/* HEADER FIXO */}
      <div className="px-6 pt-6 pb-2 border-b border-border shrink-0">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-text-main">Editar Manutenção</h3>
            <p className="text-xs text-text-secondary">Ajuste os detalhes da Ordem de Serviço.</p>
          </div>
          <Badge variant={abaAtiva === 'PREVENTIVA' ? 'success' : 'warning'}>{abaAtiva}</Badge>
        </div>

        {/* TABS DE TIPO */}
        <div className="flex gap-2 mb-2">
          {['CORRETIVA', 'PREVENTIVA'].map(tipo => (
            <button
              key={tipo}
              type="button"
              onClick={() => setAbaAtiva(tipo as TipoManutencao)}
              disabled={isLocked}
              className={`
                flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all
                ${abaAtiva === tipo 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'bg-surface-hover text-text-secondary hover:bg-surface-hover/80'}
              `}
            >
              {tipo}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
        {/* MIOLO ROLÁVEL */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">

          {/* 1. SELEÇÃO DE ALVO */}
          <div className="flex gap-4">
            {ALVOS_MANUTENCAO.map(alvo => (
              <label key={alvo} className={`flex items-center gap-2 cursor-pointer p-3 border rounded-xl w-full transition-all ${alvoSelecionado === alvo ? 'border-primary bg-primary/5' : 'border-border hover:bg-surface-hover'}`}>
                <input
                  type="radio"
                  value={alvo}
                  {...register('alvo')}
                  className="accent-primary w-4 h-4"
                  disabled={isLocked}
                />
                <span className="text-sm font-bold text-text-main">
                  {alvo === 'VEICULO' ? 'Veículo' : 'Outro Equipamento'}
                </span>
              </label>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-6">

            {/* --- COLUNA ESQUERDA: FOTO --- */}
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
                     <img src={previewFoto} alt="Nota Fiscal" className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <ImageIcon className="w-8 h-8 text-white" />
                        <span className="text-white text-xs font-bold bg-black/20 px-2 py-1 rounded">Trocar Foto</span>
                     </div>
                   </>
                 ) : (
                   <div className="text-center text-text-muted p-4">
                     <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                     <p className="text-xs">Clique para adicionar<br/>comprovante</p>
                   </div>
                 )}
                 
                 <input 
                   type="file" 
                   accept="image/*" 
                   className="absolute inset-0 opacity-0 cursor-pointer z-10"
                   onChange={handleFotoChange}
                   disabled={isLocked}
                 />
               </div>
            </div>

            {/* --- COLUNA DIREITA: DADOS --- */}
            <div className="w-full md:w-2/3 grid grid-cols-1 gap-4 content-start">
              {alvoSelecionado === 'VEICULO' ? (
                <>
                  <Select
                    label="Veículo"
                    options={veiculosOpcoes}
                    icon={<Truck className="w-4 h-4"/>}
                    {...register("veiculoId")}
                    error={errors.veiculoId?.message}
                    disabled={isLocked}
                  />
                  <Input
                    label="KM no Momento"
                    icon={<Gauge className="w-4 h-4"/>}
                    {...register("kmAtual")}
                    onChange={(e) => setValue("kmAtual", formatKmVisual(e.target.value))}
                    error={errors.kmAtual?.message}
                    disabled={isLocked}
                  />
                </>
              ) : (
                <div className="md:col-span-2">
                  <Input
                    label="Identificação (CA/Série)"
                    {...register("numeroCA")}
                    error={errors.numeroCA?.message}
                    disabled={isLocked}
                  />
                </div>
              )}

              <Select
                label="Fornecedor"
                options={fornecedoresOpcoes}
                icon={<Wrench className="w-4 h-4"/>}
                {...register("fornecedorId")}
                error={errors.fornecedorId?.message}
                disabled={isLocked}
              />

              <Input
                label="Data do Serviço"
                type="date"
                icon={<Calendar className="w-4 h-4"/>}
                {...register("data")}
                error={errors.data?.message}
                disabled={isLocked}
              />
            </div>
          </div>

          {/* 3. ITENS E SERVIÇOS */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Itens da OS</h4>
              {fornecedorIdSelecionado && produtosManutencao.length < produtos.filter(p => !['COMBUSTIVEL', 'ADITIVO', 'LAVAGEM'].includes(p.tipo)).length && (
                <div className="text-[10px] text-info bg-info/10 px-2 py-1 rounded flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Filtro Ativo
                </div>
              )}
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="bg-surface-hover/30 p-3 rounded-xl border border-border relative group hover:border-primary/20 transition-colors">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={isLocked}
                    className="absolute -top-2 -right-2 bg-surface border border-border text-text-muted hover:text-error p-1 rounded-full shadow-sm z-10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 sm:col-span-6">
                      <Select
                        label="Item"
                        options={produtosOpcoes}
                        {...register(`itens.${index}.produtoId`)}
                        className="bg-surface h-9 text-xs"
                        disabled={isLocked}
                        containerClassName="!mb-0"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <Input
                        label="Qtd"
                        type="number"
                        step="0.1"
                        {...register(`itens.${index}.quantidade`)}
                        className="bg-surface h-9 text-xs text-center"
                        disabled={isLocked}
                        containerClassName="!mb-0"
                      />
                    </div>
                    <div className="col-span-8 sm:col-span-4">
                      <Input
                        label="Valor Unit"
                        type="number"
                        step="0.01"
                        icon={<DollarSign className="w-3 h-3 text-text-muted"/>}
                        {...register(`itens.${index}.valorPorUnidade`)}
                        className="bg-surface h-9 text-xs text-right font-bold"
                        disabled={isLocked}
                        containerClassName="!mb-0"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={() => append({ produtoId: '', quantidade: 1, valorPorUnidade: 0 })}
              className="w-full border-dashed border border-border text-xs text-primary hover:bg-primary/5"
              disabled={isLocked}
            >
              <Plus className="w-3 h-3 mr-1" /> Adicionar Item
            </Button>
            
            {errors.itens && <p className="text-xs text-error text-right">{errors.itens.root?.message}</p>}
          </div>

          {/* 4. OBSERVAÇÕES */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 ml-1">
              Observações
            </label>
            <textarea
              {...register("observacoes")}
              className="w-full px-4 py-3 text-sm bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none min-h-[80px] transition-all"
              placeholder="Detalhes adicionais..."
              disabled={isLocked}
            />
          </div>

        </div>

        {/* FOOTER FIXO */}
        <div className="px-6 py-4 border-t border-border bg-surface-hover/30 flex gap-3 justify-between items-center shrink-0">
          <div className="text-left">
            <span className="text-[10px] text-text-muted font-bold uppercase block">Total</span>
            <span className="text-xl font-mono font-black text-text-main">
              {totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLocked}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isLocked} disabled={isLocked} icon={<Check className="w-4 h-4"/>}>
              Salvar
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}