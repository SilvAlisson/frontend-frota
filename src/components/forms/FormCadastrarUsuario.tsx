import { useState, useRef, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { uploadToR2 } from '../../services/uploadService';
import DOMPurify from 'dompurify';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserPlus, Camera, Calendar, CreditCard, User, Briefcase, Mail, KeyRound, Hash, X, Plus } from 'lucide-react';
import { hapticError } from '../../lib/haptics';
import { logger } from '../../lib/logger';

// Tipos e Constantes
interface CargoRequisito {
  id: string;
  nome: string;
  validadeMeses: number;
  diasAntecedenciaAlerta: number;
}
interface Cargo { id: string; nome: string; requisitos?: CargoRequisito[]; }
const ROLES = ["OPERADOR", "ENCARREGADO", "ADMIN", "RH", "COORDENADOR", "AUXILIAR_OPERACIONAL"] as const;

// Schema de Validação
const treinamentoSchema = z.object({
  nome: z.string().min(1, "Obrigatório"),
  dataRealizacao: z.string().min(1, "Obrigatório"),
  dataVencimento: z.string().optional().nullable(),
  diasAntecedenciaAlerta: z.union([z.string(), z.number()]).transform(v => Number(v)).refine(v => !isNaN(v) && v >= 1, "Mínimo 1"),
});

const usuarioSchema = z.object({
  nome: z.string().min(3, "Nome muito curto").transform(val => val.trim()),
  email: z.string().email("Email inválido").toLowerCase(),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  matricula: z.string().optional().nullable(),
  role: z.enum(ROLES, { error: "Função inválida" }),
  regimeTrabalho: z.enum(['TURNO', 'ADM', 'NENHUM']).optional(),
  dataAdmissao: z.string().min(1, "Data de admissão obrigatória"),
  cargoId: z.string().min(1, "Cargo obrigatório"),

  // CNH (Opcionais/Condicionais)
  cnhNumero: z.string().optional().nullable(),
  cnhCategoria: z.string().optional().nullable(),
  cnhValidade: z.string().optional().nullable(),
  
  // Treinamentos Obrigatórios
  treinamentos: z.array(treinamentoSchema).optional(),
});

type UsuarioFormInput = z.input<typeof usuarioSchema>;
type UsuarioFormOutput = z.infer<typeof usuarioSchema>;

interface FormProps {
  onSuccess: () => void;
  onCancelar: () => void;
}

