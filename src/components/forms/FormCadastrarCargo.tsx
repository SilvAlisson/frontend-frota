import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import DOMPurify from 'dompurify';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';

// --- SCHEMA ZOD (Mantido) ---
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
        mode: 'onBlur' // Restaura validação apenas ao sair do campo
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
            // [CORREÇÃO 2: Feedback] Restaura mensagem real do backend
            error: (err) => {
                console.error(err);
                return err.response?.data?.error || 'Erro ao salvar. Verifique os dados.';
            }
        });
    };

    // Estilos Auxiliares
    const labelStyle = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1";
    // [CORREÇÃO 1: Disabled] Adicionado estilo visual para estado desabilitado
    const manualInputStyle = "w-full px-4 py-2.5 text-sm text-gray-900 bg-white border border-border rounded-input transition-all duration-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed";

    return (
        <div className="bg-white rounded-xl shadow-lg border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-300">

            {/* HEADER */}
            <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Novo Cargo</h3>
                    <p className="text-xs text-gray-500">Defina funções e matriz de treinamento.</p>
                </div>
                <div className="p-2 bg-white rounded-lg border border-border shadow-sm text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
                    </svg>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">

                {/* DADOS BÁSICOS */}
                <div className="space-y-4">
                    <div>
                        <label className={labelStyle}>Título do Cargo</label>
                        <Input
                            {...register('nome')}
                            placeholder="Ex: LÍDER DE LOGÍSTICA"
                            error={errors.nome?.message}
                            className="uppercase font-bold tracking-wide"
                            autoFocus
                            disabled={isSubmitting} //  Bloqueio
                        />
                    </div>

                    <div>
                        <label className={labelStyle}>Descrição da Função</label>
                        <textarea
                            {...register('descricao')}
                            rows={3}
                            disabled={isSubmitting} //  Bloqueio
                            className={`${manualInputStyle} resize-none`}
                            placeholder="Descreva brevemente as responsabilidades e escopo..."
                        />
                    </div>
                </div>

                {/* LISTA DE REQUISITOS */}
                <div className="border-t border-border pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Requisitos Obrigatórios</h4>
                            <span className="bg-background text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-border">{fields.length}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => append({ nome: '', validadeMeses: 12, diasAntecedenciaAlerta: 30 })}
                            disabled={isSubmitting} // 
                            className="text-xs text-primary font-bold hover:underline bg-primary/5 px-2 py-1.5 rounded-lg transition-colors hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            + Adicionar Curso
                        </button>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {fields.map((field, index) => {
                            // [CORREÇÃO 4: UI] Captura erros específicos de cada item da lista
                            const errorValidade = errors.requisitos?.[index]?.validadeMeses?.message;
                            const errorAlerta = errors.requisitos?.[index]?.diasAntecedenciaAlerta?.message;

                            return (
                                <div key={field.id} className="bg-background p-3 rounded-xl border border-border relative group hover:border-primary/30 hover:shadow-sm transition-all">
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        disabled={isSubmitting} // 
                                        className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full w-6 h-6 border border-border shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 z-10 disabled:hidden"
                                        title="Remover item"
                                    >
                                        &times;
                                    </button>

                                    <div className="grid grid-cols-12 gap-3">
                                        {/* Nome do Curso */}
                                        <div className="col-span-12 sm:col-span-6">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Nome do Treinamento</label>
                                            <Input
                                                {...register(`requisitos.${index}.nome`)}
                                                placeholder="Ex: NR-35"
                                                error={errors.requisitos?.[index]?.nome?.message}
                                                containerClassName="!mb-0"
                                                className="bg-white py-2"
                                                disabled={isSubmitting} //
                                            />
                                        </div>

                                        {/* Validade */}
                                        <div className="col-span-6 sm:col-span-3">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block text-center">Validade (Meses)</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    {...register(`requisitos.${index}.validadeMeses`)}
                                                    disabled={isSubmitting}
                                                    // Classe condicional para erro
                                                    className={`w-full text-xs p-2.5 text-center bg-white rounded-input border outline-none focus:ring-2 transition-all disabled:bg-gray-50 ${errorValidade
                                                        ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                                        : 'border-border focus:border-primary focus:ring-primary/20'
                                                        }`}
                                                />
                                                <span className="absolute right-2 top-2.5 text-[9px] text-gray-400 font-bold pointer-events-none">MÊS</span>
                                            </div>
                                            {/* Exibe o erro abaixo do input */}
                                            {errorValidade && <span className="text-[10px] text-red-500 block text-center mt-1 font-medium">{errorValidade}</span>}
                                        </div>

                                        {/* Alerta */}
                                        <div className="col-span-6 sm:col-span-3">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block text-center">Alerta (Dias)</label>
                                            <input
                                                type="number"
                                                {...register(`requisitos.${index}.diasAntecedenciaAlerta`)}
                                                disabled={isSubmitting}
                                                className={`w-full text-xs p-2.5 text-center bg-white rounded-input border outline-none focus:ring-2 transition-all disabled:bg-gray-50 ${errorAlerta
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                                    : 'border-border focus:border-primary focus:ring-primary/20'
                                                    }`}
                                            />
                                            {/* Exibe o erro abaixo do input */}
                                            {errorAlerta && <span className="text-[10px] text-red-500 block text-center mt-1 font-medium">{errorAlerta}</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {fields.length === 0 && (
                            <div className="text-center py-6 border-2 border-dashed border-border rounded-xl">
                                <p className="text-xs text-gray-400">Nenhum requisito definido para este cargo.</p>
                                <button
                                    type="button"
                                    onClick={() => append({ nome: '', validadeMeses: 12, diasAntecedenciaAlerta: 30 })}
                                    disabled={isSubmitting}
                                    className="text-xs text-primary font-bold hover:underline mt-1 disabled:opacity-50"
                                >
                                    Adicionar agora
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* FOOTER */}
                <div className="pt-6 border-t border-border flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={onCancelar} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" variant="primary" isLoading={isSubmitting} icon={<span>💾</span>} className="shadow-lg shadow-primary/20">
                        {isSubmitting ? 'Salvando...' : 'Salvar Cargo'}
                    </Button>
                </div>
            </form>
        </div>
    );
}