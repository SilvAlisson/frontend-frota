import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod'; // CORREÇÃO: Importação nomeada para Zod v4
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';

// --- 1. SCHEMA ZOD V4 (Sintaxe Correta) ---
const requisitoSchema = z.object({
    // Zod v4: 'error' substitui required_error/invalid_type_error
    nome: z.string({ error: "Nome do curso é obrigatório" })
        .min(2, { message: "Nome muito curto" }),

    // z.coerce converte input string -> number. O 'error' captura falhas de tipo/obrigatobrariedade.
    validadeMeses: z.coerce.number({ error: "Validade inválida" })
        .min(0, { message: "A validade não pode ser negativa" }),

    diasAntecedenciaAlerta: z.coerce.number()
        .min(1, { message: "O alerta deve ser de pelo menos 1 dia" })
        .default(30),
});

const cargoSchema = z.object({
    nome: z.string({ error: "O nome do cargo é obrigatório" })
        .min(3, { message: "Mínimo de 3 caracteres para o cargo" })
        .transform(val => val.toUpperCase()), // Sanitização (Output)

    descricao: z.string().optional(),

    requisitos: z.array(requisitoSchema).optional(),
});

// Tipagem: Input (Formulário) vs Output (API)
type CargoFormInput = z.input<typeof cargoSchema>;

interface FormCadastrarCargoProps {
    onSuccess: () => void;
    onCancelar: () => void;
}

