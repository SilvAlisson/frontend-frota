import { useEffect, useState, useMemo } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { uploadToR2 } from '../../services/uploadService';
import { toast } from 'sonner';
import { hapticError } from '../../lib/haptics';
import {
  Save, Plus, X, User as UserIcon, Truck,
  MapPin, Calendar, CreditCard, Image as ImageIcon, Loader2
} from 'lucide-react';

// --- DESIGN SYSTEM ---
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { ModalConfirmarAnomalia } from '../ui/ModalConfirmarAnomalia';
import type { Abastecimento } from '../../types';

// --- HOOKS ATÔMICOS ---
import { useVeiculos } from '../../hooks/useVeiculos';
import { useUsuarios } from '../../hooks/useUsuarios';
import { useProdutos } from '../../hooks/useProdutos';
import { useFornecedores } from '../../hooks/useFornecedores';
import { desformatarDinheiro, formatarDinheiro } from '../../lib/formatters';
import { formatKmVisual } from '../../utils';
import { validarAbastecimento, temBloqueio, type AnomaliaAbastecimento } from '../../utils/validateAbastecimento';
import { comprimirImagem } from '../../utils/imageCompressor';

// --- SCHEMA ZOD V4 COMPATÍVEL ---
const itemSchema = z.object({
  produtoId: z.string().min(1, "Selecione o produto"),
  quantidade: z.union([z.string(), z.number()]).transform(v => Number(v)).refine(v => !isNaN(v) && v > 0, "Inválido"),
  valorPorUnidade: z.union([z.string(), z.number()]).transform(v => typeof v === 'string' ? desformatarDinheiro(v) : Number(v)).refine(v => !isNaN(v) && v >= 0, "Valor inválido"),
});

