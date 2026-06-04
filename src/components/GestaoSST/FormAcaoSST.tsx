import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { hapticError } from '../../lib/haptics';
import type { AcaoSST } from '../../hooks/useSST';
import { PROGRAMAS } from './constants';

export const acaoSSTSchema = z.object({
  acao:     z.string().min(3, 'Descreva a ação com pelo menos 3 caracteres.'),
  unidade:   z.string().min(1, 'Unidade obrigatória.'),
  programa:   z.enum(['PCA', 'PPR', 'AET', 'PGR'], { error: 'Selecione o programa.' }),
  responsaveis: z.string().min(3, 'Informe o(s) responsável(is).'),
  vencimento:  z.string().min(1, 'Informe a data de vencimento.'),
  realizado:  z.string().optional(),
  observacao:  z.string().optional(),
  status:    z.enum(['PENDENTE', 'REALIZADO', 'ATRASADO']).optional(),
});

export type AcaoSSTForm = z.infer<typeof acaoSSTSchema>;

interface FormAcaoSSTProps {
  acaoParaEditar?: AcaoSST;
  onSubmit: (data: AcaoSSTForm) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function FormAcaoSST({
  acaoParaEditar,
  onSubmit,
  onCancel,
  isLoading,
}: FormAcaoSSTProps) {
  const formId = useId();
  const isEditing = !!acaoParaEditar;

  const { register, handleSubmit, formState: { errors } } = useForm<AcaoSSTForm>({
    resolver: zodResolver(acaoSSTSchema),
    defaultValues: acaoParaEditar
      ? {
          acao:     acaoParaEditar.acao,
          unidade:   acaoParaEditar.unidade,
          programa:   acaoParaEditar.programa,
          responsaveis: acaoParaEditar.responsaveis,
          vencimento:  acaoParaEditar.vencimento.split('T')[0],
          realizado:  acaoParaEditar.realizado ?? '',
          observacao:  acaoParaEditar.observacao ?? '',
          status:    acaoParaEditar.status,
        }
      : {
          unidade: 'CASE',
          programa: 'PGR',
          status:  'PENDENTE',
        },
  });

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit, () => hapticError())}
      className="space-y-5"
      aria-label={isEditing ? 'Formulário de edição de ação SST' : 'Formulário de nova ação SST'}
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <Textarea
          id={`${formId}-acao`}
          label="Descrição da Ação *"
          {...register('acao')}
          rows={3}
          disabled={isLoading}
          aria-invalid={!!errors.acao}
          error={errors.acao?.message}
          placeholder="Descreva a ação de SST a ser executada..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Unidade *"
          id={`${formId}-unidade`}
          {...register('unidade')}
          error={errors.unidade?.message}
          disabled={isLoading}
          placeholder="Ex: CASE"
        />
        <Select
          label="Programa *"
          id={`${formId}-programa`}
          {...register('programa')}
          options={PROGRAMAS.filter(p => p.value !== '')}
          error={errors.programa?.message}
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Responsável(is) *"
          id={`${formId}-responsaveis`}
          {...register('responsaveis')}
          error={errors.responsaveis?.message}
          disabled={isLoading}
          placeholder="Ex: Manuela / Alisson"
        />
        <Input
          label="Data de Vencimento *"
          id={`${formId}-vencimento`}
          type="date"
          {...register('vencimento')}
          error={errors.vencimento?.message}
          disabled={isLoading}
        />
      </div>

      <Input
        label="Data/Info Realizado"
        id={`${formId}-realizado`}
        {...register('realizado')}
        error={errors.realizado?.message}
        disabled={isLoading}
        placeholder="Ex: Mensalmente, Anualmente, 15/03/2025..."
      />
      <p className="text-xs text-text-muted font-medium ml-1 -mt-1">
        Deixe vazio se ainda não foi realizado.
      </p>

      {isEditing && (
        <Select
          label="Status *"
          id={`${formId}-status`}
          {...register('status')}
          options={[
            { value: 'PENDENTE', label: 'Pendente' },
            { value: 'REALIZADO', label: 'Realizado' },
            { value: 'ATRASADO', label: 'Atrasado' },
          ]}
          error={errors.status?.message}
          disabled={isLoading}
        />
      )}

      <Textarea
        id={`${formId}-obs`}
        label="Observação"
        {...register('observacao')}
        rows={2}
        disabled={isLoading}
        placeholder="Anotações adicionais..."
        autoResize={false}
      />

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="flex-1 shadow-button hover:shadow-float-primary"
        >
          {isEditing ? 'Salvar Alterações' : 'Cadastrar Ação'}
        </Button>
      </div>
    </form>
  );
}
