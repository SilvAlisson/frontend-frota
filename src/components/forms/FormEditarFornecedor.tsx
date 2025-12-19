import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import DOMPurify from 'dompurify';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';

const tiposFornecedor = ["POSTO", "OFICINA", "LAVA_JATO", "SEGURADORA", "OUTROS"] as const;

// --- SCHEMA ZOD V4 ---
const fornecedorSchema = z.object({
  nome: z.string({ error: 'O Nome é obrigatório.' })
    .min(2, { error: 'O nome deve ter pelo menos 2 caracteres.' })
    .transform(val => val.trim().toUpperCase()),

  cnpj: z.union([
    z.literal(''),
    z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
      error: "Formato inválido: 00.000.000/0000-00"
    })
  ]).optional().nullable(),

  tipo: z.enum(tiposFornecedor, { error: "Selecione um tipo válido" })
    .default('OUTROS'),
});

type FornecedorInput = z.input<typeof fornecedorSchema>;
type FornecedorOutput = z.output<typeof fornecedorSchema>;

interface Props {
  fornecedorId: string;
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormEditarFornecedor({ fornecedorId, onSuccess, onCancelar }: Props) {
  const [loadingData, setLoadingData] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FornecedorInput, any, FornecedorOutput>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: { nome: '', cnpj: '', tipo: 'OUTROS' },
    mode: 'onBlur'
  });

  // --- CARREGAMENTO INICIAL ---
  useEffect(() => {
    if (!fornecedorId) return;

    const fetchDados = async () => {
      try {
        // CORREÇÃO: Rota no plural
        const { data } = await api.get(`/fornecedores/${fornecedorId}`);

        const tipoValido = tiposFornecedor.includes(data.tipo)
          ? data.tipo
          : 'OUTROS';

        reset({
          nome: data.nome || '',
          cnpj: data.cnpj || '',
          tipo: tipoValido
        });
      } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar dados do fornecedor.');
        onCancelar();
      } finally {
        setLoadingData(false);
      }
    };

    fetchDados();
  }, [fornecedorId, reset, onCancelar]);

  // --- SUBMISSÃO ---
  const onSubmit = async (data: FornecedorOutput) => {
    const payload = {
      nome: DOMPurify.sanitize(data.nome),
      cnpj: data.cnpj && data.cnpj.trim() !== ''
        ? DOMPurify.sanitize(data.cnpj)
        : null,
      tipo: data.tipo,
    };

    // CORREÇÃO: Rota no plural
    const promise = api.put(`/fornecedores/${fornecedorId}`, payload);

    toast.promise(promise, {
      loading: 'Atualizando cadastro...',
      success: () => {
        setTimeout(onSuccess, 800);
        return 'Fornecedor atualizado com sucesso!';
      },
      error: (err) => {
        console.error("Erro API:", err);
        return err.response?.data?.error || 'Falha ao atualizar. Verifique os dados.';
      }
    });
  };

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-100 border-t-blue-600"></div>
        <p className="text-sm text-gray-500 font-medium animate-pulse">Sincronizando dados...</p>
      </div>
    );
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>

      <div className="text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-blue-200 to-transparent rounded-full" />
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mb-4 shadow-sm ring-4 ring-white">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
        </div>
        <h4 className="text-2xl font-bold text-gray-900 tracking-tight">Editar Fornecedor</h4>
        <p className="text-sm text-text-secondary mt-1 max-w-xs mx-auto leading-relaxed">
          Atualize as informações cadastrais do parceiro.
        </p>
      </div>

      <div className="space-y-5 px-1">
        <Input
          label="Nome do Fornecedor"
          placeholder="Nome do estabelecimento"
          {...register('nome')}
          error={errors.nome?.message}
          disabled={isSubmitting}
          className="uppercase font-medium"
        />

        {/* SELECT DE TIPO */}
        <div>
          <label className="block mb-1.5 text-sm font-bold text-gray-500">Categoria</label>
          <div className="relative group">
            <select
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-input appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow cursor-pointer hover:border-gray-400"
              {...register('tipo')}
              disabled={isSubmitting}
            >
              <option value="POSTO">Posto de Combustível</option>
              <option value="OFICINA">Oficina Mecânica</option>
              <option value="LAVA_JATO">Lava Jato</option>
              <option value="SEGURADORA">Seguradora</option>
              <option value="OUTROS">Outros Serviços</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          {errors.tipo && <p className="text-xs text-red-500 mt-1 animate-pulse">{errors.tipo.message}</p>}
        </div>

        <Input
          label="CNPJ (Opcional)"
          placeholder="00.000.000/0000-00"
          {...register('cnpj')}
          error={errors.cnpj?.message}
          disabled={isSubmitting}
        />
        <p className="text-[10px] text-gray-400 pl-1 -mt-3">
          Se preenchido, use o formato: 00.000.000/0000-00
        </p>
      </div>

      <div className="flex gap-3 pt-6 border-t border-gray-100 mt-6">
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
          className="flex-[2] shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </form>
  );
}