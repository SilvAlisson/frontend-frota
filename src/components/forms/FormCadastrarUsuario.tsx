import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { supabase } from '../../supabaseClient';
import DOMPurify from 'dompurify';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select'; // 🔥 Importamos o nosso super Select
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserPlus, Camera, Calendar, CreditCard, User, Briefcase, Mail, KeyRound, Hash } from 'lucide-react';

// Tipos e Constantes
interface Cargo { id: string; nome: string; }
const ROLES = ["OPERADOR", "ENCARREGADO", "ADMIN", "RH", "COORDENADOR"] as const;

// Schema de Validação (Compatível com Zod V4)
const usuarioSchema = z.object({
  nome: z.string().min(3, "Nome muito curto").transform(val => val.trim()),
  email: z.string().email("Email inválido").toLowerCase(),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  matricula: z.string().optional().nullable(),
  role: z.enum(ROLES, { error: "Função inválida" }),

  // Campos RH (Opcionais/Condicionais)
  cargoId: z.string().optional().nullable(),
  cnhNumero: z.string().optional().nullable(),
  cnhCategoria: z.string().optional().nullable(),
  cnhValidade: z.string().optional().nullable(),
  dataAdmissao: z.string().optional().nullable(),
});

type UsuarioFormInput = z.infer<typeof usuarioSchema>;

interface FormProps {
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormCadastrarUsuario({ onSuccess, onCancelar }: FormProps) {
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: cargos = [], isLoading: loadCargos } = useQuery<Cargo[]>({
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

  // Formatação das opções para o Select
  const roleOptions = ROLES.map(r => ({
    value: r,
    label: r.charAt(0) + r.slice(1).toLowerCase().replace('_', ' ')
  }));

  const cargoOptions = cargos.map(c => ({
    value: c.id,
    label: c.nome
  }));

  return (
    <div className="bg-surface rounded-2xl shadow-float border border-border/60 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

      {/* Header Premium */}
      <div className="bg-surface-hover/30 px-6 sm:px-8 py-5 border-b border-border/60 flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-xl font-black text-text-main tracking-tight">Novo Colaborador</h3>
          <p className="text-sm text-text-secondary font-medium mt-0.5">Cadastro de acesso e perfil profissional.</p>
        </div>
        <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 shadow-inner text-primary">
          <UserPlus className="w-6 h-6" />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
        
        <div className="p-6 sm:p-8 space-y-8 overflow-y-auto custom-scrollbar">

          {/* Avatar Upload Redesenhado */}
          <div className="flex flex-col items-center mb-2">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} disabled={isSubmitting} />
            <div
              onClick={() => !isSubmitting && fileInputRef.current?.click()}
              className={`w-28 h-28 rounded-full bg-surface-hover border-4 border-surface shadow-md cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all relative group overflow-hidden ring-2 ring-border/50 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Alterar foto de perfil"
            >
              {previewUrl ? (
                <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted">
                  <User className="w-12 h-12 opacity-40 group-hover:scale-110 transition-transform" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                <Camera className="w-6 h-6 text-white mb-1" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Alterar</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            
            <div className="md:col-span-2 flex items-center gap-2 border-b border-border/50 pb-2">
              <span className="w-1.5 h-4 bg-primary rounded-full shadow-sm"></span>
              <label className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">Dados de Acesso</label>
            </div>

            <div className="md:col-span-2">
              <Input
                label="Nome Completo"
                icon={<User className="w-4 h-4 text-text-muted" />}
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
                icon={<Mail className="w-4 h-4 text-text-muted" />}
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
                icon={<KeyRound className="w-4 h-4 text-text-muted" />}
                {...register('password')}
                placeholder="******"
                error={errors.password?.message}
                disabled={isSubmitting}
              />
              <span className="absolute right-3 top-3 text-[10px] text-text-muted font-bold pointer-events-none opacity-60">Mín. 6 chars</span>
            </div>

            <div>
              <Input
                label="Matrícula"
                icon={<Hash className="w-4 h-4 text-text-muted" />}
                {...register('matricula')}
                placeholder="12345"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Select
                label="Nível de Acesso (Função)"
                options={roleOptions}
                {...register('role')}
                error={errors.role?.message}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Seção RH Condicional com Animação */}
          {roleSelecionada === 'OPERADOR' && (
            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-2 mb-5 border-b border-primary/10 pb-2">
                <div className="p-1.5 bg-primary/20 rounded-lg text-primary shadow-sm">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.15em]">Dados Profissionais (Motorista)</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <Select
                    label="Cargo Oficial"
                    options={cargoOptions}
                    placeholder="Selecione o cargo..."
                    {...register('cargoId')}
                    disabled={isSubmitting || loadCargos}
                  />
                </div>

                <div>
                  <Input 
                    label="Nº da CNH"
                    icon={<CreditCard className="w-4 h-4 text-primary/70" />}
                    {...register('cnhNumero')} 
                    placeholder="Registro da Carteira" 
                    disabled={isSubmitting} 
                    className="font-mono tracking-wider" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input 
                      label="Categoria" 
                      {...register('cnhCategoria')} 
                      placeholder="AE" 
                      className="text-center font-black text-lg uppercase text-primary tracking-widest" 
                      maxLength={2} 
                      disabled={isSubmitting} 
                    />
                  </div>
                  <div>
                    <Input 
                      label="Validade CNH" 
                      type="date" 
                      {...register('cnhValidade')} 
                      disabled={isSubmitting} 
                      className="text-sm text-text-secondary" 
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Input 
                    label="Data de Admissão" 
                    type="date" 
                    icon={<Calendar className="w-4 h-4 text-primary/70" />}
                    {...register('dataAdmissao')} 
                    disabled={isSubmitting} 
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Premium */}
        <div className="px-6 sm:px-8 py-5 bg-surface-hover/50 border-t border-border/60 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancelar}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="w-full sm:w-auto shadow-button hover:shadow-float px-8"
          >
            Cadastrar Colaborador
          </Button>
        </div>

      </form>
    </div>
  );
}