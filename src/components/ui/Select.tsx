import React, { forwardRef, useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { cn } from '../../lib/utils';
import * as RadixSelect from '@radix-ui/react-select';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';



export interface SelectOption {
    value: string | number;
    label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    options?: SelectOption[];
    placeholder?: string;
    containerClassName?: string;
    value?: string | number;
    onChange?: (event: { target: { name?: string; value: string } }) => void;
}

// Converte qualquer valor externo para string controlada ('') ou valor real.
// NUNCA retorna undefined — isso evita o warning de React.
const toSafeString = (v: string | number | undefined | null): string => {
    if (v === undefined || v === null || v === '') return '';
    return String(v);
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({
        label,
        error,
        icon,
        options = [],
        placeholder,
        className,
        containerClassName,
        id,
        name,
        value,
        onChange,
        disabled,
        children,
        ...rest
    }, ref) => {

        const generatedId = React.useId();
        const selectId = id || generatedId;

        // Ref para o <select> nativo oculto (usado pelo react-hook-form)
        const localRef = useRef<HTMLSelectElement>(null);
        const setRefs = useCallback(
            (node: HTMLSelectElement | null) => {
                (localRef as React.MutableRefObject<HTMLSelectElement | null>).current = node;
                if (typeof ref === 'function') {
                    ref(node);
                } else if (ref) {
                    (ref as React.MutableRefObject<HTMLSelectElement | null>).current = node;
                }
            },
            [ref]
        );

        // Estado interno SEMPRE é string — nunca undefined.
        // Inicializado com o valor externo (ou '' se não houver).
        const [internalValue, setInternalValue] = useState<string>(() => toSafeString(value));

        // ─── SINCRONIZAÇÃO COM PROP EXTERNA ────────────────────────────────────────
        // Roda quando a prop `value` muda (ex: reset() externo fora do RHF, ou
        // componente controlado simples como <Select value={mes} .../>).
        // Usa comparação para evitar re-renders desnecessários.
        useEffect(() => {
            const next = toSafeString(value);
            setInternalValue(prev => (prev !== next ? next : prev));
        }, [value]);

        // ─── INTERCEPTOR DO REACT-HOOK-FORM ────────────────────────────────────────
        // O RHF escreve diretamente em `element.value` via ref (em reset() e setValue()).
        // Interceptamos esse setter nativo para sincronizar o estado React.
        // useLayoutEffect garante que o interceptor é instalado ANTES do primeiro paint,
        // capturando defaultValues que o RHF escreve no ref callback.
        useLayoutEffect(() => {
            const select = localRef.current;
            if (!select) return;

            const proto = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
            if (!proto?.set || !proto?.get) return;

            const originalSet = proto.set;
            const originalGet = proto.get;

            Object.defineProperty(select, 'value', {
                set(v: unknown) {
                    // Garante que o DOM nativo SEMPRE recebe uma string
                    const safe = toSafeString(v as string | number | undefined | null);
                    originalSet.call(this, safe);
                    setInternalValue(safe);
                },
                get() {
                    return originalGet.call(this);
                },
                configurable: true,
            });

            // Captura valor que o RHF já escreveu antes deste effect rodar
            const domValue = originalGet.call(select);
            if (domValue) {
                setInternalValue(prev => (prev !== domValue ? domValue : prev));
            }

            return () => {
                try {
                    delete (select as unknown as Record<string, unknown>).value;
                } catch (_) { /* noop */ }
            };
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        // ─── RE-SINCRONIZAÇÃO QUANDO OPTIONS CHEGAM ASSINCRONAMENTE ────────────────
        // Problema: reset({ campo: 'VALOR' }) roda ANTES das options chegarem da API.
        // Radix tem o value mas não encontra a option → mostra placeholder.
        // Solução: quando options mudam e temos um valor, forçamos Radix a re-avaliar
        // usando o mecanismo de key do próprio Radix (resetKey).
        const [resetKey, setResetKey] = useState(0);
        const optionsKey = options.map(o => String(o.value)).join(',');
        const prevOptionsKeyRef = useRef('');
        const internalValueRef = useRef(internalValue);
        internalValueRef.current = internalValue;

        useEffect(() => {
            // Só age quando as options realmente mudaram (de [] para dados reais)
            if (optionsKey !== prevOptionsKeyRef.current) {
                prevOptionsKeyRef.current = optionsKey;
                // Se temos um valor E as options acabaram de chegar (de vazio para preenchido)
                if (internalValueRef.current && optionsKey) {
                    // Força Radix a remontar e reavaliar o value contra as novas options
                    setResetKey(k => k + 1);
                }
            }
        }, [optionsKey]);

        // ─── HANDLER DE MUDANÇA PELO USUÁRIO ──────────────────────────────────────
        const handleValueChange = (newValue: string) => {
            setInternalValue(newValue);
            if (onChange) {
                onChange({
                    target: { name, value: newValue }
                });
            }
        };

        // Intercepta a opção vazia que o HTML antigo usava
        const emptyOption = options.find(opt => String(opt.value) === '');
        const validOptions = options.filter(opt => String(opt.value) !== '');
        const displayPlaceholder = emptyOption ? emptyOption.label : (placeholder || 'Selecione uma opção');

        // ─── VALOR PARA O RADIX ────────────────────────────────────────────────────
        // Radix Select usa `undefined` para indicar "nenhum item selecionado"
        // e exibir o placeholder. Isso é diferente do <select> nativo:
        // o Radix NÃO emite o warning de React pois é um componente customizado.
        // O warning vem apenas do <select> nativo, que recebe `internalValue` (sempre string).
        const radixValue = internalValue === '' ? undefined : internalValue;

        return (
            <div className={cn("w-full flex flex-col gap-1.5", containerClassName)}>
                {label && (
                    <label
                        htmlFor={selectId}
                        className="text-xs font-bold text-text-secondary uppercase tracking-wider select-none ms-1"
                    >
                        {label}
                    </label>
                )}

                <RadixSelect.Root
                    key={resetKey}
                    value={radixValue}
                    onValueChange={handleValueChange}
                    disabled={disabled}
                >
                    <div className="relative group w-full">
                        {icon && (
                            <div className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10 [&>svg]:w-5 [&>svg]:h-5 transition-colors group-focus-within:text-primary">
                                {icon}
                            </div>
                        )}

                        <RadixSelect.Trigger
                            id={selectId}
                            className={cn(
                                "flex items-center justify-between w-full h-11 text-sm bg-surface border rounded-xl transition-all duration-200 outline-none text-left",
                                "focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-background focus:border-primary shadow-sm",
                                "disabled:bg-surface-hover/50 disabled:text-text-muted disabled:cursor-not-allowed",
                                "data-[placeholder]:text-text-muted",
                                icon ? "ps-10 pe-4" : "px-4",
                                !error ? "border-border/60 hover:border-border" : "border-error focus:border-error focus:ring-error/20 text-error",
                                className
                            )}
                        >
                            <RadixSelect.Value placeholder={displayPlaceholder} />
                            <RadixSelect.Icon asChild>
                                <ChevronDown className={cn("w-4 h-4 opacity-50 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180", error && "text-error")} />
                            </RadixSelect.Icon>
                        </RadixSelect.Trigger>
                    </div>

                    <RadixSelect.Portal>
                        <RadixSelect.Content
                            position="popper"
                            sideOffset={6}
                            avoidCollisions={true}
                            collisionPadding={8}
                            className="z-[9999] w-[var(--radix-select-trigger-width)] min-w-[200px] max-h-[var(--radix-select-content-available-height)] overflow-hidden bg-surface rounded-xl border border-border/60 shadow-float data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                        >
                            <RadixSelect.ScrollUpButton className="flex items-center justify-center h-[25px] bg-surface text-text-muted cursor-default hover:bg-surface-hover transition-colors">
                                <ChevronDown className="w-4 h-4 rotate-180" />
                            </RadixSelect.ScrollUpButton>

                            <RadixSelect.Viewport className="p-1 max-h-[min(280px,var(--radix-select-content-available-height))] overflow-y-auto scrollbar-thin">
                                <RadixSelect.Group>
                                    {validOptions.map((opt) => (
                                        <RadixSelect.Item
                                            key={opt.value}
                                            value={String(opt.value)}
                                            className={cn(
                                                "relative flex w-full cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm font-bold min-h-[44px]",
                                                "text-text-main outline-none focus:bg-surface-hover focus:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors"
                                            )}
                                        >
                                            <span className="absolute inset-s-2 flex items-center justify-center w-4 h-4">
                                                <RadixSelect.ItemIndicator>
                                                    <Check className="w-4 h-4 text-primary" />
                                                </RadixSelect.ItemIndicator>
                                            </span>
                                            <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                                        </RadixSelect.Item>
                                    ))}
                                </RadixSelect.Group>
                            </RadixSelect.Viewport>

                            <RadixSelect.ScrollDownButton className="flex items-center justify-center h-[25px] bg-surface text-text-muted cursor-default hover:bg-surface-hover transition-colors">
                                <ChevronDown className="w-4 h-4" />
                            </RadixSelect.ScrollDownButton>
                        </RadixSelect.Content>
                    </RadixSelect.Portal>
                </RadixSelect.Root>

                {/* <select> nativo oculto — lido pelo react-hook-form via ref.
                    Recebe SEMPRE uma string (nunca undefined) para evitar o warning
                    "uncontrolled to controlled" do React. */}
                <select
                    ref={setRefs}
                    name={name}
                    value={internalValue}
                    onChange={() => {}}
                    className="sr-only pointer-events-none"
                    aria-hidden="true"
                    tabIndex={-1}
                    {...rest}
                >
                    {emptyOption && <option value="" disabled>{emptyOption.label}</option>}
                    {!emptyOption && <option value="" disabled>{displayPlaceholder}</option>}
                    {validOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>

                {error && (
                    <p className="text-xs text-error font-bold flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 ml-1 mt-0.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';
