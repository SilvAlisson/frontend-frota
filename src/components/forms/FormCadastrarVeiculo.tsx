import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DOMPurify from 'dompurify';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';

// --- CONFIGURAÇÃO DAS CATEGORIAS ---
const CATEGORIAS_VEICULO = ['POLIGUINDASTE', 'VACUO', 'MUNCK', 'LEVE', 'OUTRO'] as const;

// --- SCHEMA ---
const veiculoSchema = z.object({
  placa: z.string()
    .length(7, 'A placa deve ter 7 caracteres')
    .toUpperCase()
    .transform(val => val.trim()),

  modelo: z.string().min(2, 'Modelo é obrigatório'),
  marca: z.string().min(2, 'Marca é obrigatória'),

  ano: z.coerce.number()
    .min(1900, 'Ano inválido')
    .max(new Date().getFullYear() + 1, 'Ano não pode ser futuro'),

  tipoVeiculo: z.enum(CATEGORIAS_VEICULO),
  // [CORREÇÃO: Enums alinhados com o Backend]
  tipoCombustivel: z.enum(['DIESEL_S10', 'GASOLINA_COMUM', 'ETANOL', 'GNV']),

  capacidadeTanque: z.coerce.number().min(1, 'Capacidade necessária'),

  // [CORREÇÃO: Renomeado para kmCadastro para bater com a API/Hook]
  kmAtual: z.coerce.number().min(0, 'KM não pode ser negativo'),

  mediaEstimada: z.coerce.number()
    .min(0.1, 'Informe uma média alvo válida (ex: 3.5)'),

  vencimentoCiv: z.string().optional().or(z.literal('')),
  vencimentoCipp: z.string().optional().or(z.literal('')),
});

// Tipos separados para Entrada e Saída
type VeiculoFormInput = z.input<typeof veiculoSchema>;
type VeiculoFormOutput = z.output<typeof veiculoSchema>;

