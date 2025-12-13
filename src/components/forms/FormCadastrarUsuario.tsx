import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { supabase } from '../../supabaseClient';
import DOMPurify from 'dompurify';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

// Interface para Cargo
interface Cargo {
  id: string;
  nome: string;
}

const ROLES = ["OPERADOR", "ENCARREGADO", "ADMIN", "RH", "COORDENADOR"] as const;

// --- SCHEMA ZOD V4 ---
const usuarioSchema = z.object({
  nome: z.string({ error: "Nome é obrigatório" })
    .min(3, { error: "Nome muito curto (mín. 3 letras)" })
    .transform(val => val.trim()),

  // V4: z.email() agora é top-level (substitui z.string().email())
  // Isso já valida que é string, que não é vazio e o formato do email.
  email: z.email({ error: "Email inválido ou obrigatório" })
    .toLowerCase(),

  password: z.string({ error: "Senha é obrigatória" })
    .min(6, { error: "A senha deve ter no mínimo 6 caracteres" }),

  matricula: z.string().optional().or(z.literal('')),

  role: z.enum(ROLES, {
    error: "Selecione uma função válida"
  }),

  // Campos condicionais (RH)
  // .or(z.literal('')) permite lidar com inputs vazios do HTML que o react-hook-form envia
  cargoId: z.string().optional().or(z.literal('')),
  cnhNumero: z.string().optional().or(z.literal('')),
  cnhCategoria: z.string().optional().or(z.literal('')),
  cnhValidade: z.string().optional().or(z.literal('')),
  dataAdmissao: z.string().optional().or(z.literal('')),
});

type UsuarioFormInput = z.input<typeof usuarioSchema>;

interface FormCadastrarUsuarioProps {
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormCadastrarUsuario({ onSuccess, onCancelar }: FormCadastrarUsuarioProps) {
  // Estados para Foto
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: cargos = [], isLoading: isLoadingCargos } = useQuery<Cargo[]>({
    queryKey: ['cargos-select'],
    queryFn: async () => {
      const response = await api.get('/cargos');
      return response.data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<UsuarioFormInput>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      nome: '', email: '', password: '', matricula: '', role: 'OPERADOR',
      cargoId: '', cnhNumero: '', cnhCategoria: '', cnhValidade: '', dataAdmissao: ''
    },
    mode: 'onBlur'
  });

