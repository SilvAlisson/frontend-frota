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
import { UserPlus, Camera, Calendar, CreditCard, ChevronDown, User, Briefcase } from 'lucide-react';

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
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: cargos = [] } = useQuery<Cargo[]>({
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
        return;
      }
    }

    const isOp = data.role === 'OPERADOR';
    const payload = {
      ...data,
      nome: DOMPurify.sanitize(data.nome),
      email: DOMPurify.sanitize(data.email),
      matricula: data.matricula ? DOMPurify.sanitize(data.matricula) : null,
      fotoUrl: finalFotoUrl,
      cargoId: isOp && data.cargoId ? data.cargoId : null,
      cnhNumero: isOp && data.cnhNumero ? data.cnhNumero : null,
      cnhCategoria: isOp && data.cnhCategoria ? data.cnhCategoria : null,
      cnhValidade: isOp && data.cnhValidade ? new Date(data.cnhValidade).toISOString() : null,
      dataAdmissao: data.dataAdmissao ? new Date(data.dataAdmissao).toISOString() : null,
    };

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

  // Classes utilitárias
  const labelStyle = "block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 ml-1";
  const selectStyle = "w-full h-11 px-3 bg-surface border border-border rounded-xl text-sm text-text-main focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer disabled:bg-background";

  return (
    <div className="bg-surface rounded-xl shadow-card border border-border overflow-hidden animate-enter flex flex-col max-h-[85vh]">

      {/* Header */}
      <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-lg font-bold text-text-main">Novo Colaborador</h3>
          <p className="text-xs text-text-secondary">Cadastro de acesso e perfil profissional.</p>
        </div>
        <div className="p-2 bg-surface rounded-lg border border-border shadow-sm text-primary">
          <UserPlus className="w-5 h-5" />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
        
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">

          {/* Avatar Upload */}
          <div className="flex justify-center mb-2">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-full bg-background border-4 border-surface shadow-md cursor-pointer hover:scale-105 transition-all relative group overflow-hidden ring-1 ring-border"
              title="Alterar foto de perfil"
            >
              {previewUrl ? (
                <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted bg-surface-hover">
                  <User className="w-10 h-10 opacity-50" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <Input
                label="Nome Completo"
                {...register('nome')}
                placeholder="Ex: João da Silva"
                error={errors.nome?.message}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Input
                label="E-mail Corporativo"
                type="email"
                {...register('email')}
                placeholder="nome@empresa.com"
                error={errors.email?.message}
                disabled={isSubmitting}
              />
            </div>

            <div className="relative">
              <Input
                label="Senha Inicial"
                type="password"
                {...register('password')}
                placeholder="******"
                error={errors.password?.message}
                disabled={isSubmitting}
              />
              <span className="absolute right-0 top-0 text-[10px] text-text-muted font-medium px-2 py-1 opacity-60">Mín. 6 dígitos</span>
            </div>

            <div>
              <Input
                label="Matrícula"
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
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-muted">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Seção RH Condicional */}
          {roleSelecionada === 'OPERADOR' && (
            <div className="bg-primary/5 p-5 rounded-xl border border-primary/10 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-4 border-b border-primary/10 pb-2">
                <div className="p-1 bg-primary/20 rounded text-primary">
                  <Briefcase className="w-3 h-3" />
                </div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest">Dados do Motorista</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={labelStyle}>Cargo</label>
                  <div className="relative">
                    <select {...register('cargoId')} className={selectStyle} disabled={isSubmitting}>
                      <option value="">Selecione o cargo...</option>
                      {cargos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-muted">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelStyle}><CreditCard className="w-3 h-3 inline mr-1"/> Nº CNH</label>
                  <Input {...register('cnhNumero')} placeholder="Registro" disabled={isSubmitting} className="bg-surface" containerClassName="!mb-0" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelStyle}>Categoria</label>
                    <Input {...register('cnhCategoria')} placeholder="AE" className="text-center uppercase" maxLength={2} disabled={isSubmitting} containerClassName="!mb-0" />
                  </div>
                  <div>
                    <label className={labelStyle}>Validade</label>
                    <Input type="date" {...register('cnhValidade')} disabled={isSubmitting} className="bg-surface" containerClassName="!mb-0" />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className={labelStyle}><Calendar className="w-3 h-3 inline mr-1"/> Data de Admissão</label>
                  <Input type="date" {...register('dataAdmissao')} disabled={isSubmitting} className="bg-surface" containerClassName="!mb-0" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-background border-t border-border flex justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancelar}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="shadow-button hover:shadow-float px-6"
            icon={<UserPlus className="w-4 h-4" />}
            disabled={isSubmitting}
          >
            Cadastrar Colaborador
          </Button>
        </div>

      </form>
    </div>
  );
}