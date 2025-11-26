import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../../services/api';
import DOMPurify from 'dompurify';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// Definimos as roles explicitamente para o Zod
const usuarioSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  matricula: z.string().optional(),
  // CORREÇÃO: Removido errorMap e definido valores explicitamente para evitar erro de overload
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
    // CORREÇÃO: 'as any' resolve incompatibilidades de versão entre Zod/RHF
    resolver: zodResolver(usuarioSchema) as any,
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
      await api.post('/auth/register', {
        nome: DOMPurify.sanitize(data.nome),
        email: DOMPurify.sanitize(data.email),
        password: data.password,
        matricula: data.matricula ? DOMPurify.sanitize(data.matricula) : null,
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
        <h4 className="text-xl font-bold text-primary">Novo Colaborador</h4>
        <p className="text-sm text-text-secondary mt-1">Crie o acesso para um motorista ou gestor.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Input label="Nome Completo" {...register('nome')} error={errors.nome?.message} disabled={isSubmitting} />
        </div>

        <Input label="Email" type="email" {...register('email')} error={errors.email?.message} disabled={isSubmitting} />

        <Input label="Senha Inicial" type="password" {...register('password')} error={errors.password?.message} disabled={isSubmitting} />

        <Input label="Matrícula (Opcional)" {...register('matricula')} error={errors.matricula?.message} disabled={isSubmitting} />

        <div>
          <label className="block mb-1.5 text-sm font-medium text-text-secondary">Função</label>
          <div className="relative">
            <select
              className="w-full px-4 py-2 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary"
              {...register('role')}
              disabled={isSubmitting}
            >
              <option value="OPERADOR">Motorista (Operador)</option>
              <option value="ENCARREGADO">Gestor (Encarregado)</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          {errors.role && <p className="text-xs text-error mt-1">{errors.role.message}</p>}
        </div>
      </div>

      {errors.root && <p className="text-error text-sm text-center bg-red-50 p-2 rounded">{errors.root.message}</p>}
      {successMsg && <p className="text-success text-sm text-center bg-green-50 p-2 rounded">{successMsg}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" disabled={isSubmitting} onClick={onCancelar}>Cancelar</Button>
        <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting} isLoading={isSubmitting}>Cadastrar</Button>
      </div>
    </form>
  );
}