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

// --- SCHEMA ---
const fornecedorSchema = z.object({
  nome: z.string({ error: 'O Nome é obrigatório.' })
    .min(2, { message: 'Mínimo de 2 caracteres.' })
    .transform(val => val.trim().toUpperCase()),

  cnpj: z.union([
    z.literal(''),
    z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
      message: "Formato: 00.000.000/0000-00"
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
        const { data } = await api.get(`/fornecedores/${fornecedorId}`);
        const tipoValido = tiposFornecedor.includes(data.tipo) ? data.tipo : 'OUTROS';

        reset({
          nome: data.nome || '',
          cnpj: data.cnpj || '',
          tipo: tipoValido
        });
      } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar dados.');
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
      cnpj: data.cnpj && data.cnpj.trim() !== '' ? DOMPurify.sanitize(data.cnpj) : null,
      tipo: data.tipo,
    };

    const promise = api.put(`/fornecedores/${fornecedorId}`, payload);

    toast.promise(promise, {
      loading: 'Atualizando cadastro...',
      success: () => {
        setTimeout(onSuccess, 500);
        return 'Parceiro atualizado!';
      },
      error: (err) => {
        console.error(err);
        return err.response?.data?.error || 'Falha ao atualizar.';
      }
    });
  };

  // --- ESTILOS ---
  const labelStyle = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1";
  const selectStyle = "w-full h-10 px-3 bg-white border border-border rounded-input text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer placeholder:text-gray-400 disabled:bg-gray-50";

  if (loadingData) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-border p-12 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary"></div>
        <p className="text-sm text-gray-400 font-medium mt-4 animate-pulse">Buscando informações...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-border overflow-hidden">

      {/* HEADER */}
      <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Editar Parceiro</h3>
          <p className="text-xs text-gray-500">Atualize os dados cadastrais.</p>
        </div>
        <div className="p-2 bg-white rounded-lg border border-border shadow-sm text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72L4.318 3.44A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72m-13.5 8.65h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .415.336.75.75.75Z" />
          </svg>
        </div>
      </div>

      <form className="p-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>

        {/* Nome */}
        <div>
          <label className={labelStyle}>Razão Social / Nome</label>
          <Input
            {...register('nome')}
            placeholder="Ex: AUTO CENTER LTDA"
            error={errors.nome?.message}
            disabled={isSubmitting}
            className="uppercase font-medium"
          />
        </div>

        {/* Categoria e CNPJ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelStyle}>Categoria</label>
            <div className="relative">
              <select {...register('tipo')} className={selectStyle} disabled={isSubmitting}>
                {tiposFornecedor.map(t => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            {errors.tipo && <p className="text-xs text-red-500 mt-1 ml-1">{errors.tipo.message}</p>}
          </div>

          <div>
            <label className={labelStyle}>CNPJ (Opcional)</label>
            <Input
              {...register('cnpj')}
              placeholder="00.000.000/0000-00"
              error={errors.cnpj?.message}
              disabled={isSubmitting}
            />
            {/* [CORREÇÃO] Texto de ajuda restaurado */}
            <p className="text-[10px] text-gray-400 pl-1 mt-1">
              Formato sugerido: 00.000.000/0000-00
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex gap-3 pt-6 border-t border-border mt-2">
          <Button
            type="button"
            variant="ghost"
            className="flex-1 text-gray-500"
            onClick={onCancelar}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-[2] shadow-lg shadow-primary/20"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            icon={<span>💾</span>}
          >
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}