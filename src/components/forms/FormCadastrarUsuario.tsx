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

// Tipos e Constantes
interface Cargo { id: string; nome: string; }
const ROLES = ["OPERADOR", "ENCARREGADO", "ADMIN", "RH", "COORDENADOR"] as const;

// Schema de Validação
const usuarioSchema = z.object({
  nome: z.string().min(3, "Nome muito curto").transform(val => val.trim()),
  email: z.string().email("Email inválido").toLowerCase(),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  matricula: z.string().optional().or(z.literal('')),
  role: z.enum(ROLES, { error: "Função inválida" }),

  // Campos RH (Opcionais/Condicionais)
  cargoId: z.string().optional().or(z.literal('')),
  cnhNumero: z.string().optional().or(z.literal('')),
  cnhCategoria: z.string().optional().or(z.literal('')),
  cnhValidade: z.string().optional().or(z.literal('')),
  dataAdmissao: z.string().optional().or(z.literal('')),
});

type UsuarioFormInput = z.input<typeof usuarioSchema>;

interface FormProps {
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormCadastrarUsuario({ onSuccess, onCancelar }: FormProps) {
  // Estados Locais
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Busca de Cargos
  const { data: cargos = [] } = useQuery<Cargo[]>({
    queryKey: ['cargos-select'],
    queryFn: async () => {
      const response = await api.get('/cargos');
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<UsuarioFormInput>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      role: 'OPERADOR',
      cargoId: '',
      cnhNumero: '',
      cnhCategoria: '',
      cnhValidade: '',
      dataAdmissao: '',
      matricula: ''
    },
    mode: 'onBlur' // [CORREÇÃO 1: UX] Validação ao sair do campo
  });

  const roleSelecionada = watch('role');

  // Handler de Arquivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Submit Principal
  const onSubmit = async (data: UsuarioFormInput) => {
    let finalFotoUrl = null;

    // 1. Upload da Foto (se houver)
    if (fotoFile) {
      try {
        const fileExt = fotoFile.name.split('.').pop();
        const fileName = `perfil-${Date.now()}.${fileExt}`;
        const { data: uploadData, error } = await supabase.storage
          .from('fotos-frota')
          .upload(`perfis/${fileName}`, fotoFile);

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from('fotos-frota')
          .getPublicUrl(uploadData.path);

        finalFotoUrl = publicUrlData.publicUrl;
      } catch (err) {
        console.error("Erro upload:", err);
        toast.error("Falha ao enviar foto de perfil.");
        return; // Para o processo se a foto falhar
      }
    }

    // 2. Montagem do Payload
    const isOp = data.role === 'OPERADOR';
    const payload = {
      ...data,
      nome: DOMPurify.sanitize(data.nome),
      email: DOMPurify.sanitize(data.email),
      matricula: data.matricula ? DOMPurify.sanitize(data.matricula) : null,
      fotoUrl: finalFotoUrl,
      // Limpeza condicional
      cargoId: isOp && data.cargoId ? data.cargoId : null,
      cnhNumero: isOp && data.cnhNumero ? data.cnhNumero : null,
      cnhCategoria: isOp && data.cnhCategoria ? data.cnhCategoria : null,
      cnhValidade: isOp && data.cnhValidade ? new Date(data.cnhValidade).toISOString() : null,
      dataAdmissao: data.dataAdmissao ? new Date(data.dataAdmissao).toISOString() : null,
    };

    // 3. Envio para API
    const promise = api.post('/users/register', payload);

    toast.promise(promise, {
      loading: 'Criando conta...',
      success: () => {
        reset();
        setFotoFile(null);
        setPreviewUrl(null);
        setTimeout(onSuccess, 500);
        return 'Colaborador cadastrado com sucesso!';
      },
      error: (err) => {
        console.error(err);
        return err.response?.data?.error || 'Erro ao cadastrar. Verifique o email.';
      }
    });
  };

  // Estilos Auxiliares
  const labelStyle = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1";
  const selectStyle = "w-full h-10 px-3 bg-white border border-border rounded-input text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer placeholder:text-gray-400 disabled:bg-gray-50";

  return (
    <div className="bg-white rounded-xl shadow-lg border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-300">

      {/* Header */}
      <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Novo Colaborador</h3>
          <p className="text-xs text-gray-500">Cadastro de acesso e perfil profissional.</p>
        </div>
        <div className="p-2 bg-white rounded-lg border border-border shadow-sm text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6">

        {/* Avatar Upload */}
        <div className="flex justify-center mb-8">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 rounded-full bg-background border-4 border-white shadow-md cursor-pointer hover:scale-105 transition-all relative group overflow-hidden ring-1 ring-border"
            title="Alterar foto de perfil"
          >
            {previewUrl ? (
              <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" /></svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className={labelStyle}>Nome Completo</label>
            <Input
              {...register('nome')}
              placeholder="Ex: João da Silva"
              error={errors.nome?.message}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className={labelStyle}>E-mail Corporativo</label>
            <Input
              type="email"
              {...register('email')}
              placeholder="nome@empresa.com"
              error={errors.email?.message}
              disabled={isSubmitting}
            />
          </div>

          <div className="relative">
            <label className={labelStyle}>Senha Inicial</label>
            <Input
              type="password"
              {...register('password')}
              placeholder="******"
              error={errors.password?.message}
              disabled={isSubmitting}
            />
            <span className="absolute right-0 top-0 text-[10px] text-gray-400 font-medium px-2 py-1 opacity-60">Mín. 6 dígitos</span>
          </div>

          <div>
            <label className={labelStyle}>Matrícula</label>
            <Input
              {...register('matricula')}
              placeholder="12345"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className={labelStyle}>Função / Perfil</label>
            <div className="relative">
              <select {...register('role')} className={selectStyle} disabled={isSubmitting}>
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase().replace('_', ' ')}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Seção RH Condicional */}
        {roleSelecionada === 'OPERADOR' && (
          <div className="mt-6 bg-blue-50/50 p-5 rounded-xl border border-blue-100 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-4 border-b border-blue-100/50 pb-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <h4 className="text-xs font-bold text-blue-800 uppercase tracking-widest">Dados do Motorista</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelStyle}>Cargo</label>
                <div className="relative">
                  <select {...register('cargoId')} className={selectStyle} disabled={isSubmitting}>
                    <option value="">Selecione o cargo...</option>
                    {cargos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelStyle}>Nº CNH</label>
                <Input {...register('cnhNumero')} placeholder="Registro" disabled={isSubmitting} className="bg-white" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelStyle}>Categoria</label>
                  <Input {...register('cnhCategoria')} placeholder="AE" className="text-center uppercase" maxLength={2} disabled={isSubmitting} />
                </div>
                <div>
                  <label className={labelStyle}>Validade</label>
                  <Input type="date" {...register('cnhValidade')} disabled={isSubmitting} className="bg-white" />
                </div>
              </div>

              {/* [CORREÇÃO 2] Campo de Data de Admissão Restaurado */}
              <div className="md:col-span-2">
                <label className={labelStyle}>Data de Admissão</label>
                <Input type="date" {...register('dataAdmissao')} disabled={isSubmitting} className="bg-white" />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-5 border-t border-border flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancelar}
            disabled={isSubmitting}
            className="text-gray-500"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="shadow-lg shadow-primary/20 px-6"
            icon={<span>👤</span>}
            disabled={isSubmitting}
          >
            Cadastrar Colaborador
          </Button>
        </div>

      </form>
    </div>
  );
}