import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DOMPurify from 'dompurify';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// Tipos auxiliares para a lista
interface Plano {
  id: string;
  descricao: string;
  tipoIntervalo: 'KM' | 'TEMPO';
  valorIntervalo: number;
  kmProximaManutencao?: number | null;
  dataProximaManutencao?: string | null;
  veiculo: {
    placa: string;
    modelo: string;
  };
}

// 1. Schema Zod
const planoSchema = z.object({
  veiculoId: z.string().min(1, "Selecione um veículo"),
  descricao: z.string().min(3, "Descrição obrigatória (ex: Troca de óleo)"),
  tipoIntervalo: z.enum(['KM', 'TEMPO']),
  valorIntervalo: z.coerce.number().positive("O intervalo deve ser positivo"),
});

type PlanoForm = z.infer<typeof planoSchema>;

interface FormPlanoProps {
  veiculos: any[];
}

export function FormPlanoManutencao({ veiculos }: FormPlanoProps) {

  // Estados para a lista (mantidos fora do RHF)
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // 2. React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<PlanoForm>({
    // CORREÇÃO: 'as any' para resolver conflito de tipagem entre z.coerce (unknown) e field values
    resolver: zodResolver(planoSchema) as any,
    defaultValues: {
      veiculoId: '',
      descricao: '',
      tipoIntervalo: 'KM',
      valorIntervalo: 0
    }
  });

  // Observar para mudar o placeholder dinamicamente
  const tipoIntervalo = watch('tipoIntervalo');

  // --- Funções de API ---

  const fetchPlanos = async () => {
    setLoadingList(true);
    try {
      const response = await api.get('/planos-manutencao');
      setPlanos(response.data);
    } catch (err) {
      console.error(err);
      // Erro silencioso na lista ou toast global
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchPlanos();
  }, []);

  const onSubmit = async (data: PlanoForm) => {
    setSuccessMsg('');
    try {
      await api.post('/plano-manutencao', {
        veiculoId: data.veiculoId,
        descricao: DOMPurify.sanitize(data.descricao),
        tipoIntervalo: data.tipoIntervalo,
        valorIntervalo: data.valorIntervalo,
      });

      setSuccessMsg('Plano criado com sucesso!');
      reset(); // Limpa form
      fetchPlanos(); // Atualiza lista lateral

      setTimeout(() => setSuccessMsg(''), 3000);

    } catch (err: any) {
      console.error("Erro ao criar plano:", err);
      const msg = err.response?.data?.error || 'Falha ao criar o plano.';
      setError('root', { message: msg });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que quer apagar este plano?")) return;

    try {
      await api.delete(`/plano-manutencao/${id}`);
      fetchPlanos();
    } catch (err) {
      console.error("Erro ao deletar plano:", err);
      alert('Falha ao apagar o plano.');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

      {/* Coluna 1: Formulário de Criação */}
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

        <div className="text-center md:text-left">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-50 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-purple-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h4 className="text-xl font-bold text-primary">
            Plano Preventivo
          </h4>
          <p className="text-sm text-text-secondary mt-1">
            Configure alertas automáticos para manutenção.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block mb-1.5 text-sm font-medium text-text-secondary">Veículo</label>
            <div className="relative">
              <select
                className="w-full px-4 py-2 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none"
                {...register('veiculoId')}
                disabled={isSubmitting}
              >
                <option value="">Selecione um veículo...</option>
                {veiculos.map(v => (
                  <option key={v.id} value={v.id}>{v.placa} ({v.modelo})</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            {errors.veiculoId && <p className="mt-1 text-xs text-error">{errors.veiculoId.message}</p>}
          </div>

          <Input
            label="Descrição do Plano"
            placeholder="Ex: Revisão 20.000km, Troca de Óleo"
            {...register('descricao')}
            error={errors.descricao?.message}
            disabled={isSubmitting}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 text-sm font-medium text-text-secondary">Tipo de Intervalo</label>
              <div className="relative">
                <select
                  className="w-full px-4 py-2 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none"
                  {...register('tipoIntervalo')}
                  disabled={isSubmitting}
                >
                  <option value="KM">KM</option>
                  <option value="TEMPO">Tempo (Meses)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <Input
              label="Intervalo (Valor)"
              type="number"
              placeholder={tipoIntervalo === 'KM' ? 'Ex: 10000' : 'Ex: 6'}
              {...register('valorIntervalo')}
              error={errors.valorIntervalo?.message}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {errors.root && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-error text-sm animate-pulse text-center">
            {errors.root.message}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-md bg-green-50 border border-green-200 text-success text-sm text-center">
            {successMsg}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : 'Plano criado'}
        </Button>
      </form>

      {/* Coluna 2: Lista de Planos Atuais */}
      <div className="space-y-4 border-t md:border-t-0 md:border-l md:pl-8 border-gray-200 pt-6 md:pt-0">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-lg font-semibold text-primary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            Planos Ativos
          </h4>
          <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full text-gray-600">
            {planos.length}
          </span>
        </div>

        {loadingList && planos.length === 0 && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}

        <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {!loadingList && planos.length === 0 && (
            <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-text-secondary text-sm">Nenhum plano preventivo criado ainda.</p>
            </div>
          )}

          {planos.map(plano => (
            <div key={plano.id} className="bg-white p-4 rounded-card shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h5 className="font-bold text-text">{plano.descricao}</h5>
                  <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold mt-1">
                    {plano.veiculo.placa} • {plano.veiculo.modelo}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="danger"
                  className="!p-1.5 h-8 w-8 rounded-full"
                  onClick={() => handleDelete(plano.id)}
                  title="Apagar Plano"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" />
                    </svg>
                  }
                />
              </div>

              <div className="bg-gray-50 p-2 rounded text-sm text-gray-700 mb-2">
                <span className="font-medium">Regra:</span> A cada {plano.valorIntervalo} {plano.tipoIntervalo === 'KM' ? 'KM' : 'Meses'}
              </div>

              {/* Próximo Alerta */}
              {plano.tipoIntervalo === 'KM' && plano.kmProximaManutencao && (
                <div className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded inline-flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Próxima: {plano.kmProximaManutencao} KM
                </div>
              )}
              {plano.tipoIntervalo === 'TEMPO' && plano.dataProximaManutencao && (
                <div className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded inline-flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  Próxima: {new Date(plano.dataProximaManutencao).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}