interface FormProps {
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormCadastrarVeiculo({ onSuccess, onCancelar }: FormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<VeiculoFormInput, any, VeiculoFormOutput>({
    resolver: zodResolver(veiculoSchema),
    defaultValues: {
      tipoVeiculo: 'POLIGUINDASTE',
      tipoCombustivel: 'DIESEL_S10',
      kmAtual: 0, // Inicia com 0
      capacidadeTanque: 0,
      mediaEstimada: 0,
      ano: new Date().getFullYear(),
      placa: '',
      modelo: '',
      marca: '',
      vencimentoCiv: '',
      vencimentoCipp: ''
    },
    mode: 'onBlur'
  });

  const onSubmit = async (data: VeiculoFormOutput) => {
    try {
      // 1. Removemos mediaEstimada do envio pois não existe na tabela Veiculo do Prisma ainda
      const { mediaEstimada, ...dadosParaEnvio } = data;

      const payload = {
        ...dadosParaEnvio,
        placa: DOMPurify.sanitize(data.placa),
        modelo: DOMPurify.sanitize(data.modelo),
        marca: DOMPurify.sanitize(data.marca),
        // Tratamento de datas vazias para null
        vencimentoCiv: data.vencimentoCiv ? new Date(data.vencimentoCiv).toISOString() : null,
        vencimentoCipp: data.vencimentoCipp ? new Date(data.vencimentoCipp).toISOString() : null,
      };

      await api.post('/veiculos', payload);

      toast.success(`Veículo ${data.placa} cadastrado com sucesso!`);
      reset();
      setTimeout(onSuccess, 500);

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || 'Erro ao cadastrar. Verifique a placa.';
      toast.error(msg);
    }
  };

  // Estilos
  const labelStyle = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1";
  const errorStyle = "text-xs text-red-500 mt-1 ml-1 font-medium animate-pulse";
  const selectStyle = "w-full h-10 px-3 bg-white border border-border rounded-input text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer placeholder:text-gray-400 disabled:bg-gray-50";

  return (
    <div className="bg-white rounded-xl shadow-lg border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-300">

      <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Novo Veículo</h3>
          <p className="text-xs text-gray-500">Preencha os dados técnicos da frota.</p>
        </div>
        <div className="p-2 bg-white rounded-lg border border-border shadow-sm text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* IDENTIFICAÇÃO */}
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-primary mb-2 block border-b border-border pb-1 tracking-widest">IDENTIFICAÇÃO</label>
          </div>

          <div>
            <label className={labelStyle}>Placa</label>
            <Input
              {...register('placa')}
              placeholder="ABC1D23"
              className="uppercase font-mono tracking-wide"
              maxLength={7}
              autoFocus
              disabled={isSubmitting}
            />
            {errors.placa && <p className={errorStyle}>{errors.placa.message}</p>}
          </div>

          <div>
            <label className={labelStyle}>Modelo</label>
            <Input
              {...register('modelo')}
              placeholder="Ex: Constellation 24.280"
              disabled={isSubmitting}
            />
            {errors.modelo && <p className={errorStyle}>{errors.modelo.message}</p>}
          </div>

          <div>
            <label className={labelStyle}>Marca</label>
            <Input
              {...register('marca')}
              placeholder="Ex: Volkswagen"
              disabled={isSubmitting}
            />
            {errors.marca && <p className={errorStyle}>{errors.marca.message}</p>}
          </div>

          <div>
            <label className={labelStyle}>Ano Fabricação</label>
            <Input
              type="number"
              {...register('ano')}
              placeholder={new Date().getFullYear().toString()}
              disabled={isSubmitting}
            />
            {errors.ano && <p className={errorStyle}>{errors.ano.message}</p>}
          </div>

          {/* DADOS TÉCNICOS */}
          <div className="md:col-span-2 mt-2">
            <label className="text-[10px] font-bold text-primary mb-2 block border-b border-border pb-1 tracking-widest">DADOS TÉCNICOS</label>
          </div>

          <div>
            <label className={labelStyle}>Categoria</label>
            <div className="relative">
              <select {...register('tipoVeiculo')} className={selectStyle} disabled={isSubmitting}>
                <option value="POLIGUINDASTE">Poliguindaste</option>
                <option value="VACUO">Caminhão Vácuo</option>
                <option value="MUNCK">Caminhão Munck</option>
                <option value="LEVE">Veículo Leve</option>
                <option value="OUTRO">Outro</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            {errors.tipoVeiculo && <p className={errorStyle}>{errors.tipoVeiculo.message}</p>}
          </div>

          <div>
            <label className={labelStyle}>Combustível</label>
            <div className="relative">
              <select {...register('tipoCombustivel')} className={selectStyle} disabled={isSubmitting}>
                <option value="DIESEL_S10">Diesel S10</option>
                <option value="GASOLINA_COMUM">Gasolina Comum</option>
                <option value="ETANOL">Etanol</option>
                <option value="GNV">GNV</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            {errors.tipoCombustivel && <p className={errorStyle}>{errors.tipoCombustivel.message}</p>}
          </div>

          <div>
            <label className={labelStyle}>Tanque (Litros)</label>
            <div className="relative">
              <Input
                type="number"
                {...register('capacidadeTanque')}
                placeholder="Ex: 270"
                disabled={isSubmitting}
              />
              <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">L</span>
            </div>
            {errors.capacidadeTanque && <p className={errorStyle}>{errors.capacidadeTanque.message}</p>}
          </div>

          <div>
            <label className={labelStyle}>Média Alvo (KM/L)</label>
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                {...register('mediaEstimada')}
                placeholder="Ex: 3.5"
                disabled={isSubmitting}
              />
              <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">KM/L</span>
            </div>
            {errors.mediaEstimada && <p className={errorStyle}>{errors.mediaEstimada.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className={labelStyle}>KM Inicial (Odômetro)</label>
            <Input
              type="number"
              {...register('kmAtual')}
              placeholder="0"
              disabled={isSubmitting}
            />
            <p className="text-[10px] text-gray-400 mt-1 ml-1">Insira o valor exato do painel para o marco zero.</p>
            {errors.kmAtual && <p className={errorStyle}>{errors.kmAtual.message}</p>}
          </div>

          <div className="md:col-span-2 mt-2">
            <label className="text-[10px] font-bold text-primary mb-2 block border-b border-border pb-1 tracking-widest">DOCUMENTAÇÃO</label>
          </div>

          <div>
            <label className={labelStyle}>Vencimento CIV</label>
            <Input type="date" {...register('vencimentoCiv')} disabled={isSubmitting} />
          </div>

          <div>
            <label className={labelStyle}>Vencimento CIPP</label>
            <Input type="date" {...register('vencimentoCipp')} disabled={isSubmitting} />
          </div>

        </div>

        <div className="mt-8 pt-5 border-t border-border flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancelar}
            className="text-gray-500"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="shadow-lg shadow-primary/20 px-6"
            icon={<span>💾</span>}
            disabled={isSubmitting}
          >
            Salvar Veículo
          </Button>
        </div>
      </form >
    </div >
  );
}