const editSchema = z.object({
  veiculoId: z.string().min(1, "Veículo obrigatório"),
  operadorId: z.string().optional(),
  fornecedorId: z.string().min(1, "Fornecedor obrigatório"),
  kmOdometro: z.union([z.string(), z.number()]).transform(v => {
    if (typeof v === 'string') {
      const num = Number(v.replace(/\./g, '').replace(',', '.'));
      return isNaN(num) ? 0 : num;
    }
    return v;
  }).refine(v => !isNaN(v) && v >= 1, "Inválido"),
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
  const [anomalias, setAnomalias] = useState<AnomaliaAbastecimento[]>([]);
  const [dadosPendentes, setDadosPendentes] = useState<EditFormOutput | null>(null);

  // 📡 DADOS GLOBAIS COM CACHE
  const { usuarios = [] } = useUsuarios();
  const { data: veiculos = [] } = useVeiculos();
  const { produtos = [] } = useProdutos();
  const { fornecedores = [] } = useFornecedores();

  // 1. Query Específica do Abastecimento
  const { data: abastecimento, isLoading: loadingAbs } = useQuery<Abastecimento>({
    queryKey: ['abastecimento', abastecimentoId],
    queryFn: async () => (await api.get(`/abastecimentos/${abastecimentoId}`)).data,
    retry: 1
  });

  const isLoadingDados = loadingAbs;

  // Filtros de Selects
  const produtosCombustivel = useMemo(() => produtos.filter(p => ['COMBUSTIVEL', 'ADITIVO'].includes(p.tipo)), [produtos]);
  const fornecedoresPosto = useMemo(() => fornecedores.filter(f => f.tipo === 'POSTO'), [fornecedores]);
  const motoristas = useMemo(() => usuarios.filter(u => ['OPERADOR', 'ENCARREGADO'].includes(u.role)), [usuarios]);

  const veiculosOptions = useMemo(() => veiculos.map(v => ({ value: v.id, label: `${v.placa} - ${v.modelo}` })), [veiculos]);
  const motoristasOptions = useMemo(() => motoristas.map(u => ({ value: u.id, label: u.nome })), [motoristas]);
  const fornecedoresOptions = useMemo(() => fornecedoresPosto.map(f => ({ value: f.id, label: f.nome })), [fornecedoresPosto]);
  const produtosOptions = useMemo(() => produtosCombustivel.map(p => ({ value: p.id, label: p.nome })), [produtosCombustivel]);

  // 2. Form Setup
  const { register, control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<EditFormInput, unknown, EditFormOutput>({
    resolver: zodResolver(editSchema),
    mode: 'onBlur'
  });

  const { fields, append, remove } = useFieldArray({ control, name: "itens" });
  const itensWatch = useWatch({ control, name: "itens" });

  const totalGeral = useMemo(() => {
    return (itensWatch || []).reduce((acc, item) => {
      const qtd = Number(item?.quantidade || 0);
      const unit = typeof item?.valorPorUnidade === 'string' ? desformatarDinheiro(item.valorPorUnidade) : Number(item?.valorPorUnidade || 0);
      return acc + (qtd * unit);
    }, 0);
  }, [itensWatch]);

  const totalGeralFormatado = totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // 3. Populate Form (Garantindo formatação de dinheiro)
  useEffect(() => {
    if (abastecimento) {
      reset({
        veiculoId: abastecimento.veiculoId ?? '',
        operadorId: abastecimento.operador?.id ?? usuarios.find(u => u.nome === abastecimento.operador?.nome)?.id ?? '',
        fornecedorId: abastecimento.fornecedorId ?? fornecedores.find(f => f.nome === abastecimento.fornecedor?.nome)?.id ?? '',
        kmOdometro: abastecimento.kmOdometro ? formatKmVisual(String(abastecimento.kmOdometro)) : '',
        dataHora: new Date(new Date(abastecimento.dataHora).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
        placaCartaoUsado: abastecimento.placaCartaoUsado ?? '',
        justificativa: abastecimento.justificativa ?? '',
        fotoNotaFiscalUrl: abastecimento.fotoNotaFiscalUrl ?? null,
        itens: (abastecimento.itens ?? []).map(i => ({
          produtoId: i.produto?.id ?? '',
          quantidade: i.quantidade,
          valorPorUnidade: Number(i.valorPorUnidade || 0).toFixed(2).replace('.', ',')
        }))
      });
      if (abastecimento.fotoNotaFiscalUrl) setPreviewFoto(abastecimento.fotoNotaFiscalUrl);
    }
  }, [abastecimento, usuarios, fornecedores, reset]);

  // 4. Upload System
  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    try {
      setUploading(true);
      const compressedFile = await comprimirImagem(file);
      const fileName = `abastecimento-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;
      const publicUrlString = await uploadToR2(compressedFile, fileName, compressedFile.type || 'image/jpeg');

      setValue('fotoNotaFiscalUrl', publicUrlString);
      setPreviewFoto(publicUrlString);
      toast.success("Foto atualizada!");
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
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
          valorPorUnidade: Number(i.valorPorUnidade)
        }))
      });
    },
    onSuccess: () => {
      toast.success("Abastecimento atualizado!");
      queryClient.invalidateQueries({ queryKey: ['abastecimentos'] });
      queryClient.invalidateQueries({ queryKey: ['abastecimento', abastecimentoId] });
      onSuccess();
    },
    onError: (err: unknown) => {
      const apiError = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(apiError || "Erro ao salvar alterações.");
    }
  });

  const isLocked = isSubmitting || uploading || updateMutation.isPending;

  // Interceptor de submit com validação de anomalias
  const handleValidacaoESubmit = (data: EditFormOutput) => {
    const itensNumericos = data.itens.map((i) => ({
      quantidade: Number(i.quantidade),
      valorPorUnidade: Number(i.valorPorUnidade),
    }));
    const anomaliasDetectadas = validarAbastecimento(itensNumericos, totalGeral);

    if (anomaliasDetectadas.length === 0) {
      updateMutation.mutate(data);
    } else {
      setAnomalias(anomaliasDetectadas);
      setDadosPendentes(data);
    }
  };

  if (isLoadingDados) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center space-y-4 animate-in fade-in">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-bold text-text-secondary uppercase tracking-widest animate-pulse">Sincronizando Banco de Dados...</p>
      </div>
    );
  }

  return (
    // 🔥 CASCA DUPLA REMOVIDA: Sem bordas duras, sem max-h restrito, pronto para fluir dentro do Modal pai
    <div className="flex flex-col w-full animate-in fade-in duration-300">

      <ModalConfirmarAnomalia
        anomalias={anomalias}
        custoTotalFormatado={totalGeralFormatado}
        isLoading={updateMutation.isPending}
        onConfirmar={() => {
          if (dadosPendentes && !temBloqueio(anomalias)) {
            updateMutation.mutate(dadosPendentes);
            setAnomalias([]);
            setDadosPendentes(null);
          }
        }}
        onCorrigir={() => {
          setAnomalias([]);
          setDadosPendentes(null);
        }}
      />

      <form onSubmit={handleSubmit(handleValidacaoESubmit, () => hapticError())} className="flex flex-col w-full">

        <div className="flex flex-col lg:flex-row gap-8 pb-6">

          {/* FOTO E RECIBO */}
          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2 mt-2">
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
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm pointer-events-none">
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
            <div className="flex items-center gap-2 border-b border-border/50 pb-2 mt-2">
              <span className="w-1.5 h-4 bg-amber-500 rounded-full shadow-sm"></span>
              <label className="text-[10px] font-black text-amber-600 tracking-[0.2em] uppercase">Informações Operacionais</label>
            </div>

            {/* ✨ MÁGICA DO GRID AQUI: 12 Colunas fluidas evitando o empilhamento */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

              <div className="md:col-span-6">
                <Select label="Veículo Oficial" options={veiculosOptions} icon={<Truck className="w-4 h-4" />} {...register('veiculoId')} error={errors.veiculoId?.message} disabled={isLocked} />
              </div>

              <div className="md:col-span-6">
                <Select label="Operador / Motorista" options={motoristasOptions} icon={<UserIcon className="w-4 h-4" />} {...register('operadorId')} disabled={isLocked} />
              </div>

              <div className="md:col-span-12">
                <Select label="Posto Fornecedor" options={fornecedoresOptions} icon={<MapPin className="w-4 h-4" />} {...register('fornecedorId')} error={errors.fornecedorId?.message} disabled={isLocked} />
              </div>

              <div className="md:col-span-4">
                <Input label="Hodômetro Atual" type="tel" inputMode="numeric" {...register('kmOdometro', { onChange: (e) => { setValue('kmOdometro', formatKmVisual(e.target.value)); } })} error={errors.kmOdometro?.message as string} disabled={isLocked} className="font-mono font-bold text-lg text-primary" />
              </div>

              <div className="md:col-span-4">
                <Input label="Cartão da Frota" maxLength={4} placeholder="Ex: 1234" icon={<CreditCard className="w-4 h-4" />} {...register('placaCartaoUsado')} disabled={isLocked} className="font-mono text-center tracking-widest font-black" />
              </div>

              <div className="md:col-span-4">
                <Input label="Data / Hora Exata" type="datetime-local" icon={<Calendar className="w-4 h-4" />} {...register('dataHora')} error={errors.dataHora?.message} disabled={isLocked} />
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
              <span className="font-mono font-black text-primary text-lg">{totalGeralFormatado}</span>
            </div>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-surface-hover/20 p-5 rounded-2xl border border-border/60 shadow-sm relative group hover:border-primary/40 transition-colors duration-300">
                <Button type="button" variant="danger" size="icon" onClick={() => remove(index)} disabled={isLocked} className="absolute -top-3 -right-3 rounded-full w-8 h-8 shadow-md z-10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                  <X className="w-4 h-4" />
                </Button>

                <div className="md:col-span-6">
                  <Select label="Produto" options={produtosOptions} {...register(`itens.${index}.produtoId`)} error={errors.itens?.[index]?.produtoId?.message} disabled={isLocked} containerClassName="!mb-0" />
                </div>

                <div className="md:col-span-3">
                  <Input label="Litros / Qtd" type="number" step="any" inputMode="decimal" {...register(`itens.${index}.quantidade`)} error={errors.itens?.[index]?.quantidade?.message as string} className="text-center font-mono font-bold" containerClassName="!mb-0" disabled={isLocked} />
                </div>

                <div className="md:col-span-3">
                  <Input
                    label="Preço Un."
                    type="tel"
                    inputMode="numeric"
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

        <div className="pt-4 mt-6 border-t border-border/50">
          <Textarea
            label="Motivo da Edição (Auditoria)"
            {...register('justificativa')}
            disabled={isLocked}
            rows={3}
            placeholder="Explique o motivo de estar alterando o registro original..."
            autoResize={false}
          />
        </div>

        {/* FOOTER PREMIUM */}
        <div className="pt-5 mt-6 border-t border-border/60 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
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
