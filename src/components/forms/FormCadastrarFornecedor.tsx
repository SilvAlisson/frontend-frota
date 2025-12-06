import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../services/api';
import DOMPurify from 'dompurify';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';

// Lista de Tipos (Sincronizada com o enum TipoFornecedor do Prisma)
const tiposFornecedor = ["POSTO", "OFICINA", "LAVA_JATO", "SEGURADORA", "OUTROS"] as const;

// --- 1. SCHEMA ZOD V4 (Com campo 'tipo' adicionado) ---
const fornecedorSchema = z.object({
  nome: z.string({ error: "Nome é obrigatório" })
    .min(2, { error: "Nome deve ter pelo menos 2 caracteres" })
    .transform(val => val.trim().toUpperCase()), // Normalização

  // Aceita string vazia ou undefined
  cnpj: z.string().optional().or(z.literal('')),

  // NOVO CAMPO: Validação usando o Enum com sintaxe Zod V4
  tipo: z.enum(tiposFornecedor, { error: "Selecione a categoria" }).default('OUTROS'),
});

type FornecedorFormValues = z.input<typeof fornecedorSchema>;

interface FormCadastrarFornecedorProps {
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormCadastrarFornecedor({ onSuccess, onCancelar }: FormCadastrarFornecedorProps) {

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FornecedorFormValues>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: {
      nome: '',
      cnpj: '',
      tipo: 'OUTROS', // Adicionar o valor padrão
    },
    mode: 'onBlur'
  });

  // --- 2. SUBMISSÃO COM TOAST PROMISE ---
  const onSubmit = async (data: FornecedorFormValues) => {
    // Tratamento dos dados antes do envio
    const payload = {
      nome: DOMPurify.sanitize(data.nome),
      cnpj: data.cnpj && data.cnpj.trim() !== ''
        ? DOMPurify.sanitize(data.cnpj)
        : null,
      tipo: data.tipo, // O campo 'tipo' agora é enviado
    };

    const promise = api.post('/fornecedor', payload);

    toast.promise(promise, {
      loading: 'Cadastrando parceiro...',
      success: (response) => {
        reset();
        setTimeout(onSuccess, 800); // Delay suave
        return `Fornecedor "${response.data.nome}" cadastrado!`;
      },
      error: (err) => {
        console.error(err);
        return err.response?.data?.error || 'Falha ao cadastrar. Tente novamente.';
      }
    });
  };

  return (
    <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>

      {/* HEADER VISUAL */}
      <div className="text-center relative">
        {/* Detalhe visual sutil */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-blue-200 to-transparent rounded-full" />

        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mb-4 shadow-sm ring-4 ring-white">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72m-13.5 8.65h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
          </svg>
        </div>

        <h4 className="text-2xl font-bold text-gray-900 tracking-tight">
          Novo Fornecedor
        </h4>
        <p className="text-sm text-text-secondary mt-1 max-w-xs mx-auto leading-relaxed">
          Cadastre oficinas, postos de combustível ou prestadores de serviço.
        </p>
      </div>

      <div className="space-y-5 px-1">
        <Input
          label="Nome do Fornecedor / Razão Social"
          placeholder="Ex: POSTO MATRIZ LTDA"
          {...register('nome')}
          error={errors.nome?.message}
          disabled={isSubmitting}
          autoFocus
          className="uppercase font-medium"
        />

        {/* CAMPO DE TIPO (Dropdown) */}
        <div>
          <label className="block mb-1.5 text-sm font-medium text-text-secondary">Categoria</label>
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
          {errors.tipo && <p className="mt-1 text-xs text-error animate-pulse">{errors.tipo.message}</p>}
        </div>

        <Input
          label="CNPJ (Opcional)"
          placeholder="00.000.000/0000-00"
          {...register('cnpj')}
          error={errors.cnpj?.message}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
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
          className="flex-[2] shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          {isSubmitting ? 'Cadastrando...' : 'Confirmar Cadastro'}
        </Button>
      </div>
    </form>
  );
}