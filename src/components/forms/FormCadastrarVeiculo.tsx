import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../services/api';
import DOMPurify from 'dompurify';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// 1. Schema de Validação Zod (Híbrido e Robusto)
const veiculoSchema = z.object({
  placa: z.string()
    .min(7, "A placa deve ter 7 caracteres")
    .max(7, "A placa deve ter 7 caracteres")
    .transform(val => val.toUpperCase()),

  modelo: z.string().min(2, "Modelo é obrigatório"),

  // number com message customizada para erro de tipo
  ano: z.number({ message: "Ano inválido" })
    .min(1900, "Ano inválido")
    .max(new Date().getFullYear() + 1, "Ano inválido"),

  tipoVeiculo: z.string().min(2, "Tipo é obrigatório"),

  // MELHORIA: z.union aceita string opcional (undefined) ou vazia (valor do input limpo)
  // Isso evita erros de tipagem no resolver e dispensa o 'as any'
  vencimentoCiv: z.union([z.string().optional(), z.literal('')]),
  vencimentoCipp: z.union([z.string().optional(), z.literal('')]),
});

type VeiculoForm = z.infer<typeof veiculoSchema>;

interface FormCadastrarVeiculoProps {
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormCadastrarVeiculo({ onSuccess, onCancelar }: FormCadastrarVeiculoProps) {

  // 2. Configuração do Hook Form
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<VeiculoForm>({
    resolver: zodResolver(veiculoSchema),
    defaultValues: {
      placa: '',
      modelo: '',
      ano: new Date().getFullYear(),
      tipoVeiculo: '',
      vencimentoCiv: '',
      vencimentoCipp: ''
    }
  });

  const [successMsg, setSuccessMsg] = useState('');

  // 3. Submit
  const onSubmit = async (data: VeiculoForm) => {
    setSuccessMsg('');
    try {
      await api.post('/veiculo', {
        placa: DOMPurify.sanitize(data.placa),
        modelo: DOMPurify.sanitize(data.modelo),
        ano: data.ano,
        tipoVeiculo: DOMPurify.sanitize(data.tipoVeiculo),
        // Lógica: se string vazia ou undefined, envia null
        vencimentoCiv: data.vencimentoCiv && data.vencimentoCiv !== '' ? data.vencimentoCiv : null,
        vencimentoCipp: data.vencimentoCipp && data.vencimentoCipp !== '' ? data.vencimentoCipp : null,
      });

      setSuccessMsg(`Veículo ${data.placa} cadastrado com sucesso!`);
      reset();

      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error("Erro ao cadastrar veículo:", err);
      if (err.response?.data?.error) {
        setError('root', { message: err.response.data.error });
      } else {
        setError('root', { message: 'Falha ao cadastrar veículo.' });
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
        <p className="text-sm text-text-secondary mt-1">
          Adicione um novo veículo à frota.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Placa"
          placeholder="ABC1D23"
          {...register('placa')}
          error={errors.placa?.message}
          disabled={isSubmitting}
          maxLength={7}
        />
        <Input
          label="Modelo"
          placeholder="Ex: VW Constellation"
          {...register('modelo')}
          error={errors.modelo?.message}
          disabled={isSubmitting}
        />
        <Input
          label="Tipo de Caminhão"
          placeholder="Poliguindaste, Munck..."
          {...register('tipoVeiculo')}
          error={errors.tipoVeiculo?.message}
          disabled={isSubmitting}
        />
        {/* valueAsNumber garante que o valor chegue como number para validação correta do z.number */}
        <Input
          label="Ano"
          type="number"
          placeholder="2020"
          {...register('ano', { valueAsNumber: true })}
          error={errors.ano?.message}
          disabled={isSubmitting}
        />
      </div>

      <div className="pt-4 border-t border-gray-100 mt-6">
        <h4 className="text-sm font-bold text-text-secondary mb-4 uppercase tracking-wide text-center md:text-left flex items-center gap-2">
          <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Controle de Documentação (Opcional)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Vencimento CIV"
            type="date"
            {...register('vencimentoCiv')}
            error={errors.vencimentoCiv?.message}
            disabled={isSubmitting}
          />
          <Input
            label="Vencimento CIPP"
            type="date"
            {...register('vencimentoCipp')}
            error={errors.vencimentoCipp?.message}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {errors.root && (
        <div className="flex items-center gap-3 p-3 rounded-md bg-red-50 border border-red-200 text-error text-sm animate-pulse mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          <span>{errors.root.message}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 p-3 rounded-md bg-green-50 border border-green-200 text-success text-sm mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      <div className="pt-4 flex gap-3">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          disabled={isSubmitting}
          onClick={onCancelar}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          {isSubmitting ? 'Registrando...' : 'Cadastrar Veículo'}
        </Button>
      </div>
    </form>
  );
}