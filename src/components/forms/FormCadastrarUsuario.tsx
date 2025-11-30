import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../services/api';
import DOMPurify from 'dompurify';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// --- ZOD V4 SCHEMA ---
const usuarioSchema = z.object({
  nome: z.string().min(3, { error: "Nome deve ter pelo menos 3 caracteres" }),
  email: z.string().email({ error: "Email inválido" }),
  password: z.string().min(6, { error: "A senha deve ter no mínimo 6 caracteres" }),
  // Union limpo para Zod v4
  matricula: z.union([z.string().optional(), z.literal('')]),
  role: z.enum(["OPERADOR", "ENCARREGADO", "ADMIN"]),
});

type UsuarioForm = z.infer<typeof usuarioSchema>;

interface FormCadastrarUsuarioProps {
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormCadastrarUsuario({ onSuccess, onCancelar }: FormCadastrarUsuarioProps) {

  const [successMsg, setSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<UsuarioForm>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      nome: '',
      email: '',
      password: '',
      matricula: '',
      role: 'OPERADOR'
    }
  });

  const onSubmit = async (data: UsuarioForm) => {
    setSuccessMsg('');
    try {
      await api.post('/user/register', {
        nome: DOMPurify.sanitize(data.nome),
        email: DOMPurify.sanitize(data.email),
        password: data.password,
        matricula: data.matricula && data.matricula.trim() !== ''
          ? DOMPurify.sanitize(data.matricula)
          : null,
        role: data.role,
      });

      setSuccessMsg('Integrante cadastrado com sucesso!');
      reset();

      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error("Erro ao cadastrar usuário:", err);
      if (err.response?.data?.error) {
        setError('root', { message: err.response.data.error });
      } else {
        setError('root', { message: 'Falha ao cadastrar usuário.' });
      }
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-indigo-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
        </div>
        <h4 className="text-xl font-bold text-primary">
          Novo Colaborador
        </h4>
        <p className="text-sm text-text-secondary mt-1">
          Crie o acesso para um motorista ou gestor.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Input
            label="Nome Completo"
            placeholder="Ex: João da Silva"
            {...register('nome')}
            error={errors.nome?.message}
            disabled={isSubmitting}
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="joao@empresa.com"
          {...register('email')}
          error={errors.email?.message}
          disabled={isSubmitting}
        />

        <Input
          label="Senha Inicial"
          type="password"
          placeholder="******"
          {...register('password')}
          error={errors.password?.message}
          disabled={isSubmitting}
        />

        <Input
          label="Matrícula (Opcional)"
          placeholder="Ex: 12345"
          {...register('matricula')}
          error={errors.matricula?.message}
          disabled={isSubmitting}
        />

        <div>
          <label className="block mb-1.5 text-sm font-medium text-text-secondary">Função</label>
          <div className="relative">
            <select
              className="w-full px-4 py-2 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none"
              {...register('role')}
              disabled={isSubmitting}
            >
              <option value="OPERADOR">Motorista (Operador)</option>
              <option value="ENCARREGADO">Gestor (Encarregado)</option>
              <option value="ADMIN">Administrador</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          {errors.role && <p className="text-xs text-error mt-1">{errors.role.message}</p>}
        </div>
      </div>

      {errors.root && (
        <div className="flex items-center gap-3 p-3 rounded-md bg-red-50 border border-red-200 text-error text-sm animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          <span>{errors.root.message}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 p-3 rounded-md bg-green-50 border border-green-200 text-success text-sm font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      <div className="flex gap-3 pt-2">
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
          className="flex-1"
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          Cadastrar
        </Button>
      </div>
    </form>
  );
}