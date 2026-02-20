import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import { 
  Trash2, Plus, AlertTriangle, Wrench, Truck, Gauge, 
  Calendar, Check, Image as ImageIcon, Loader2, Info
} from 'lucide-react';

// --- DESIGN SYSTEM ---
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';

// --- HOOKS ATÔMICOS ---
import { useVeiculos } from '../../hooks/useVeiculos';
import { useProdutos } from '../../hooks/useProdutos';
import { useFornecedores } from '../../hooks/useFornecedores';

// --- UTILS ---
import { parseDecimal, formatKmVisual } from '../../utils';
import { desformatarDinheiro, formatarDinheiro } from '../../lib/formatters';

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

// --- SCHEMA ZOD V4 COMPATÍVEL ---
const manutencaoSchema = z.object({
  tipo: z.enum(["PREVENTIVA", "CORRETIVA"]),
  alvo: z.enum(ALVOS_MANUTENCAO),
  
  veiculoId: z.string().optional().nullable(),
  kmAtual: z.string().optional().nullable(),
  numeroCA: z.string().optional().nullable(),

  fornecedorId: z.string().min(1, "Obrigatório"),
  data: z.string().min(1, "Data inválida"),
  observacoes: z.string().optional().nullable(),
  fotoComprovanteUrl: z.string().optional().nullable(),

  itens: z.array(z.object({
    produtoId: z.string().min(1, "Selecione o item"),
    quantidade: z.union([z.string(), z.number()]).transform(v => Number(v)).refine(v => !isNaN(v) && v > 0, "Qtd inválida"),
    valorPorUnidade: z.union([z.string(), z.number()]).transform(v => typeof v === 'string' ? desformatarDinheiro(v) : Number(v)).refine(v => !isNaN(v) && v >= 0, "Valor inválido")
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
  onSuccess: () => void;
  onClose: () => void;
}

export function FormEditarManutencao({
  osParaEditar, onSuccess, onClose
}: FormEditarManutencaoProps) {

  // 📡 BUSCA INDEPENDENTE COM CACHE
  const { data: veiculos = [], isLoading: loadV } = useVeiculos();
  const { data: produtos = [], isLoading: loadP } = useProdutos();
  const { data: fornecedores = [], isLoading: loadF } = useFornecedores();

  const isLoadingDados = loadV || loadP || loadF;

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
      // Correção de timezone
      data: new Date(new Date(osParaEditar.data).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
      observacoes: obsLimpa,
      fotoComprovanteUrl: osParaEditar.fotoComprovanteUrl,
      itens: osParaEditar.itens.map((i: any) => ({
        produtoId: i.produtoId,
        quantidade: Number(i.quantidade),
        // Transforma para string visual caso necessite edição
        valorPorUnidade: Number(i.valorPorUnidade).toFixed(2).replace('.', ',')
      }))
    },
    mode: 'onBlur'
  });

  useEffect(() => {
    if (osParaEditar.fotoComprovanteUrl) {
      setPreviewFoto(osParaEditar.fotoComprovanteUrl);
    }
  }, [osParaEditar]);

  const { fields, append, remove } = useFieldArray({ control, name: "itens" });

  const alvoSelecionado = watch('alvo');
  const fornecedorIdSelecionado = watch('fornecedorId');
  const itensWatch = useWatch({ control, name: 'itens' });

  useEffect(() => { setValue('tipo', abaAtiva); }, [abaAtiva, setValue]);

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

  // Transformação para o formato do Select Inteligente
  const fornecedoresOpcoes = useMemo(() => 
    fornecedores
      .filter(f => abaAtiva === 'CORRETIVA' ? !['POSTO', 'LAVA_JATO'].includes(f.tipo) : true)
      .map(f => ({ value: f.id, label: f.nome })),
    [fornecedores, abaAtiva]
  );

  const veiculosOpcoes = useMemo(() => 
    veiculos.map(v => ({ value: v.id, label: `${v.placa} - ${v.modelo}` })),
    [veiculos]
  );

  const produtosOpcoes = useMemo(() => 
    produtosManutencao.map(p => ({ value: p.id, label: p.nome })),
    [produtosManutencao]
  );

  const totalGeral = useMemo(() => {
    return (itensWatch || []).reduce((acc, item) => {
        const qtd = Number(item?.quantidade || 0);
        const unit = typeof item?.valorPorUnidade === 'string' ? desformatarDinheiro(item.valorPorUnidade) : Number(item?.valorPorUnidade || 0);
        return acc + (qtd * unit);
    }, 0);
  }, [itensWatch]);

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
      data: new Date(data.data + 'T12:00:00').toISOString(), 
      itens: data.itens.map(i => ({
          produtoId: i.produtoId,
          quantidade: i.quantidade,
          valorPorUnidade: i.valorPorUnidade
      }))
    };

    try {
      await api.put(`/manutencoes/${osParaEditar.id}`, payload);
      toast.success("Ordem de Serviço atualizada!");
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar registro.");
    }
  };

  const isLocked = isSubmitting || uploading || isLoadingDados;

  if (isLoadingDados) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4 text-primary/60 animate-in fade-in">
         <Loader2 className="w-10 h-10 animate-spin" />
         <span className="text-sm font-bold uppercase tracking-widest animate-pulse">Sincronizando Banco de Dados...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-surface rounded-2xl shadow-float border border-border/60 overflow-hidden max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
      
      {/* HEADER PREMIUM */}
      <div className="bg-gradient-to-r from-background to-surface-hover/30 px-6 sm:px-8 py-5 border-b border-border/60 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shrink-0">
        <div className="flex items-center gap-3">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary shadow-sm">
                <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-text-main tracking-tight">Editar Manutenção</h3>
              <p className="text-sm text-text-secondary font-medium mt-0.5">Ajuste os detalhes da Ordem de Serviço.</p>
            </div>
        </div>
        <Badge variant={abaAtiva === 'PREVENTIVA' ? 'success' : 'danger'} className="text-sm py-1.5 px-3 self-start sm:self-auto">
            {abaAtiva}
        </Badge>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden min-h-0">
        
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-8 custom-scrollbar">

          {/* TABS DE TIPO */}
          <div className="flex gap-3 bg-surface-hover/30 p-1.5 rounded-xl border border-border/60 shadow-inner">
            {['CORRETIVA', 'PREVENTIVA'].map(tipo => (
              <button
                key={tipo}
                type="button"
                onClick={() => setAbaAtiva(tipo as TipoManutencao)}
                disabled={isLocked}
                className={`
                  flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all duration-300
                  ${abaAtiva === tipo 
                    ? (tipo === 'CORRETIVA' ? 'bg-error text-white shadow-md' : 'bg-success text-white shadow-md')
                    : 'text-text-muted hover:text-text-main hover:bg-surface shadow-sm'}
                `}
              >
                {tipo}
              </button>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* --- COLUNA ESQUERDA: FOTO E ALVO --- */}
            <div className="w-full lg:w-1/3 flex flex-col gap-6">
               
               {/* 1. SELEÇÃO DE ALVO */}
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-primary tracking-[0.2em] uppercase flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-primary rounded-full shadow-sm"></span>
                      Alvo da OS
                  </label>
                  <div className="flex gap-3">
                    {ALVOS_MANUTENCAO.map(alvo => (
                      <label key={alvo} className={`flex items-center justify-center gap-2 cursor-pointer p-3 border-2 rounded-xl w-full transition-all ${alvoSelecionado === alvo ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/60 hover:border-primary/40 bg-surface'}`}>
                        <input
                          type="radio"
                          value={alvo}
                          {...register('alvo')}
                          className="accent-primary w-4 h-4 hidden"
                          disabled={isLocked}
                        />
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${alvoSelecionado === alvo ? 'border-primary' : 'border-text-muted/40'}`}>
                            {alvoSelecionado === alvo && <div className="w-2 h-2 bg-primary rounded-full" />}
                        </div>
                        <span className={`text-xs font-black uppercase tracking-wider ${alvoSelecionado === alvo ? 'text-primary' : 'text-text-secondary'}`}>
                          {alvo === 'VEICULO' ? 'Veículo' : 'Equipamento'}
                        </span>
                      </label>
                    ))}
                  </div>
               </div>

               {/* UPLOAD FOTO */}
               <div className="space-y-2 flex-1">
                  <label className="text-[10px] font-black text-text-secondary tracking-[0.2em] uppercase ml-1">
                      Comprovante (NF/OS)
                  </label>
                  <div className="relative h-full min-h-[250px] bg-surface-hover/30 rounded-2xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center overflow-hidden group hover:border-primary/50 transition-colors cursor-pointer shadow-sm">
                    {uploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <span className="text-xs font-bold text-text-muted uppercase tracking-widest">A Processar...</span>
                      </div>
                    ) : previewFoto ? (
                      <>
                        <img src={previewFoto} alt="Nota Fiscal" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                          <ImageIcon className="w-8 h-8 text-white" />
                          <span className="text-white text-[10px] font-black bg-white/20 px-3 py-1.5 rounded-lg uppercase tracking-widest backdrop-blur-md">Trocar Imagem</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-text-muted p-4 opacity-60 group-hover:opacity-100 transition-opacity">
                        <ImageIcon className="w-12 h-12 mx-auto mb-3" />
                        <p className="text-xs font-bold uppercase tracking-widest">Anexar Comprovante</p>
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
            </div>

            {/* --- COLUNA DIREITA: DADOS TÉCNICOS --- */}
            <div className="w-full lg:w-2/3 space-y-6">
              
              <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                  <span className="w-1.5 h-4 bg-amber-500 rounded-full shadow-sm"></span>
                  <label className="text-[10px] font-black text-amber-600 tracking-[0.2em] uppercase">Dados Operacionais</label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {alvoSelecionado === 'VEICULO' ? (
                  <>
                    <Select
                      label="Veículo Oficial"
                      options={veiculosOpcoes}
                      icon={<Truck className="w-4 h-4"/>}
                      {...register("veiculoId")}
                      error={errors.veiculoId?.message}
                      disabled={isLocked}
                    />
                    <Input
                      label="Odômetro Registado"
                      icon={<Gauge className="w-4 h-4 text-primary"/>}
                      {...register("kmAtual")}
                      onChange={(e) => setValue("kmAtual", formatKmVisual(e.target.value))}
                      error={errors.kmAtual?.message}
                      disabled={isLocked}
                      className="font-mono font-bold text-primary"
                    />
                  </>
                ) : (
                  <div className="md:col-span-2">
                    <Input
                      label="Identificação (CA/Série do Equipamento)"
                      {...register("numeroCA")}
                      error={errors.numeroCA?.message}
                      disabled={isLocked}
                      className="font-bold"
                    />
                  </div>
                )}

                <Select
                  label="Oficina / Fornecedor"
                  options={fornecedoresOpcoes}
                  icon={<Wrench className="w-4 h-4"/>}
                  {...register("fornecedorId")}
                  error={errors.fornecedorId?.message}
                  disabled={isLocked}
                />

                <Input
                  label="Data do Faturamento"
                  type="date"
                  icon={<Calendar className="w-4 h-4"/>}
                  {...register("data")}
                  error={errors.data?.message}
                  disabled={isLocked}
                />
              </div>

              {/* 3. MATRIZ DE PEÇAS E SERVIÇOS */}
              <div className="pt-4 border-t border-border/50">
                <div className="flex justify-between items-end mb-4 px-1">
                  <div className="space-y-1">
                      <div className="flex items-center gap-2">
                          <span className="w-1.5 h-4 bg-sky-500 rounded-full shadow-sm"></span>
                          <label className="text-[10px] font-black text-sky-600 tracking-[0.2em] uppercase">Matriz de Custos</label>
                      </div>
                      {fornecedorIdSelecionado && produtosManutencao.length < produtos.filter(p => !['COMBUSTIVEL', 'ADITIVO', 'LAVAGEM'].includes(p.tipo)).length && (
                        <p className="text-[10px] text-sky-600/80 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Filtro de Fornecedor Ativo
                        </p>
                      )}
                  </div>
                  <div className="bg-surface border border-border/60 px-4 py-2 rounded-xl shadow-sm flex items-center gap-3">
                      <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Total OS:</span>
                      <span className="font-mono font-black text-primary text-lg">
                        {totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="bg-surface-hover/20 p-5 rounded-2xl border border-border/60 relative group hover:border-primary/40 transition-colors shadow-sm">
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          disabled={isLocked}
                          className="absolute -top-3 -right-3 bg-surface border border-border/60 text-text-muted hover:text-white hover:bg-error w-8 h-8 rounded-full shadow-md z-10 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-6">
                          <Select
                            label="Peça / Serviço"
                            options={produtosOpcoes}
                            {...register(`itens.${index}.produtoId` as const)}
                            disabled={isLocked}
                            error={errors.itens?.[index]?.produtoId?.message}
                            containerClassName="!mb-0"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <Input
                            label="Qtd"
                            type="number"
                            step="any"
                            {...register(`itens.${index}.quantidade` as const)}
                            className="text-center font-mono font-bold"
                            disabled={isLocked}
                            error={errors.itens?.[index]?.quantidade?.message as string}
                            containerClassName="!mb-0"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <Input
                            label="R$ Unitário"
                            {...register(`itens.${index}.valorPorUnidade` as const, {
                                onChange: (e) => {
                                    e.target.value = formatarDinheiro(e.target.value);
                                    setValue(`itens.${index}.valorPorUnidade`, e.target.value);
                                }
                            })}
                            className="text-right font-mono font-black text-emerald-600"
                            disabled={isLocked}
                            error={errors.itens?.[index]?.valorPorUnidade?.message as string}
                            containerClassName="!mb-0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => append({ produtoId: '', quantidade: 1, valorPorUnidade: 0 })}
                  className="w-full mt-4 border-dashed font-bold shadow-sm"
                  disabled={isLocked}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Adicionar Item
                </Button>
                {errors.itens && <p className="text-[10px] text-error mt-2 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {errors.itens.root?.message}</p>}
              </div>

              {/* 4. OBSERVAÇÕES */}
              <div className="pt-2 space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-text-secondary uppercase tracking-wider ml-1">
                   <Info className="w-3.5 h-3.5" /> Parecer Técnico / Justificativa
                </label>
                <textarea
                  {...register("observacoes")}
                  className="w-full px-4 py-3 text-sm bg-surface border border-border/60 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none resize-none h-24 transition-all shadow-sm text-text-main placeholder:text-text-muted"
                  placeholder="Relatório do problema, peças substituídas ou motivo da edição..."
                  disabled={isLocked}
                />
              </div>

            </div>
          </div>
        </div>

        {/* FOOTER PREMIUM */}
        <div className="px-6 sm:px-8 py-5 bg-surface-hover/30 border-t border-border/60 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLocked} className="w-full sm:w-auto font-bold">
            Descartar Alterações
          </Button>
          <Button type="submit" isLoading={isLocked} disabled={isLocked} icon={<Check className="w-4 h-4"/>} className="w-full sm:w-auto px-10 shadow-button hover:shadow-float-primary font-black uppercase tracking-tight">
            Gravar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}