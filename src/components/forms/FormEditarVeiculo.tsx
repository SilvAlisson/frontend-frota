import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';
import type { Veiculo } from '../../types';

const tiposDeVeiculo = ["CAMINHAO", "CARRETA", "UTILITARIO", "OUTRO"] as const;
const tiposDeCombustivel = ["DIESEL_S10", "GASOLINA_COMUM", "ETANOL", "GNV"] as const;
const statusVeiculo = ["ATIVO", "EM_MANUTENCAO", "INATIVO"] as const;

// --- SCHEMA ZOD V4 ---
const veiculoSchema = z.object({
  placa: z.string({ error: "Placa obrigatória" })
    .length(7, { message: "Placa deve ter 7 caracteres" })
    .transform(val => val.trim().toUpperCase()),

  modelo: z.string({ error: "Modelo é obrigatório" })
    .min(1, { message: "Preencha o modelo" }),

  ano: z.coerce.number({ error: "Ano inválido" })
    .min(1900, { message: "Ano inválido" })
    .max(new Date().getFullYear() + 1, { message: "Ano não pode ser futuro" }),

  tipoVeiculo: z.enum(tiposDeVeiculo).nullable().optional(),

  tipoCombustivel: z.enum(tiposDeCombustivel).default('DIESEL_S10'),

  capacidadeTanque: z.coerce.number()
    .positive({ message: "Capacidade inválida" })
    .optional()
    .nullable(),

  // NOVO: Status Operacional
  status: z.enum(statusVeiculo, { error: "Status inválido" }).default('ATIVO'),

  // Datas opcionais tratadas como string vazia no input
  vencimentoCiv: z.string().optional().or(z.literal('')),
  vencimentoCipp: z.string().optional().or(z.literal('')),
});

type VeiculoFormValues = z.input<typeof veiculoSchema>;

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
  } = useForm<VeiculoFormValues>({
    resolver: zodResolver(veiculoSchema),
    defaultValues: {
      placa: '',
      modelo: '',
      ano: new Date().getFullYear(),
      tipoVeiculo: 'OUTRO',
      tipoCombustivel: 'DIESEL_S10',
      capacidadeTanque: 0,
      status: 'ATIVO',
      vencimentoCiv: '',
      vencimentoCipp: ''
    },
    mode: 'onBlur'
  });

  // --- CARREGAMENTO INICIAL ---
  useEffect(() => {
    if (!veiculoId) return;

    const fetchVeiculo = async () => {
      setLoadingData(true);
      try {
        const { data: veiculo } = await api.get<Veiculo>(`/veiculos/${veiculoId}`);

        reset({
          placa: veiculo.placa,
          modelo: veiculo.modelo,
          ano: veiculo.ano,
          tipoVeiculo: (veiculo.tipoVeiculo as any) || 'OUTRO',
          tipoCombustivel: veiculo.tipoCombustivel || 'DIESEL_S10',
          capacidadeTanque: veiculo.capacidadeTanque || 0,
          status: veiculo.status || 'ATIVO',

          // Formata datas ISO para YYYY-MM-DD (compatível com input type="date")
          vencimentoCiv: veiculo.vencimentoCiv ? new Date(veiculo.vencimentoCiv).toISOString().split('T')[0] : '',
          vencimentoCipp: veiculo.vencimentoCipp ? new Date(veiculo.vencimentoCipp).toISOString().split('T')[0] : ''
        });
      } catch (err) {
        console.error("Erro ao carregar veículo", err);
        toast.error('Erro ao carregar dados do veículo.');
        onCancelar();
      } finally {
        setLoadingData(false);
      }
    };

    fetchVeiculo();
  }, [veiculoId, reset, onCancelar]);

  // --- SUBMISSÃO ---
  const onSubmit = async (data: VeiculoFormValues) => {
    const payload = {
      ...data,
      // Converte strings de data de volta para Date objects ou null
      vencimentoCiv: data.vencimentoCiv ? new Date(data.vencimentoCiv).toISOString() : null,
      vencimentoCipp: data.vencimentoCipp ? new Date(data.vencimentoCipp).toISOString() : null,
      capacidadeTanque: data.capacidadeTanque || null,
      tipoVeiculo: data.tipoVeiculo || null
    };

    try {
      await api.put(`/veiculo/${veiculoId}`, payload);
      toast.success('Veículo atualizado!');
      onSuccess();
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Falha ao salvar veículo.');
    }
  };

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-100 border-t-green-600"></div>
        <p className="text-sm text-gray-500 font-medium animate-pulse">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-1">
      <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>

        {/* HEADER VISUAL */}
        <div className="text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-green-200 to-transparent rounded-full" />

          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 text-green-600 mb-4 shadow-sm ring-4 ring-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <h4 className="text-2xl font-bold text-gray-900 tracking-tight">Editar Veículo</h4>
          <p className="text-sm text-text-secondary mt-1">Atualize os dados e status da frota.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 px-1">
          <Input
            label="Placa"
            {...register('placa')}
            error={errors.placa?.message}
            disabled
            className="uppercase font-medium tracking-wide bg-gray-50 text-gray-500 cursor-not-allowed"
          />

          <Input
            label="Modelo"
            {...register('modelo')}
            error={errors.modelo?.message}
            disabled={isSubmitting}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ano"
              type="number"
              {...register('ano')}
              error={errors.ano?.message}
              disabled={isSubmitting}
            />

            <div>
              <label className="block mb-1.5 text-sm font-medium text-text-secondary">Tipo</label>
              <div className="relative group">
                <select
                  className="w-full px-4 py-2.5 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 appearance-none transition-all shadow-sm cursor-pointer hover:border-gray-400"
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
              {errors.tipoVeiculo && <p className="mt-1 text-xs text-error">{errors.tipoVeiculo.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 text-sm font-medium text-text-secondary">Combustível</label>
              <div className="relative group">
                <select
                  className="w-full px-4 py-2.5 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 appearance-none transition-all shadow-sm cursor-pointer hover:border-gray-400"
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
              error={errors.capacidadeTanque?.message}
              disabled={isSubmitting}
            />
          </div>

          {/* NOVO: Seletor de Status */}
          <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block mb-1.5 text-sm font-bold text-gray-700">Status Operacional</label>
            <div className="relative">
              <select
                {...register('status')}
                className="w-full px-4 py-3 text-sm font-medium bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
                disabled={isSubmitting}
              >
                <option value="ATIVO">🟢 Ativo (Em Operação)</option>
                <option value="EM_MANUTENCAO">🔧 Em Manutenção (Oficina)</option>
                <option value="INATIVO">🔴 Inativo (Baixado/Vendido)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Veículos em manutenção ou inativos não aparecem na lista de abastecimento rápido.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100 md:col-span-2">
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

        <div className="flex gap-3 pt-6 border-t border-gray-100 mt-4">
          <Button type="button" variant="secondary" className="flex-1" onClick={onCancelar} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-[2] shadow-lg shadow-green-500/20 hover:shadow-green-500/30 bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white transition-all" isLoading={isSubmitting} disabled={isSubmitting}>
            Salvar Alterações
          </Button>
        </div>

      </form>
    </div>
  );
}