import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { RENDER_API_BASE_URL } from '../../config';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// 1. Definição do Schema de Validação com Zod
const fornecedorSchema = z.object({
  nome: z.string().min(1, 'O Nome é obrigatório.'),
  cnpj: z.string().optional(), // Opcional, mas podemos adicionar regex se quiser: .regex(/^\d{14}$/, 'CNPJ inválido')
});

// Inferência do tipo TypeScript a partir do schema (Magia do Zod!)
type FornecedorFormData = z.infer<typeof fornecedorSchema>;

interface FormCadastrarFornecedorProps {
  token: string;
  onFornecedorAdicionado: () => void;
  onCancelar: () => void;
}

export function FormCadastrarFornecedor({ token, onFornecedorAdicionado, onCancelar }: FormCadastrarFornecedorProps) {

  // 2. Configuração do React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: {
      nome: '',
      cnpj: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(''); // Erro que vem da API, não de validação

  // 3. Função de Submissão (Só é chamada se a validação do Zod passar)
  const onSubmit = async (data: FornecedorFormData) => {
    setLoading(true);
    setServerError('');

    const api = axios.create({
      baseURL: RENDER_API_BASE_URL,
      headers: { 'Authorization': `Bearer ${token}` }
    });

    try {
      await api.post('/fornecedor', {
        nome: DOMPurify.sanitize(data.nome),
        cnpj: data.cnpj ? DOMPurify.sanitize(data.cnpj) : null,
      });

      onFornecedorAdicionado();

    } catch (err) {
      console.error("Erro ao cadastrar fornecedor:", err);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setServerError(err.response.data.error);
      } else {
        setServerError('Falha ao cadastrar fornecedor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

      {/* CABEÇALHO COM ÍCONE (Inalterado) */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72m-13.5 8.65h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
          </svg>
        </div>
        <h4 className="text-xl font-bold text-primary">
          Novo Fornecedor
        </h4>
        <p className="text-sm text-text-secondary mt-1">Cadastre um posto ou oficina parceira.</p>
      </div>

      {/* CAMPOS */}
      <div className="space-y-4">
        <Input
          label="Nome do Fornecedor"
          type="text"
          placeholder="Ex: Posto Quarto de Milha"
          disabled={loading}
          // 4. Integração com Hook Form
          {...register('nome')}
          // O componente Input já deve estar preparado para receber a prop 'error'
          error={errors.nome?.message}
        />

        <Input
          label="CNPJ (Opcional)"
          type="text"
          placeholder="00.000.000/0000-00"
          disabled={loading}
          {...register('cnpj')}
          error={errors.cnpj?.message}
        />
      </div>

      {/* MENSAGEM DE ERRO DO SERVIDOR */}
      {serverError && (
        <div className="flex items-center gap-3 p-3 rounded-md bg-red-50 border border-red-200 text-error text-sm animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          <span>{serverError}</span>
        </div>
      )}

      {/* BOTÕES */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          disabled={loading}
          onClick={onCancelar}
        >
          Cancelar
        </Button>

        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          disabled={loading}
          isLoading={loading}
        >
          {loading ? 'Salvando...' : 'Salvar Fornecedor'}
        </Button>
      </div>
    </form>
  );
}