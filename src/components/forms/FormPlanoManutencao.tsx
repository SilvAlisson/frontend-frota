import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { PlanoManutencao, Veiculo } from '../../types';
import { TableStyles } from '../../styles/table';

// --- SCHEMA ---
const tiposIntervalo = ["KM", "TEMPO"] as const;

// --- MUDANÇAS ZOD V4 ---
const planoSchema = z.object({
  veiculoId: z.string().min(1, { error: "Selecione um veículo" }),
  descricao: z.string()
    .min(3, { error: "Descrição deve ter no mínimo 3 caracteres" })
    .transform(val => val.toUpperCase()),
  tipoIntervalo: z.enum(tiposIntervalo, {
    error: "Selecione um tipo válido"
  }),
  valorIntervalo: z.coerce.number()
    .min(1, { error: "O intervalo deve ser maior que 0" }),
});

type PlanoForm = z.infer<typeof planoSchema>;

interface FormPlanoManutencaoProps {
  veiculos: Veiculo[];
}

function IconeLixo() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.34.055-.68.11-.1022.166m11.54 0c.376.09.74.19 1.097.302l-1.148 3.896M12 18V9" /></svg>;
}

export function FormPlanoManutencao({ veiculos }: FormPlanoManutencaoProps) {

  const [planos, setPlanos] = useState<PlanoManutencao[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<PlanoForm>({
    resolver: zodResolver(planoSchema) as any,
    defaultValues: {
      veiculoId: '',
      descricao: '',
      tipoIntervalo: 'KM',
      valorIntervalo: 0
    }
  });

  const tipoIntervalo = watch('tipoIntervalo');

  const fetchPlanos = async () => {
    setLoadingList(true);
    try {
      const response = await api.get<PlanoManutencao[]>('/plano-manutencao');
      setPlanos(response.data);
    } catch (err) {
      console.error("Erro ao buscar planos:", err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchPlanos();
  }, []);

  const onSubmit = async (data: PlanoForm) => {
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.post('/plano-manutencao', data);
      setSuccessMsg('Plano criado com sucesso!');
      reset();
      await fetchPlanos();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error("Erro ao criar plano:", err);
      const apiError = err.response?.data?.error || 'Falha ao criar o plano.';
      setError('root', { message: apiError });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem a certeza que deseja remover este plano?")) return;

    setDeletingId(id);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Requisição ao backend primeiro
      await api.delete(`/plano-manutencao/${id}`);

      // Se bem sucedido (não lançou exceção), atualiza o estado local
      setPlanos(prev => prev.filter(p => p.id !== id));
      setSuccessMsg('Plano removido.');

    } catch (err: any) {
      console.error("Erro ao apagar:", err);
      const msg = err.response?.data?.error || 'Erro ao remover plano. Verifique a conexão.';
      setErrorMsg(msg);
      // Se falhou, recarrega a lista original para garantir que a interface mostra a verdade
      fetchPlanos();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

      {/* Coluna 1: Formulário */}
      <div className="bg-white p-6 rounded-card shadow-card border border-gray-100 h-fit">
        <div className="text-center md:text-left mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-50 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-orange-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h4 className="text-xl font-bold text-gray-900">
            Plano Preventivo
          </h4>
          <p className="text-sm text-gray-500 mt-1">
            Configure regras de manutenção por KM ou Tempo.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
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
            placeholder="Ex: Troca de Óleo Motor"
            {...register('descricao')}
            error={errors.descricao?.message}
            disabled={isSubmitting}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 text-sm font-medium text-text-secondary">Tipo Intervalo</label>
              <div className="relative">
                <select
                  className="w-full px-4 py-2 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none"
                  {...register('tipoIntervalo')}
                  disabled={isSubmitting}
                >
                  {tiposIntervalo.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <Input
              label={tipoIntervalo === 'KM' ? 'KM' : 'Meses'}
              type="number"
              placeholder={tipoIntervalo === 'KM' ? 'Ex: 10000' : 'Ex: 6'}
              {...register('valorIntervalo')}
              error={errors.valorIntervalo?.message}
              disabled={isSubmitting}
            />
          </div>

          {errors.root && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-error text-sm text-center">
              {errors.root.message}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-error text-sm text-center">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-md bg-green-50 border border-green-200 text-success text-sm text-center font-medium">
              {successMsg}
            </div>
          )}

          <Button
            type="submit"
            className="w-full mt-2"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Plano'}
          </Button>
        </form>
      </div>

      {/* Coluna 2: Lista */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-text flex items-center gap-2">
            Planos Ativos
            <span className="text-xs font-bold px-2 py-1 bg-primary/10 text-primary rounded-full">
              {planos.length}
            </span>
          </h4>
        </div>

        {loadingList && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        <div className="space-y-3 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {!loadingList && planos.length === 0 && (
            <div className={TableStyles.emptyState}>
              <p className="text-sm">Nenhum plano de manutenção criado.</p>
            </div>
          )}

          {planos.map(plano => (
            <div key={plano.id} className="bg-white p-4 rounded-card shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h5 className="font-bold text-text">{plano.descricao}</h5>
                  <p className="text-xs text-text-secondary font-semibold mt-1">
                    {plano.veiculo.placa} • {plano.veiculo.modelo}
                  </p>
                </div>
                <Button
                  variant="danger"
                  className="!p-1.5 h-7 w-7"
                  onClick={() => handleDelete(plano.id)}
                  isLoading={deletingId === plano.id}
                  title="Apagar Plano"
                  icon={<IconeLixo />}
                />
              </div>

              <div className="bg-gray-50 p-2 rounded text-sm text-gray-700 mb-2 inline-block border border-gray-100">
                <span className="font-bold">Regra:</span> A cada {plano.valorIntervalo} {plano.tipoIntervalo === 'KM' ? 'KM' : 'Meses'}
              </div>

              {plano.tipoIntervalo === 'KM' && plano.kmProximaManutencao && (
                <div className="block mt-2 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded w-fit">
                  Próxima: {plano.kmProximaManutencao} KM
                </div>
              )}
              {plano.tipoIntervalo === 'TEMPO' && plano.dataProximaManutencao && (
                <div className="block mt-2 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded w-fit">
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