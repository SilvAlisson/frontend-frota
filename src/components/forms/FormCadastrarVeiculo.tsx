import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// Definição do Schema
const veiculoSchema = z.object({
  placa: z.string().min(7, "Placa inválida (mín 7 carateres)").transform(v => v.toUpperCase()),
  modelo: z.string().min(2, "Modelo é obrigatório"),
  // coerce.number converte a string do input para number automaticamente
  ano: z.coerce.number().min(1950, "Ano inválido").max(new Date().getFullYear() + 1, "Ano inválido"),
  tipoVeiculo: z.string().min(2, "Tipo de veículo é obrigatório"),
  vencimentoCiv: z.string().optional(),
  vencimentoCipp: z.string().optional(),
});

type VeiculoForm = z.infer<typeof veiculoSchema>;

interface FormCadastrarVeiculoProps {
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormCadastrarVeiculo({ onSuccess, onCancelar }: FormCadastrarVeiculoProps) {
  const [successMsg, setSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<VeiculoForm>({
    // CORREÇÃO: 'as any' resolve o conflito de tipagem estrita (unknown vs number) do ZodResolver
    resolver: zodResolver(veiculoSchema) as any
  });

  const onSubmit = async (data: VeiculoForm) => {
    setSuccessMsg('');
    try {
      const payload = {
        ...data,
        vencimentoCiv: data.vencimentoCiv || null,
        vencimentoCipp: data.vencimentoCipp || null,
      };

      await api.post('/veiculo', payload);

      setSuccessMsg(`Veículo ${data.placa} cadastrado com sucesso!`);
      reset();

      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error("Erro ao cadastrar:", err);
      if (err.response?.data?.error) {
        setError('root', { message: err.response.data.error });
      } else {
        setError('root', { message: "Falha ao cadastrar veículo. Tente novamente." });
      }
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
        </div>
        <h4 className="text-xl font-bold text-primary">
          Novo Veículo
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Placa" placeholder="ABC1D23" {...register('placa')} error={errors.placa?.message} />
        <Input label="Modelo" placeholder="Ex: VW Constellation" {...register('modelo')} error={errors.modelo?.message} />
        <Input label="Tipo de Caminhão" placeholder="Poliguindaste, Munck..." {...register('tipoVeiculo')} error={errors.tipoVeiculo?.message} />
        <Input label="Ano" type="number" placeholder="2020" {...register('ano')} error={errors.ano?.message} />
      </div>

      <div className="pt-4 border-t border-gray-100 mt-6">
        <h4 className="text-sm font-bold text-text-secondary mb-4 uppercase tracking-wide text-center md:text-left">Controle de Documentação (Opcional)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Vencimento CIV" type="date" {...register('vencimentoCiv')} error={errors.vencimentoCiv?.message} />
          <Input label="Vencimento CIPP" type="date" {...register('vencimentoCipp')} error={errors.vencimentoCipp?.message} />
        </div>
      </div>

      {errors.root && (
        <div className="flex items-center gap-3 p-3 rounded-md bg-red-50 border border-red-200 text-error text-sm animate-pulse mt-4">
          <span>{errors.root.message}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 p-3 rounded-md bg-green-50 border border-green-200 text-success text-sm mt-4">
          <span>{successMsg}</span>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancelar} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting} isLoading={isSubmitting}>
          {isSubmitting ? 'A Registar...' : 'Registar Veículo'}
        </Button>
      </div>
    </form>
  );
}