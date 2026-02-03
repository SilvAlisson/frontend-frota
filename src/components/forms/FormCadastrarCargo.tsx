import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import DOMPurify from 'dompurify';
import { toast } from 'sonner';
import { Briefcase, Save, Plus, X, AlertCircle } from 'lucide-react';

// --- COMPONENTES DO DESIGN SYSTEM ---
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// --- SCHEMA ZOD ---
const requisitoSchema = z.object({
  nome: z.string().min(2, "Nome do curso obrigatório"),
  validadeMeses: z.coerce.number().min(0, "Validade inválida"),
  diasAntecedenciaAlerta: z.coerce.number().min(1).default(30),
});

const cargoSchema = z.object({
  nome: z.string().min(3, "Nome do cargo muito curto").transform(val => val.trim().toUpperCase()),
  descricao: z.string().optional(),
  requisitos: z.array(requisitoSchema).optional(),
});

type CargoFormInput = z.input<typeof cargoSchema>;

interface FormProps {
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormCadastrarCargo({ onSuccess, onCancelar }: FormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CargoFormInput>({
    resolver: zodResolver(cargoSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      requisitos: [{ nome: '', validadeMeses: 12, diasAntecedenciaAlerta: 30 }]
    },
    mode: 'onBlur'
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "requisitos"
  });

  const onSubmit = async (data: CargoFormInput) => {
    const payload = {
      ...data,
      nome: DOMPurify.sanitize(data.nome),
      descricao: data.descricao ? DOMPurify.sanitize(data.descricao) : '',
    };

    const promise = api.post('/cargos', payload);

    toast.promise(promise, {
      loading: 'Salvando cargo...',
      success: () => {
        setTimeout(onSuccess, 500);
        return 'Cargo registrado com sucesso!';
      },
      error: (err) => {
        console.error(err);
        return err.response?.data?.error || 'Erro ao salvar. Verifique os dados.';
      }
    });
  };

  // Classes utilitárias baseadas no index.css (evitando hardcode)
  // Nota: Como não temos um componente Textarea na UI, replicamos o estilo do Input aqui usando as variáveis do tema
  const textareaClasses = `
    w-full px-4 py-2.5 text-sm 
    text-text-main bg-surface 
    border border-border rounded-xl 
    transition-all duration-200 outline-none 
    focus:border-primary focus:ring-2 focus:ring-primary/20 
    placeholder:text-text-muted 
    disabled:bg-background disabled:text-text-muted disabled:cursor-not-allowed resize-none
  `;

  const numberInputClasses = `
    w-full text-sm h-10 p-2 text-center 
    bg-surface rounded-lg border outline-none 
    focus:ring-2 transition-all disabled:bg-background
  `;

  return (
    <div className="bg-surface rounded-xl shadow-card border border-border overflow-hidden animate-enter flex flex-col max-h-[85vh]">

      {/* HEADER */}
      <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-lg font-bold text-text-main">Novo Cargo</h3>
          <p className="text-xs text-text-secondary">Defina funções e matriz de treinamento.</p>
        </div>
        <div className="p-2 bg-surface rounded-lg border border-border shadow-sm text-primary">
          <Briefcase className="w-5 h-5" />
        </div>
      </div>

      {/* CONTEÚDO COM SCROLL */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
        
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* DADOS BÁSICOS */}
          <div className="space-y-4">
            <Input
              label="Título do Cargo"
              {...register('nome')}
              placeholder="Ex: LÍDER DE LOGÍSTICA"
              error={errors.nome?.message}
              className="uppercase font-bold tracking-wide"
              autoFocus
              disabled={isSubmitting}
            />

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 ml-1">
                Descrição da Função
              </label>
              <textarea
                {...register('descricao')}
                rows={3}
                className={textareaClasses}
                placeholder="Descreva brevemente as responsabilidades e escopo..."
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* LISTA DE REQUISITOS (MATRIZ) */}
          <div className="border-t border-border pt-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest">Requisitos Obrigatórios</h4>
                <span className="bg-background text-text-secondary text-[10px] font-bold px-2 py-0.5 rounded-full border border-border">{fields.length}</span>
              </div>
              <button
                type="button"
                onClick={() => append({ nome: '', validadeMeses: 12, diasAntecedenciaAlerta: 30 })}
                disabled={isSubmitting}
                className="text-xs text-primary font-bold hover:underline bg-primary/10 px-3 py-1.5 rounded-lg transition-colors hover:bg-primary/20 disabled:opacity-50 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Adicionar Curso
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => {
                const errorNome = errors.requisitos?.[index]?.nome?.message;
                const errorValidade = errors.requisitos?.[index]?.validadeMeses?.message;
                const errorAlerta = errors.requisitos?.[index]?.diasAntecedenciaAlerta?.message;
                
                return (
                  <div key={field.id} className="bg-background p-3 rounded-xl border border-border relative group hover:border-primary/30 hover:shadow-float transition-all">
                    
                    {/* Botão Remover (Discreto) */}
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={isSubmitting}
                      className="absolute -top-2 -right-2 bg-surface text-text-muted hover:text-error rounded-full w-7 h-7 border border-border shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-error/10 z-10 disabled:hidden"
                      title="Remover item"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-12 gap-3 items-start">
                      {/* Nome do Curso */}
                      <div className="col-span-12 sm:col-span-6">
                        <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block pl-1">Nome do Treinamento</label>
                        <Input
                          {...register(`requisitos.${index}.nome`)}
                          placeholder="Ex: NR-35 Trabalho em Altura"
                          error={errorNome}
                          containerClassName="!mb-0"
                          className="bg-surface h-10 text-sm"
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* Validade */}
                      <div className="col-span-6 sm:col-span-3">
                        <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block text-center">Validade</label>
                        <div className="relative">
                          <input
                            type="number"
                            {...register(`requisitos.${index}.validadeMeses`)}
                            disabled={isSubmitting}
                            className={`${numberInputClasses} ${
                              errorValidade 
                              ? 'border-error/50 focus:border-error focus:ring-error/20' 
                              : 'border-border focus:border-primary focus:ring-primary/20'
                            }`}
                          />
                          <span className="absolute right-2 top-2.5 text-[9px] text-text-muted font-bold pointer-events-none uppercase">Meses</span>
                        </div>
                      </div>

                      {/* Alerta */}
                      <div className="col-span-6 sm:col-span-3">
                        <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block text-center">Alerta</label>
                        <div className="relative">
                           <input
                            type="number"
                            {...register(`requisitos.${index}.diasAntecedenciaAlerta`)}
                            disabled={isSubmitting}
                            className={`${numberInputClasses} ${
                              errorAlerta 
                              ? 'border-error/50 focus:border-error focus:ring-error/20' 
                              : 'border-border focus:border-primary focus:ring-primary/20'
                            }`}
                          />
                          <span className="absolute right-2 top-2.5 text-[9px] text-text-muted font-bold pointer-events-none uppercase">Dias</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Exibição de erros de número (Validade/Alerta) */}
                    {(errorValidade || errorAlerta) && (
                      <div className="mt-1 flex gap-2 justify-center">
                        {errorValidade && <p className="text-[10px] text-error flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Validade inválida</p>}
                        {errorAlerta && <p className="text-[10px] text-error flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Alerta inválido</p>}
                      </div>
                    )}
                  </div>
                );
              })}

              {fields.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-border rounded-xl bg-background/50">
                  <div className="p-3 bg-surface rounded-full mb-2">
                    <Briefcase className="w-6 h-6 text-text-muted opacity-50" />
                  </div>
                  <p className="text-xs text-text-secondary font-medium">Nenhum requisito obrigatório definido.</p>
                  <button
                    type="button"
                    onClick={() => append({ nome: '', validadeMeses: 12, diasAntecedenciaAlerta: 30 })}
                    className="text-xs text-primary font-bold hover:underline mt-1"
                  >
                    Adicionar o primeiro
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER FIXO */}
        <div className="p-4 bg-background border-t border-border flex justify-end gap-3 shrink-0">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancelar} 
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            isLoading={isSubmitting} 
            icon={<Save className="w-4 h-4" />} 
            className="shadow-button hover:shadow-float"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Cargo'}
          </Button>
        </div>

      </form>
    </div>
  );
}