export function FormCadastrarCargo({ onSuccess, onCancelar }: FormCadastrarCargoProps) {

    // --- 2. CONFIGURAÇÃO DO FORM ---
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
            // UX: Inicia com um item para incentivar o preenchimento
            requisitos: [{ nome: '', validadeMeses: 12, diasAntecedenciaAlerta: 30 }]
        },
        mode: 'onBlur' // Valida ao sair do campo para menos ruído visual
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "requisitos"
    });

    // --- 3. SUBMISSÃO COM SONNER ---
    const onSubmit = async (data: CargoFormInput) => {
        // O Zod já transformou o 'nome' para uppercase no 'data'
        const promise = api.post('/cargos', data);

        toast.promise(promise, {
            loading: 'Salvando cargo e requisitos...',
            success: () => {
                setTimeout(onSuccess, 500); // Delay suave para fechar
                return 'Cargo criado com sucesso!';
            },
            error: (err) => {
                console.error(err);
                return err.response?.data?.error || 'Não foi possível salvar. Verifique os dados.';
            }
        });
    };

    return (
        <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>

            {/* HEADER VISUAL */}
            <div className="text-center relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent rounded-full" />

                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 text-primary mb-4 shadow-sm ring-4 ring-white">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
                    </svg>
                </div>

                <h4 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Novo Cargo
                </h4>
                <p className="text-sm text-text-secondary mt-1 max-w-xs mx-auto">
                    Defina as funções e requisitos de capacitação.
                </p>
            </div>

            {/* CAMPOS PRINCIPAIS */}
            <div className="grid gap-5 p-1">
                <Input
                    label="Título do Cargo"
                    placeholder="Ex: LÍDER DE LOGÍSTICA"
                    {...register('nome')}
                    error={errors.nome?.message as string}
                    disabled={isSubmitting}
                    className="uppercase font-semibold tracking-wide"
                    autoFocus
                />

                <div className="relative">
                    <label className="block mb-1.5 text-sm font-medium text-text-secondary">Descrição da Função</label>
                    <textarea
                        {...register('descricao')}
                        disabled={isSubmitting}
                        rows={3}
                        className="w-full px-4 py-3 text-sm text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all placeholder:text-gray-300 hover:border-gray-400"
                        placeholder="Descreva brevemente as responsabilidades..."
                    />
                </div>
            </div>

            {/* SEÇÃO DINÂMICA: REQUISITOS (Design Refinado) */}
            <div className="border-t border-gray-100 pt-6">
                <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-2">
                        <h5 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                            Requisitos Obrigatórios
                        </h5>
                        <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200">
                            {fields.length}
                        </span>
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => append({ nome: '', validadeMeses: 12, diasAntecedenciaAlerta: 30 })}
                        className="text-xs h-8 text-primary border border-primary/20 hover:bg-primary/5 hover:border-primary/50 transition-all"
                        disabled={isSubmitting}
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                            </svg>
                        }
                    >
                        Adicionar
                    </Button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 -mr-2">
                    {fields.map((field, index) => {
                        // Helpers para verificar erro no item específico
                        const errorNome = errors.requisitos?.[index]?.nome;
                        const errorValidade = errors.requisitos?.[index]?.validadeMeses;

                        return (
                            <div
                                key={field.id}
                                className="group relative grid grid-cols-12 gap-3 p-4 bg-gray-50/60 rounded-xl border border-transparent hover:border-gray-200 hover:bg-white hover:shadow-sm transition-all duration-300"
                            >
                                {/* Indicador Lateral */}
                                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-gray-200 rounded-r-full group-hover:bg-primary/50 transition-colors" />

                                {/* Campo: Nome */}
                                <div className="col-span-12 sm:col-span-6">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1 tracking-wider">Treinamento / Curso</label>
                                    <input
                                        {...register(`requisitos.${index}.nome`)}
                                        placeholder="Ex: NR-35 Trabalho em Altura"
                                        className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all shadow-sm ${errorNome
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                            : 'border-gray-200 focus:border-primary focus:ring-primary/10 hover:border-gray-300'
                                            }`}
                                        disabled={isSubmitting}
                                    />
                                    {errorNome && <span className="text-[10px] text-red-500 font-medium ml-1 mt-1 block animate-pulse">{errorNome.message}</span>}
                                </div>

                                {/* Campo: Validade */}
                                <div className="col-span-5 sm:col-span-3">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1 tracking-wider">Validade</label>
                                    <div className="relative group/input">
                                        <input
                                            type="number"
                                            {...register(`requisitos.${index}.validadeMeses`)}
                                            className={`w-full pl-3 pr-9 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all text-center font-medium shadow-sm ${errorValidade ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-primary focus:ring-primary/10 hover:border-gray-300'
                                                }`}
                                            disabled={isSubmitting}
                                        />
                                        <span className="absolute right-2 top-2 text-[9px] text-gray-400 font-bold pointer-events-none bg-gray-50 px-1 rounded">MÊS</span>
                                    </div>
                                </div>

                                {/* Campo: Alerta */}
                                <div className="col-span-5 sm:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1 text-center tracking-wider">Alerta (Dias)</label>
                                    <div className="relative" title="Dias antes do vencimento para alertar">
                                        <input
                                            type="number"
                                            {...register(`requisitos.${index}.diasAntecedenciaAlerta`)}
                                            className="w-full px-2 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-center text-gray-600 shadow-sm hover:border-gray-300"
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>

                                {/* Botão Remover */}
                                <div className="col-span-2 sm:col-span-1 flex items-end justify-center pb-1">
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                                        title="Remover este requisito"
                                        disabled={isSubmitting}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {fields.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-100 rounded-xl bg-white transition-all">
                            <div className="p-3 bg-gray-50 rounded-full mb-3 ring-4 ring-gray-50/50">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-300">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-500">Nenhum requisito definido</p>
                            <p className="text-xs text-gray-400 mt-1 max-w-[200px] text-center leading-relaxed">
                                Este cargo não exigirá certificações especiais. Clique abaixo para adicionar se necessário.
                            </p>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => append({ nome: '', validadeMeses: 12, diasAntecedenciaAlerta: 30 })}
                                className="mt-4 text-xs text-primary hover:underline hover:bg-transparent shadow-none border-none"
                            >
                                + Adicionar Requisito
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="flex gap-3 pt-6 border-t border-gray-100">
                <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={onCancelar}
                    disabled={isSubmitting}
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    className="flex-[2] shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                    isLoading={isSubmitting}
                >
                    {isSubmitting ? 'Salvando Dados...' : 'Salvar Cargo'}
                </Button>
            </div>
        </form>
    );
}