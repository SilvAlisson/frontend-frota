import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../services/api';
import DOMPurify from 'dompurify';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// 1. Schema Zod
const editarUsuarioSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  matricula: z.string().optional(),
  role: z.enum(['OPERADOR', 'ENCARREGADO', 'ADMIN']),

  password: z.string().optional().refine(val => !val || val.length >= 6, {
    message: "A nova senha deve ter no mínimo 6 caracteres"
  })
});

type EditarUsuarioForm = z.infer<typeof editarUsuarioSchema>;

interface FormEditarUsuarioProps {
  userId: string;
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormEditarUsuario({ userId, onSuccess, onCancelar }: FormEditarUsuarioProps) {

  const [loadingData, setLoadingData] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  // 2. React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<EditarUsuarioForm>({
    // CORREÇÃO: 'as any' para compatibilidade de tipos
    resolver: zodResolver(editarUsuarioSchema) as any,
    defaultValues: {
      nome: '',
      email: '',
      matricula: '',
      role: 'ENCARREGADO',
      password: ''
    }
  });

  // 3. Carregar dados
  useEffect(() => {
    if (!userId) return;

    const fetchUsuario = async () => {
      setLoadingData(true);
      try {
        const response = await api.get(`/user/${userId}`);
        const user = response.data;

        // Verifica se o role vindo do banco é válido, senão define um padrão
        const roleValida = ['OPERADOR', 'ENCARREGADO', 'ADMIN'].includes(user.role)
          ? user.role
          : 'ENCARREGADO';

        reset({
          nome: user.nome || '',
          email: user.email || '',
          matricula: user.matricula || '',
          role: roleValida,
          password: ''
        });

      } catch (err) {
        console.error("Erro ao buscar dados do usuário:", err);
        setError('root', { message: 'Falha ao carregar os dados do colaborador.' });
      } finally {
        setLoadingData(false);
      }
    };

    fetchUsuario();
  }, [userId, reset, setError]);


  // 4. Submit
  const onSubmit: SubmitHandler<EditarUsuarioForm> = async (data) => {
    setSuccessMsg('');
    try {
      const dataToUpdate: any = {
        nome: DOMPurify.sanitize(data.nome),
        email: DOMPurify.sanitize(data.email),
        matricula: data.matricula ? DOMPurify.sanitize(data.matricula) : null,
        role: data.role,
      };

      // Só envia a senha se ela foi preenchida
      if (data.password && data.password.trim() !== '') {
        dataToUpdate.password = data.password;
      }

      await api.put(`/user/${userId}`, dataToUpdate);

      setSuccessMsg('Utilizador atualizado com sucesso!');

      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error("Erro ao atualizar usuário:", err);
      if (err.response?.data?.error) {
        setError('root', { message: err.response.data.error });
      } else {
        setError('root', { message: 'Falha ao atualizar usuário.' });
      }
    }
  };

  // Loading State Visual
  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-text-secondary">A carregar dados do colaborador...</p>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-indigo-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
        </div>
        <h4 className="text-xl font-bold text-primary">
          Editar Colaborador
        </h4>
        <p className="text-sm text-text-secondary mt-1">
          Atualize os dados de acesso e perfil.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Input
            label="Nome Completo"
            {...register('nome')}
            error={errors.nome?.message}
            disabled={isSubmitting}
          />
        </div>

        <Input
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          disabled={isSubmitting}
        />

        <Input
          label="Matrícula (Opcional)"
          {...register('matricula')}
          error={errors.matricula?.message}
          disabled={isSubmitting}
        />

        <Input
          label="Nova Senha"
          type="password"
          placeholder="(Deixe em branco para manter)"
          {...register('password')}
          error={errors.password?.message}
          disabled={isSubmitting}
        />

        {/* Select Customizado */}
        <div>
          <label className="block mb-1.5 text-sm font-medium text-text-secondary">Função (Role)</label>
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
          {errors.role && <p className="mt-1 text-xs text-error">{errors.role.message}</p>}
        </div>
      </div>

      {/* FEEDBACK ERRO */}
      {errors.root && (
        <div className="flex items-center gap-3 p-3 rounded-md bg-red-50 border border-red-200 text-error text-sm animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          <span>{errors.root.message}</span>
        </div>
      )}

      {/* FEEDBACK SUCESSO */}
      {successMsg && (
        <div className="p-3 bg-green-50 text-success border border-green-200 rounded text-center text-sm font-medium">
          {successMsg}
        </div>
      )}

      {/* BOTÕES */}
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
          {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </form>
  );
}