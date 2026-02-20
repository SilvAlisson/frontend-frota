import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import DOMPurify from 'dompurify';
import { toast } from 'sonner';
import { Briefcase, Save, X, GraduationCap, Info, AlertTriangle, Clock } from 'lucide-react';

// --- COMPONENTES DO DESIGN SYSTEM ---
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// --- SCHEMA ZOD V4 COMPATÍVEL ---
// Usamos a união string/number no input para evitar o erro de "unknown" do Zod v4,
// mas garantimos que a saída (output) seja sempre um número processado.
const cargoSchema = z.object({
  nome: z.string().min(3, "Nome do cargo muito curto"),
  descricao: z.string().optional(),
  requisitos: z.array(
    z.object({
      nome: z.string().min(2, "Obrigatório"),
      validadeMeses: z.union([z.string(), z.number()]).transform(v => Number(v)).refine(v => !isNaN(v) && v >= 0, "Mínimo 0"),
      diasAntecedenciaAlerta: z.union([z.string(), z.number()]).transform(v => Number(v)).refine(v => !isNaN(v) && v >= 1, "Mínimo 1")
    })
  )
});

// Separamos o que entra (Input) do que sai do Zod (Output)
type CargoFormInput = z.input<typeof cargoSchema>;
type CargoFormOutput = z.output<typeof cargoSchema>;

