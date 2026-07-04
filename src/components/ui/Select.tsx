import React, { forwardRef, useState, useEffect, useLayoutEffect } from 'react';
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

        // Combinação de Refs para podermos acessar o elemento nativo
        const localRef = React.useRef<HTMLSelectElement>(null);
        const setRefs = React.useCallback(
            (node: HTMLSelectElement | null) => {
                localRef.current = node;
                if (typeof ref === 'function') {
                    ref(node);
                } else if (ref) {
                    (ref as React.MutableRefObject<HTMLSelectElement | null>).current = node;
                }
            },
            [ref]
        );

        // Intercepta a opção vazia que o HTML antigo usava
        const emptyOption = options.find(opt => String(opt.value) === '');
        const validOptions = options.filter(opt => String(opt.value) !== '');
        
        // Usa a label da opção vazia como Placeholder do Radix
        const displayPlaceholder = emptyOption ? emptyOption.label : (placeholder || "Selecione uma opção");

        //   A trava para evitar "uncontrolled to controlled". 
        // Nunca deixamos a string vazia, se for null/undefined vira ''.
        const [internalValue, setInternalValue] = useState<string>(
            value !== undefined && value !== null ? String(value) : ''
        );

        // Sincroniza quando o RHF atualiza o value via prop (reset, setValue, defaultValues)
        useEffect(() => {
            if (value !== undefined && value !== null) {
                setInternalValue(String(value));
            } else {
                setInternalValue('');
            }
        }, [value]);

        // ✨ CORREÇÃO PRINCIPAL: Re-sincroniza quando as options chegam assincronamente.
        //
        // Cenário problemático (causa do bug de campos em branco):
        //   1. Modal abre → reset({ operadorId: 'xyz' }) seta internalValue = 'xyz'
        //   2. Radix recebe value='xyz' mas options=[] → lista vazia → mostra placeholder
        //   3. 500ms depois → options=[{value:'xyz', label:'João'}] chegam da API
        //   4. BUG: internalValue já é 'xyz' → useEffect[value] NÃO roda (value não mudou)
        //   5. Radix continua mostrando placeholder porque não houve re-render do value
        //
        // Correção: quando options muda E temos um internalValue válido,
        // forçamos um ciclo: '' → internalValue, para que o Radix encontre a opção.
        const optionsKey = options.map(o => o.value).join(',');
        useEffect(() => {
            if (internalValue) {
                // Força o Radix a re-avaliar o value após as options chegarem
                setInternalValue(prev => {
                    // Retornar o mesmo valor força re-render do Radix com a lista agora populada
                    return prev;
                });
                // Usa um micro-ciclo para garantir que o Radix veja a mudança
                const v = internalValue;
                setInternalValue('');
                // setTimeout 0 coloca no final da fila de microtasks, após o Radix processar
                Promise.resolve().then(() => setInternalValue(v));
            }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [optionsKey]);

        // ✨ Sincroniza o Radix Select com o React Hook Form via interceptação do setter nativo.
        //
        // Por que useLayoutEffect e não useEffect?
        //   O RHF seta element.value no ref callback, que roda ANTES de qualquer effect.
        //   Com useLayoutEffect, instalamos o interceptor E lemos o valor atual em uma
        //   única janela sincrôna antes do browser pintar, capturando os defaultValues
        //   que o RHF já teria escrito no elemento.
        //
        // Cobre dois casos:
        //   1. defaultValues: valor já está no element no momento que o effect roda.
        //   2. reset(): interceptor captura futuras escritas programaticas do RHF.
        useLayoutEffect(() => {
            const select = localRef.current;
            if (!select) return;

            const proto = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
            if (!proto?.set || !proto?.get) return;

            const originalSet = proto.set;
            const originalGet = proto.get;

            // Instala interceptor para capturar reset() / setValue() do RHF
            Object.defineProperty(select, 'value', {
                set(v: string | undefined | null) {
                    originalSet.call(this, v);
                    setInternalValue(v !== undefined && v !== null ? String(v) : '');
                },
                get() {
                    return originalGet.call(this);
                },
                configurable: true,
            });

            // Leitura inicial: sincroniza qualquer valor que o RHF já escreveu
            // via defaultValues antes deste effect rodar.
            const currentDomValue = originalGet.call(select);
            if (currentDomValue && currentDomValue !== internalValue) {
                setInternalValue(currentDomValue);
            }

            return () => {
                // Remove a propriedade própria ao desmontar, restaurando o acesso ao prototype
                try { delete (select as unknown as Record<string, unknown>).value; } catch (_) { /* noop */ }
            };
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        const handleValueChange = (newValue: string) => {
            setInternalValue(newValue);
            if (onChange) {
                onChange({
                    target: {
                        name: name,
                        value: newValue
                    }
                });
            }
        };

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
                            // avoidCollisions faz o popover virar para cima se não couber abaixo
                            avoidCollisions={true}
                            collisionPadding={8}
                            className="z-[9999] w-[var(--radix-select-trigger-width)] min-w-[200px] max-h-[var(--radix-select-content-available-height)] overflow-hidden bg-surface rounded-xl border border-border/60 shadow-float data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                        >
                            <RadixSelect.ScrollUpButton className="flex items-center justify-center h-[25px] bg-surface text-text-muted cursor-default hover:bg-surface-hover transition-colors">
                                <ChevronDown className="w-4 h-4 rotate-180" />
                            </RadixSelect.ScrollUpButton>

                            {/*
                             * Viewport: usa a variável CSS do Radix que representa o espaço realmente
                             * disponível (considerando a posição do trigger + colisões de viewport).
                             * O max-h de 280px serve como teto absoluto para listas muito longas.
                             */}
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

                {/* Input oculto para o react-hook-form */}
                <select
                    ref={setRefs}
                    name={name}
                    //  CORREÇÃO 3: Aqui o HTML nativo exige que não seja undefined
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
