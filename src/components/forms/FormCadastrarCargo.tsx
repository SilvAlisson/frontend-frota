import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// --- SCHEMA ZOD V4 ---
const requisitoSchema = z.object({
    nome: z.string({ error: "Nome do curso é obrigatório" })
        .min(2, { error: "Nome muito curto" }),

    validadeMeses: z.coerce.number({ error: "Validade inválida" })
        .min(0, { error: "Validade inválida" }),

    diasAntecedenciaAlerta: z.coerce.number()
        .min(1, { error: "Mínimo 1 dia" }).default(30),
});

const cargoSchema = z.object({
    nome: z.string({ error: "Nome é obrigatório" })
        .min(3, { error: "Mínimo 3 caracteres" })
        .transform(val => val.toUpperCase()),
    descricao: z.string().optional(),
    requisitos: z.array(requisitoSchema).optional(),
});

// Inferência automática do tipo a partir do schema
type CargoFormValues = z.infer<typeof cargoSchema>;

interface FormCadastrarCargoProps {
    onSuccess: () => void;
    onCancelar: () => void;
}

export function FormCadastrarCargo({ onSuccess, onCancelar }: FormCadastrarCargoProps) {
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // ✅ CORREÇÃO: Removido <CargoForm> e 'as any'.
    // O hook infere os tipos com base no resolver.
    const {
        register,
        control,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm({
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

    const onSubmit = async (data: CargoFormValues) => {
        setSuccessMsg('');
        setErrorMsg('');
        try {
            await api.post('/cargos', data);
            setSuccessMsg('Cargo e requisitos cadastrados com sucesso!');
            setTimeout(onSuccess, 1500);
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.response?.data?.error || 'Erro ao salvar cargo.');
        }
    };

    return (
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

            <div className="text-center mb-6">
                <h4 className="text-xl font-bold text-primary">Novo Cargo / Função</h4>
                <p className="text-sm text-gray-500">Defina a função e os treinamentos obrigatórios.</p>
            </div>

            <div className="space-y-4">
                <Input
                    label="Nome do Cargo"
                    placeholder="Ex: OPERADOR DE EQUIPAMENTOS"
                    {...register('nome')}
                    error={errors.nome?.message as string}
                    disabled={isSubmitting}
                />

                <Input
                    label="Descrição (Opcional)"
                    placeholder="Ex: Responsável por operar veículos pesados..."
                    {...register('descricao')}
                    disabled={isSubmitting}
                />
            </div>

            {/* LISTA DE REQUISITOS */}
            <div className="mt-6 border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center mb-3">
                    <h5 className="text-sm font-bold text-gray-700 uppercase">Treinamentos Obrigatórios</h5>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => append({ nome: '', validadeMeses: 12, diasAntecedenciaAlerta: 30 })}
                        className="!py-1 !px-3 text-xs"
                        disabled={isSubmitting}
                    >
                        + Adicionar Curso
                    </Button>
                </div>

                <div className="space-y-3 bg-gray-50 p-4 rounded-card border border-gray-200 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 gap-3 items-end bg-white p-3 rounded shadow-sm">
                            <div className="col-span-5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Nome do Curso</label>
                                <input
                                    {...register(`requisitos.${index}.nome`)}
                                    placeholder="Ex: MOPP"
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary outline-none"
                                    disabled={isSubmitting}
                                />
                                {errors.requisitos?.[index]?.nome && <span className="text-xs text-error">{errors.requisitos[index]?.nome?.message}</span>}
                            </div>

                            <div className="col-span-3">
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Validade (Meses)</label>
                                <input
                                    type="number"
                                    {...register(`requisitos.${index}.validadeMeses`)}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary outline-none"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="col-span-3">
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Alerta (Dias)</label>
                                <input
                                    type="number"
                                    {...register(`requisitos.${index}.diasAntecedenciaAlerta`)}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary outline-none"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="col-span-1 flex justify-center pb-1">
                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="text-gray-400 hover:text-error transition-colors"
                                    title="Remover item"
                                    disabled={isSubmitting}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                    {fields.length === 0 && (
                        <p className="text-center text-xs text-gray-400 py-4">Nenhum treinamento obrigatório adicionado.</p>
                    )}
                </div>
            </div>

            {errorMsg && <div className="p-3 bg-red-50 text-error border border-red-200 rounded text-center text-sm">{errorMsg}</div>}
            {successMsg && <div className="p-3 bg-green-50 text-success border border-green-200 rounded text-center text-sm">{successMsg}</div>}

            <div className="flex gap-3 pt-4">
                <Button type="button" variant="secondary" className="flex-1" onClick={onCancelar} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" variant="primary" className="flex-1" isLoading={isSubmitting}>Salvar Cargo</Button>
            </div>
        </form>
    );
}