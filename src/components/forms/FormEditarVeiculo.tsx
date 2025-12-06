import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { api } from '../../services/api';
import { handleApiError } from '../../utils/errorHandler';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Veiculo } from '../../types';

const tiposDeVeiculo = ["CAMINHAO", "CARRETA", "UTILITARIO", "OUTRO"] as const;
const tiposDeCombustivel = ["DIESEL_S10", "GASOLINA_COMUM", "ETANOL", "GNV"] as const;

// --- SCHEMA ZOD V4 ---
const veiculoSchema = z.object({
  placa: z.string({ error: "Placa inválida" })
    .min(7, { error: "Placa inválida" })
    .transform(val => val.toUpperCase()),

  modelo: z.string({ error: "Modelo é obrigatório" })
    .min(1, { error: "Modelo é obrigatório" }),

  ano: z.coerce.number({ error: "Ano inválido" })
    .min(1900, { error: "Ano inválido" })
    .max(new Date().getFullYear() + 1, { error: "Ano não pode ser futuro" }),

  tipoVeiculo: z.enum(tiposDeVeiculo, {
    error: "Selecione um tipo de veículo válido"
  }).nullable().optional(),

  tipoCombustivel: z.enum(tiposDeCombustivel).default('DIESEL_S10'),

  capacidadeTanque: z.coerce.number().positive().optional().nullable(),

  vencimentoCiv: z.union([z.string().optional(), z.literal('')]),
  vencimentoCipp: z.union([z.string().optional(), z.literal('')]),
});

type VeiculoFormValues = z.infer<typeof veiculoSchema>;

interface FormEditarVeiculoProps {
  veiculoId: string;
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormEditarVeiculo({ veiculoId, onSuccess, onCancelar }: FormEditarVeiculoProps) {

  const [loadingData, setLoadingData] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(veiculoSchema),
  });

  useEffect(() => {
    if (!veiculoId) return;

    const fetchVeiculo = async () => {
      setLoadingData(true);
      try {
        const response = await api.get<Veiculo>(`/veiculo/${veiculoId}`);
        const veiculo = response.data;

        reset({
          placa: veiculo.placa,
          modelo: veiculo.modelo,
          ano: veiculo.ano,
          tipoVeiculo: (veiculo.tipoVeiculo as any) || 'OUTRO',
          tipoCombustivel: veiculo.tipoCombustivel || 'DIESEL_S10',
          capacidadeTanque: veiculo.capacidadeTanque,
          vencimentoCiv: veiculo.vencimentoCiv || '',
          vencimentoCipp: veiculo.vencimentoCipp || ''
        });
      } catch (err) {
        handleApiError(err, 'Erro ao carregar dados do veículo.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchVeiculo();
  }, [veiculoId, reset]);

  const onSubmit = async (data: VeiculoFormValues) => {
    try {
      const payload = {
        ...data,
        vencimentoCiv: data.vencimentoCiv === '' ? null : data.vencimentoCiv,
        vencimentoCipp: data.vencimentoCipp === '' ? null : data.vencimentoCipp,
        capacidadeTanque: data.capacidadeTanque || null,
        tipoVeiculo: data.tipoVeiculo || null
      };

      await api.put(`/veiculo/${veiculoId}`, payload);

      toast.success('Veículo atualizado!');
      setTimeout(() => onSuccess(), 1500);

    } catch (err) {
      handleApiError(err, 'Falha ao salvar veículo.');
    }
  };

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-gray-500">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <h4 className="text-xl font-bold text-gray-900">Editar Veículo</h4>
          <p className="text-sm text-gray-500">Atualize os dados da frota.</p>
        </div>

        <div className="space-y-4">
          <Input
            label="Placa"
            {...register('placa')}
            error={errors.placa?.message as string}
            disabled={isSubmitting}
          />

          <Input
            label="Modelo"
            {...register('modelo')}
            error={errors.modelo?.message as string}
            disabled={isSubmitting}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ano"
              type="number"
              {...register('ano')}
              error={errors.ano?.message as string}
              disabled={isSubmitting}
            />

            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700">Tipo</label>
              <div className="relative">
                <select
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-input appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                  {...register('tipoVeiculo')}
                  disabled={isSubmitting}
                >
                  <option value="">Selecione...</option>
                  {tiposDeVeiculo.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              {errors.tipoVeiculo && <p className="mt-1 text-xs text-red-500">{errors.tipoVeiculo.message as string}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700">Combustível</label>
              <div className="relative">
                <select
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-input appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                  {...register('tipoCombustivel')}
                  disabled={isSubmitting}
                >
                  {tiposDeCombustivel.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
            <Input
              label="Tanque (L)"
              type="number"
              placeholder="Ex: 400"
              {...register('capacidadeTanque')}
              error={errors.capacidadeTanque?.message as string}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100 mt-2">
            <Input
              label="Vencimento CIV"
              type="date"
              {...register('vencimentoCiv')}
              error={errors.vencimentoCiv?.message as string}
              disabled={isSubmitting}
            />
            <Input
              label="Vencimento CIPP"
              type="date"
              {...register('vencimentoCipp')}
              error={errors.vencimentoCipp?.message as string}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onCancelar} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" isLoading={isSubmitting} disabled={isSubmitting}>
            Salvar Alterações
          </Button>
        </div>

      </form>
    </div>
  );
}