interface FormProps {
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormCadastrarCargo({ onSuccess, onCancelar }: FormProps) {
  // Passamos as 3 tipagens para o useForm para o Resolver trabalhar em paz
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CargoFormInput, any, CargoFormOutput>({
    resolver: zodResolver(cargoSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      requisitos: [{ nome: '', validadeMeses: 12, diasAntecedenciaAlerta: 30 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "requisitos"
  });

  // Monitoriza os valores para os badges informativos em tempo real
  const requisitosWatch = useWatch({ control, name: 'requisitos' });

  // onSubmit recebe o Output (dados já limpos e convertidos para números pelo Zod)
  const onSubmit = async (data: CargoFormOutput) => {
    try {
        const payload = {
            ...data,
            nome: DOMPurify.sanitize(data.nome).toUpperCase(),
            descricao: data.descricao ? DOMPurify.sanitize(data.descricao) : '',
            requisitos: data.requisitos.map(r => ({
                ...r,
                nome: DOMPurify.sanitize(r.nome)
            }))
        };

        const promise = api.post('/cargos', payload);

        toast.promise(promise, {
            loading: 'Estruturando novo cargo...',
            success: () => {
                setTimeout(onSuccess, 500);
                return 'Cargo e Matriz de Treinamento registados!';
            },
            error: (err: any) => err.response?.data?.error || 'Erro ao salvar cargo.'
        });
    } catch (e) {
        console.error(e);
        toast.error("Erro inesperado ao salvar cargo.");
    }
  };

  return (
    <div className="bg-surface rounded-2xl shadow-float border border-border/60 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">

      {/* HEADER ESTILIZADO */}
      <div className="bg-gradient-to-r from-background to-surface-hover/30 px-6 sm:px-8 py-6 border-b border-border/60 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner text-primary">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-text-main tracking-tight leading-none">Novo Cargo</h3>
            <p className="text-sm text-text-secondary font-medium mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Gestão de Matriz de Treinamento
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
        
        <div className="p-6 sm:p-8 space-y-10 overflow-y-auto custom-scrollbar">
          
          {/* SEÇÃO 1: IDENTIFICAÇÃO */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="w-8 h-[2px] bg-primary/30 rounded-full"></span>
              <label className="text-[10px] font-black text-primary tracking-[0.25em] uppercase">Informações Base</label>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <Input
                label="Título Profissional"
                {...register('nome')}
                placeholder="Ex: TÉCNICO DE OPERAÇÕES II"
                error={errors.nome?.message}
                className="uppercase font-black tracking-wide text-primary placeholder:font-normal placeholder:tracking-normal"
                autoFocus
                disabled={isSubmitting}
              />

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider ml-1">
                  <Info className="w-3.5 h-3.5 text-primary/60" />
                  Escopo da Função
                </label>
                <textarea
                  {...register('descricao')}
                  rows={3}
                  className="w-full px-4 py-3 text-sm text-text-main bg-surface border border-border/60 rounded-xl transition-all duration-300 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-text-muted disabled:bg-background/50 resize-none shadow-sm"
                  placeholder="Quais as principais responsabilidades deste colaborador?"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </section>

          {/* SEÇÃO 2: MATRIZ DE TREINAMENTO */}
          <section className="space-y-6 pt-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-8 h-[2px] bg-amber-500/30 rounded-full"></span>
                <label className="text-[10px] font-black text-amber-600 tracking-[0.25em] uppercase">Matriz de Qualificação</label>
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={() => append({ nome: '', validadeMeses: 12, diasAntecedenciaAlerta: 30 })}
                disabled={isSubmitting}
                className="h-9 px-4 text-xs font-black uppercase tracking-tighter shadow-sm border-amber-200 hover:bg-amber-50"
              >
                + Adicionar Requisito
              </Button>
            </div>

            <div className="grid gap-4">
              {fields.map((field, index) => (
                <div 
                  key={field.id} 
                  className="group relative bg-background/40 p-6 rounded-2xl border border-border/50 hover:border-primary/40 hover:bg-surface-hover/20 transition-all duration-300 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={isSubmitting}
                    className="absolute -top-2 -right-2 bg-white text-text-muted hover:text-white hover:bg-error rounded-full w-8 h-8 border border-border/60 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-6">
                      <Input
                        label="Curso / Certificação"
                        {...register(`requisitos.${index}.nome` as const)}
                        placeholder="Ex: NR-10 Segurança em Elétrica"
                        error={errors.requisitos?.[index]?.nome?.message}
                        disabled={isSubmitting}
                        className="font-bold text-text-main"
                      />
                    </div>

                    <div className="lg:col-span-3">
                      <Input
                        label="Reciclagem (Meses)"
                        type="number"
                        {...register(`requisitos.${index}.validadeMeses` as const)}
                        disabled={isSubmitting}
                        error={errors.requisitos?.[index]?.validadeMeses?.message}
                        className="text-center font-mono font-black"
                      />
                    </div>

                    <div className="lg:col-span-3">
                      <Input
                        label="Aviso Antecipado"
                        type="number"
                        {...register(`requisitos.${index}.diasAntecedenciaAlerta` as const)}
                        disabled={isSubmitting}
                        error={errors.requisitos?.[index]?.diasAntecedenciaAlerta?.message}
                        className="text-center font-mono font-black text-amber-600"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3 opacity-60">
                     <span className="flex items-center gap-1 text-[9px] font-black uppercase text-text-muted tracking-widest">
                        <Clock className="w-3 h-3" /> Ciclo de {requisitosWatch?.[index]?.validadeMeses || 0} Meses
                     </span>
                     <span className="flex items-center gap-1 text-[9px] font-black uppercase text-amber-600 tracking-widest">
                        <AlertTriangle className="w-3 h-3" /> Alerta com {requisitosWatch?.[index]?.diasAntecedenciaAlerta || 0} Dias
                     </span>
                  </div>
                </div>
              ))}

              {fields.length === 0 && (
                <div 
                  onClick={() => append({ nome: '', validadeMeses: 12, diasAntecedenciaAlerta: 30 })}
                  className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border/40 rounded-3xl bg-background/20 group cursor-pointer hover:border-primary/40 transition-all"
                >
                  <div className="p-5 bg-surface rounded-full mb-4 shadow-sm group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-10 h-10 text-text-muted/30 group-hover:text-primary/60" />
                  </div>
                  <p className="text-sm font-black text-text-secondary uppercase tracking-widest">Nenhuma qualificação exigida</p>
                  <p className="text-xs text-text-muted mt-2 font-medium">Clique para adicionar o primeiro treinamento à matriz</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* FOOTER PREMIUM */}
        <div className="px-6 sm:px-8 py-6 bg-surface-hover/30 border-t border-border/60 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancelar} 
            disabled={isSubmitting}
            className="font-bold"
          >
            Descartar
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            isLoading={isSubmitting} 
            icon={<Save className="w-4 h-4" />} 
            className="px-12 shadow-button hover:shadow-float-primary transition-all font-black uppercase tracking-tight"
          >
            Finalizar Cadastro
          </Button>
        </div>
      </form>
    </div>
  );
}