  const roleSelecionada = watch('role');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: UsuarioFormInput) => {
    let finalFotoUrl = null;

    // 1. Upload da Foto (se houver)
    if (fotoFile) {
      try {
        const fileExt = fotoFile.name.split('.').pop();
        const fileName = `perfil-${Date.now()}.${fileExt}`;
        const filePath = `perfis/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('fotos-frota')
          .upload(filePath, fotoFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('fotos-frota')
          .getPublicUrl(uploadData.path);

        finalFotoUrl = publicUrlData.publicUrl;
      } catch (err) {
        console.error("Erro no upload:", err);
        toast.error("Erro ao enviar foto. Tente novamente.");
        return;
      }
    }

    // 2. Prepara Payload
    const isOperador = data.role === 'OPERADOR';

    const payload = {
      nome: DOMPurify.sanitize(data.nome),
      email: DOMPurify.sanitize(data.email),
      password: data.password,
      matricula: data.matricula ? DOMPurify.sanitize(data.matricula) : null,
      role: data.role,
      fotoUrl: finalFotoUrl, // Novo campo

      // Envia null se não for operador ou se o campo estiver vazio
      cargoId: isOperador && data.cargoId ? data.cargoId : null,
      cnhNumero: isOperador && data.cnhNumero ? data.cnhNumero : null,
      cnhCategoria: isOperador && data.cnhCategoria ? data.cnhCategoria : null,
      cnhValidade: isOperador && data.cnhValidade ? new Date(data.cnhValidade).toISOString() : null,
      dataAdmissao: data.dataAdmissao ? new Date(data.dataAdmissao).toISOString() : null,
    };

    const promise = api.post('/user/register', payload);

    toast.promise(promise, {
      loading: 'Criando credenciais...',
      success: () => {
        reset();
        setFotoFile(null);
        setPreviewUrl(null);
        setTimeout(onSuccess, 800);
        return 'Colaborador cadastrado com sucesso!';
      },
      error: (err) => {
        console.error("Erro ao cadastrar usuário:", err);
        return err.response?.data?.error || 'Erro ao cadastrar. Verifique o email.';
      }
    });
  };

  const getRoleLabel = (role: typeof ROLES[number]) => {
    switch (role) {
      case 'OPERADOR': return 'Motorista (Operador)';
      case 'ENCARREGADO': return 'Gestor de Frota (Encarregado)';
      case 'RH': return 'Recursos Humanos (RH)';
      case 'COORDENADOR': return 'Coordenador Geral';
      case 'ADMIN': return 'Administrador do Sistema';
      default: return role;
    }
  };

  return (
    <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>

      <div className="text-center relative">

        {/* Avatar Uploader */}
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />

        <div className="flex flex-col items-center mb-4">
          <div
            className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-lg cursor-pointer hover:opacity-90 transition-all relative group overflow-hidden mb-3 ring-2 ring-indigo-50"
            onClick={() => fileInputRef.current?.click()}
            title="Clique para adicionar foto"
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                </svg>
              </div>
            )}

            {/* Overlay de Câmera */}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
            </div>
          </div>
        </div>

        <h4 className="text-2xl font-bold text-gray-900 tracking-tight">
          Novo Colaborador
        </h4>
        <p className="text-sm text-text-secondary mt-1 max-w-xs mx-auto leading-relaxed">
          Crie o acesso para motoristas, gestores ou equipe administrativa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-1">
        <div className="md:col-span-2">
          <Input label="Nome Completo" placeholder="Ex: João da Silva" {...register('nome')} error={errors.nome?.message} disabled={isSubmitting} autoFocus />
        </div>

        <Input label="Email Corporativo" type="email" placeholder="joao@empresa.com" {...register('email')} error={errors.email?.message} disabled={isSubmitting} />

        <div className="relative group">
          <Input label="Senha Inicial" type="password" placeholder="******" {...register('password')} error={errors.password?.message} disabled={isSubmitting} />
          <span className="absolute right-0 top-0 text-[10px] text-gray-400 font-medium px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">Mín. 6 dígitos</span>
        </div>

        <Input label="Matrícula (Opcional)" placeholder="Ex: 12345" {...register('matricula')} error={errors.matricula?.message} disabled={isSubmitting} />

        <div>
          <label className="block mb-1.5 text-sm font-medium text-text-secondary">Função / Perfil</label>
          <div className="relative">
            <select className="w-full px-4 py-2.5 text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none transition-all shadow-sm cursor-pointer hover:border-gray-400" {...register('role')} disabled={isSubmitting}>
              {ROLES.map((role) => <option key={role} value={role}>{getRoleLabel(role)}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
          </div>
          {errors.role && <p className="text-xs text-error mt-1 animate-pulse">{errors.role.message}</p>}
        </div>
      </div>

      {/* SEÇÃO RH (CONDICIONAL) */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${roleSelecionada === 'OPERADOR' ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-50'}`}>
        <div className="mt-6 pt-6 border-t border-dashed border-gray-200">
          <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Dados Funcionais (RH)
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100 transition-colors hover:border-indigo-100">
            <div className="md:col-span-2">
              <label className="block mb-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Cargo / Função</label>
              <div className="relative">
                <select className="w-full px-4 py-2 text-sm text-text bg-white border border-gray-300 rounded-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 appearance-none transition-all shadow-sm" {...register('cargoId')} disabled={isSubmitting || isLoadingCargos}>
                  <option value="">Selecione o cargo...</option>
                  {cargos.map((cargo) => <option key={cargo.id} value={cargo.id}>{cargo.nome}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
              </div>
            </div>
            <div className="md:col-span-1"><Input label="Nº CNH" placeholder="Registro CNH" {...register('cnhNumero')} disabled={isSubmitting} className="bg-white" /></div>
            <div className="md:col-span-1">
              <div className="grid grid-cols-2 gap-2">
                <Input label="Categoria" placeholder="AE" {...register('cnhCategoria')} disabled={isSubmitting} className="bg-white text-center uppercase" maxLength={2} />
                <Input label="Validade CNH" type="date" {...register('cnhValidade')} disabled={isSubmitting} className="bg-white" />
              </div>
            </div>
            <div className="md:col-span-2"><Input label="Data de Admissão" type="date" {...register('dataAdmissao')} disabled={isSubmitting} className="bg-white" /></div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-6 border-t border-gray-100">
        <Button type="button" variant="secondary" className="flex-1" disabled={isSubmitting} onClick={onCancelar}>Cancelar</Button>
        <Button type="submit" variant="primary" className="flex-[2] shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all" disabled={isSubmitting} isLoading={isSubmitting}>
          {isSubmitting ? 'Registrando...' : 'Cadastrar Colaborador'}
        </Button>
      </div>
    </form>
  );
}