export function FormCadastrarUsuario({ onSuccess, onCancelar }: FormProps) {
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingStep, setLoadingStep] = useState('');

  const EMPTY_ARRAY: Cargo[] = [];
  const { data: cargos = EMPTY_ARRAY, isLoading: loadCargos } = useQuery<Cargo[]>({
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
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<UsuarioFormInput, any, UsuarioFormOutput>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      role: 'OPERADOR',
      regimeTrabalho: 'NENHUM',
      cargoId: '',
      cnhNumero: '',
      cnhCategoria: '',
      cnhValidade: '',
      dataAdmissao: '',
      matricula: '',
      treinamentos: []
    },
    mode: 'onBlur'
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "treinamentos"
  });

  const roleSelecionada = watch('role');
  const cargoIdSelecionado = watch('cargoId');

  // Ao mudar de cargo, atualizar os treinamentos obrigatórios
  useEffect(() => {
    if (cargoIdSelecionado && cargos.length > 0) {
      const cargo = cargos.find(c => c.id === cargoIdSelecionado);
      if (cargo && cargo.requisitos) {
        // Popula o form com os requisitos do cargo
        replace(cargo.requisitos.map((req: CargoRequisito) => ({
          nome: req.nome,
          dataRealizacao: '',
          dataVencimento: '',
          diasAntecedenciaAlerta: req.diasAntecedenciaAlerta || 30
        })));
      } else {
        replace([]);
      }
    } else {
      replace([]);
    }
  }, [cargoIdSelecionado, cargos, replace]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: UsuarioFormOutput) => {
    setLoadingStep('Criando conta...');
    let finalFotoUrl = null;

    if (fotoFile) {
      try {
        const fileExt = fotoFile.name.split('.').pop();
        const fileName = `perfil-${Date.now()}.${fileExt}`;
        finalFotoUrl = await uploadToR2(fotoFile, fileName, fotoFile.type || 'image/jpeg', 'usuarios');
      } catch (err) {
        logger.debug('Erro upload de foto de perfil:', err);
        toast.error("Falha ao enviar foto de perfil.");
        setLoadingStep('');
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
      cargoId: data.cargoId,
      regimeTrabalho: data.regimeTrabalho || 'NENHUM',
      cnhNumero: isOp && data.cnhNumero ? data.cnhNumero : null,
      cnhCategoria: isOp && data.cnhCategoria ? data.cnhCategoria : null,
      cnhValidade: isOp && data.cnhValidade ? new Date(data.cnhValidade).toISOString() : null,
      dataAdmissao: new Date(data.dataAdmissao).toISOString(),
    };

    try {
      // Fase 1: Cadastrar Usuário
      const userRes = await api.post('/users/register', payload);
      const newUserId = userRes.data.user?.id || userRes.data.id;

      // Fase 2: Cadastrar Treinamentos
      if (data.treinamentos && data.treinamentos.length > 0) {
        setLoadingStep('Registrando treinamentos...');
        const promessasTreinamentos = data.treinamentos.map(treinamento => {
          return api.post('/treinamentos', {
            userId: newUserId,
            nome: treinamento.nome,
            dataRealizacao: new Date(treinamento.dataRealizacao).toISOString(),
            dataVencimento: treinamento.dataVencimento ? new Date(treinamento.dataVencimento).toISOString() : null,
            diasAntecedenciaAlerta: treinamento.diasAntecedenciaAlerta
          });
        });

        await Promise.all(promessasTreinamentos);
      }

      toast.success('Integrante cadastrado com sucesso!');
      reset();
      setFotoFile(null);
      setPreviewUrl(null);
      setLoadingStep('');
      setTimeout(onSuccess, 500);

    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Ocorreu um erro inesperado ao cadastrar usuário');
      }
    } finally {
      setLoadingStep('');
      hapticError();
    }
  };

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

      {/* Header */}
      <div className="bg-surface-hover/30 px-6 sm:px-8 py-5 border-b border-border/60 flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-xl font-black text-text-main tracking-tight">Novo Integrante</h3>
          <p className="text-sm text-text-secondary font-medium mt-0.5">Cadastro de acesso, cargo e qualificações.</p>
        </div>
        <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 shadow-inner text-primary">
          <UserPlus className="w-6 h-6" />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, () => hapticError())} className="flex flex-col flex-1 min-h-0">

        <div className="p-6 sm:p-8 space-y-8 overflow-y-auto scrollbar-thin">

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
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm pointer-events-none">
                <Camera className="w-6 h-6 text-white mb-1" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Alterar</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

            <div className="md:col-span-2 flex items-center gap-2 border-b border-border/50 pb-2">
              <span className="w-1.5 h-4 bg-primary rounded-full shadow-sm"></span>
              <label className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">Dados de Acesso e Cargo</label>
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
              <span className="absolute right-3 top-3 text-[10px] text-text-secondary font-bold pointer-events-none">Mín. 6 chars</span>
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

            {roleSelecionada === 'OPERADOR' && (
              <div>
                <Select
                  label="Regime de Trabalho"
                  options={[
                    { value: 'NENHUM', label: 'Não se aplica / Outro' },
                    { value: 'TURNO', label: 'Regime de Turno (06h às 18h)' },
                    { value: 'ADM', label: 'Regime ADM (07h20 às 16h40)' }
                  ]}
                  {...register('regimeTrabalho')}
                  error={errors.regimeTrabalho?.message}
                  disabled={isSubmitting}
                />
              </div>
            )}


            <div>
              <Input
                label="Data de Admissão"
                type="date"
                icon={<Calendar className="w-4 h-4 text-primary/70" />}
                {...register('dataAdmissao')}
                error={errors.dataAdmissao?.message}
                disabled={isSubmitting}
              />
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
                label="Cargo Oficial"
                options={cargoOptions}
                placeholder="Selecione o cargo..."
                {...register('cargoId')}
                error={errors.cargoId?.message}
                disabled={isSubmitting || loadCargos}
              />
            </div>
          </div>

          {/* Seção RH Condicional com Animação - Somente Motorista precisa de CNH */}
          {roleSelecionada === 'OPERADOR' && (
            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-2 mb-5 border-b border-primary/10 pb-2">
                <div className="p-1.5 bg-primary/20 rounded-lg text-primary shadow-sm">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.15em]">Dados Profissionais (Motorista)</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              </div>
            </div>
          )}

          {/* ? NOVA SEÇÃO: Qualificação Inicial (Treinamentos Obrigatórios) */}
          {cargoIdSelecionado && (
            <div className="animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-primary rounded-full shadow-sm"></span>
                  <label className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">Qualificação SSMA Obrigatória</label>
                </div>
                <div className="text-[10px] text-text-secondary font-bold">Baseado no cargo selecionado</div>
              </div>

              {fields.length === 0 ? (
                <div className="p-4 bg-surface-hover rounded-xl border border-dashed border-border/60 text-center">
                  <p className="text-sm text-text-muted">Este cargo não possui treinamentos obrigatórios.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-4 bg-surface-hover rounded-xl border border-border/40 relative group">
                      <div className="flex flex-col md:flex-row gap-4 items-start">
                        <div className="flex-1 w-full">
                          <Input
                            label="Nome do Treinamento"
                            {...register(`treinamentos.${index}.nome`)}
                            disabled={isSubmitting}
                            error={errors.treinamentos?.[index]?.nome?.message}
                          />
                        </div>
                        <div className="w-full md:w-40">
                          <Input
                            label="Realização"
                            type="date"
                            {...register(`treinamentos.${index}.dataRealizacao`)}
                            disabled={isSubmitting}
                            error={errors.treinamentos?.[index]?.dataRealizacao?.message}
                          />
                        </div>
                        <div className="w-full md:w-40">
                          <Input
                            label="Vencimento"
                            type="date"
                            {...register(`treinamentos.${index}.dataVencimento`)}
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="w-full md:w-32">
                          <Input
                            label="Aviso (dias)"
                            type="number"
                            min="1"
                            {...register(`treinamentos.${index}.diasAntecedenciaAlerta`)}
                            disabled={isSubmitting}
                            error={errors.treinamentos?.[index]?.diasAntecedenciaAlerta?.message}
                          />
                        </div>
                      </div>
                      
                      <button 
                        type="button" 
                        onClick={() => remove(index)}
                        className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-red-200 shadow-sm"
                        title="Remover este treinamento"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => append({ nome: '', dataRealizacao: '', dataVencimento: '', diasAntecedenciaAlerta: 30 })}
                disabled={isSubmitting}
                className="mt-4 w-full sm:w-auto"
                icon={<Plus className="w-4 h-4" />}
              >
                Adicionar Outro Treinamento
              </Button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-5 bg-surface-hover/50 border-t border-border/60 flex flex-col-reverse sm:flex-row justify-end items-center gap-3 shrink-0">
          {isSubmitting && (
            <span className="text-sm font-bold text-primary animate-pulse w-full text-center sm:text-left sm:w-auto mr-auto">
              {loadingStep}
            </span>
          )}
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
            icon={<UserPlus className="w-4 h-4" />}
            className="w-full sm:w-auto shadow-button hover:shadow-float px-8"
          >
            Cadastrar Integrante
          </Button>
        </div>

      </form>
    </div>
  );
}

