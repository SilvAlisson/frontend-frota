import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import DOMPurify from 'dompurify';

// 1. Schema (idêntico ao de cadastro para consistência)
const veiculoSchema = z.object({
  placa: z.string().min(7, "Placa inválida").transform(v => v.toUpperCase()),
  modelo: z.string().min(2, "Modelo obrigatório"),
  ano: z.coerce.number().min(1950, "Ano inválido").max(new Date().getFullYear() + 1, "Ano inválido"),
  tipoVeiculo: z.string().min(2, "Tipo obrigatório"),
  vencimentoCiv: z.string().optional().nullable(),
  vencimentoCipp: z.string().optional().nullable(),
});

type VeiculoForm = z.infer<typeof veiculoSchema>;

interface FormEditarVeiculoProps {
  veiculoId: string;
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormEditarVeiculo({ veiculoId, onSuccess, onCancelar }: FormEditarVeiculoProps) {

  const [loadingData, setLoadingData] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<VeiculoForm>({
    resolver: zodResolver(veiculoSchema) as any,
    defaultValues: {
      placa: '',
      modelo: '',
      ano: new Date().getFullYear(),
      tipoVeiculo: '',
      vencimentoCiv: '',
      vencimentoCipp: '',
    }
  });

  // 2. Carregar dados iniciais
  useEffect(() => {
    async function loadData() {
      if (!veiculoId) return;
      setLoadingData(true);
      try {
        const response = await api.get(`/veiculo/${veiculoId}`);
        const data = response.data;

        // Preenche o formulário com os dados vindos da API
        reset({
          placa: data.placa,
          modelo: data.modelo,
          ano: data.ano,
          tipoVeiculo: data.tipoVeiculo,
          // Formata datas ISO para YYYY-MM-DD (necessário para input type="date")
          vencimentoCiv: data.vencimentoCiv ? String(data.vencimentoCiv).split('T')[0] : '',
          vencimentoCipp: data.vencimentoCipp ? String(data.vencimentoCipp).split('T')[0] : '',
        });
      } catch (err) {
        console.error(err);
        setError('root', { message: "Falha ao carregar dados do veículo." });
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [veiculoId, reset, setError]);

  // 3. Enviar atualização
  const onSubmit = async (data: VeiculoForm) => {
    setSuccessMsg('');
    try {
      const payload = {
        placa: DOMPurify.sanitize(data.placa),
        modelo: DOMPurify.sanitize(data.modelo),
        ano: data.ano,
        tipoVeiculo: DOMPurify.sanitize(data.tipoVeiculo),
        vencimentoCiv: data.vencimentoCiv || null,
        vencimentoCipp: data.vencimentoCipp || null,
      };

      await api.put(`/veiculo/${veiculoId}`, payload);
      setSuccessMsg('Veículo atualizado com sucesso!');

      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error || "Erro ao atualizar veículo.";
      setError('root', { message: msg });
    }
  };

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
        <p className="text-sm text-text-secondary">A carregar dados do veículo...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
        </div>
        <h4 className="text-xl font-bold text-primary">Editar Veículo</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Placa"
          {...register("placa")}
          error={errors.placa?.message}
          disabled={isSubmitting}
        />
        <Input
          label="Modelo"
          {...register("modelo")}
          error={errors.modelo?.message}
          disabled={isSubmitting}
        />
        <Input
          label="Ano"
          type="number"
          {...register("ano")}
          error={errors.ano?.message}
          disabled={isSubmitting}
        />
        <Input
          label="Tipo (Munck...)"
          {...register("tipoVeiculo")}
          error={errors.tipoVeiculo?.message}
          disabled={isSubmitting}
        />
      </div>

      <div className="pt-4 border-t border-gray-100 mt-4">
        <h5 className="text-xs font-bold text-text-secondary uppercase mb-3">Documentação</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Vencimento CIV"
            type="date"
            {...register("vencimentoCiv")}
            error={errors.vencimentoCiv?.message}
            disabled={isSubmitting}
          />
          <Input
            label="Vencimento CIPP"
            type="date"
            {...register("vencimentoCipp")}
            error={errors.vencimentoCipp?.message}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {errors.root && (
        <div className="p-3 bg-red-50 text-error text-sm rounded text-center border border-red-100 animate-pulse">
          {errors.root.message}
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-green-50 text-success text-sm rounded text-center border border-green-100 font-medium">
          {successMsg}
        </div>
      )}

      <div className="flex gap-3 pt-2">
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
          className="flex-1"
          isLoading={isSubmitting}
        >
          Guardar Alterações
        </Button>
      </div>
    </form>
  );
}