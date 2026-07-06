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
        const selectId = id || React.useId();

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

        const [internalValue, setInternalValue] = useState<string>(() => toSafeString(value));

        // --- INÍCIO: DETECTOR DE CONTROLLED/UNCONTROLLED SOLICITADO ---
        const previous = useRef(value);
        useEffect(() => {
            if (previous.current !== value) {
                console.group(`SELECT ${name}`);
                console.log("Anterior:", previous.current);
                console.log("Atual:", value);
                console.log("Internal:", internalValue);

                if (
                    (previous.current === undefined) !==
                    (value === undefined)
                ) {
                    console.error("⚠️ Mudou controlled/uncontrolled");
                    console.trace();
                }

                console.groupEnd();
                previous.current = value;
            }
        }, [value, name, internalValue]);
        // --- FIM: DETECTOR ---

        // 1. Intercepta valores externos (Prop React)
        useEffect(() => {
            if (value !== undefined) {
                const next = toSafeString(value);
                setInternalValue(prev => (prev !== next ? next : prev));
            }
        }, [value]);

        // 2 & 3. Sincronização agressiva e interceptores para React Hook Form
        useLayoutEffect(() => {
            const select = localRef.current;
            if (!select) return;

            let count = 0;
            // Intervalo de segurança para capturar injeção assíncrona do RHF
            const interval = setInterval(() => {
                const domValue = select.value;
                if (domValue) {
                    setInternalValue(prev => (prev !== domValue ? domValue : prev));
                }
                for (let i = 0; i < select.options.length; i++) {
                    const opt = select.options[i];
                    if (opt.selected && opt.value) {
                        setInternalValue(prev => (prev !== opt.value ? opt.value : prev));
                    }
                }
                if (++count > 20) clearInterval(interval);
            }, 50);

            // Intercepta propriedades nativas
            const selectProto = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
            if (selectProto?.set && selectProto?.get) {
                const originalSet = selectProto.set;
                const originalGet = selectProto.get;
                Object.defineProperty(select, 'value', {
                    set(v: unknown) {
                        const safe = toSafeString(v as string | number | undefined | null);
                        originalSet.call(this, safe);
                        setInternalValue(safe);
                    },
                    get() {
                        return originalGet.call(this);
                    },
                    configurable: true,
                });
            }

            const optionProto = Object.getOwnPropertyDescriptor(HTMLOptionElement.prototype, 'selected');
            if (optionProto?.set) {
                const originalOptionSet = optionProto.set;
                for (let i = 0; i < select.options.length; i++) {
                    const opt = select.options[i];
                    const optExt = opt as HTMLOptionElement & { __intercepted?: boolean };
                    if (!optExt.__intercepted) {
                        optExt.__intercepted = true;
                        Object.defineProperty(opt, 'selected', {
                            set(v: boolean) {
                                originalOptionSet.call(this, v);
                                if (v) {
                                    setInternalValue(this.value);
                                }
                            },
                            get() {
                                return optionProto.get!.call(this);
                            },
                            configurable: true
                        });
                    }
                }
            }

            return () => {
                clearInterval(interval);
                try { delete (select as Record<string, unknown>).value; } catch (_) { /* noop */ }
            };
        }, [options]);

        // Sincroniza valor inicial async caso o select.value nativo não bata com o internal
        useEffect(() => {
            const select = localRef.current;
            if (!select) return;
            if (internalValue && select.value !== internalValue) {
                const proto = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
                if (proto?.set) {
                    proto.set.call(select, internalValue);
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }, [internalValue]);

        // 4. Handler de interações do usuário no Radix
        const handleValueChange = (newValue: string) => {
            setInternalValue(newValue);
            
            const select = localRef.current;
            if (select) {
                const proto = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
                if (proto?.set) {
                    proto.set.call(select, newValue);
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }

            if (onChange) {
                onChange({ target: { name, value: newValue } });
            }
        };

        const emptyOption = options.find(opt => String(opt.value) === '');
        const validOptions = options.filter(opt => String(opt.value) !== '');
        const displayPlaceholder = emptyOption ? emptyOption.label : (placeholder || 'Selecione uma opção');

        const radixValue = internalValue; // ALWAYS controlled!

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

                {/* 
                    ATENÇÃO: O elemento nativo <select> NÃO DEVE receber a prop `value={internalValue}`!
                    Se recebermos, o React tenta gerenciar o estado nativamente (componente controlado),
                    e conflita com o interceptor `Object.defineProperty`, gerando o warning 
                    "changing from uncontrolled to controlled".
                    Mantemos ele como `defaultValue` para inicializar, e deixamos o React Hook Form / Interceptor
                    trabalharem sem interferência do React.
                */}
                <select
                    ref={setRefs}
                    name={name}
                    defaultValue={toSafeString(value)}
                    className="sr-only pointer-events-none"
                    aria-hidden="true"
                    tabIndex={-1}
                    {...rest}
                >
                    {emptyOption && <option value="">{emptyOption.label}</option>}
                    {!emptyOption && <option value="">{displayPlaceholder}</option>}
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
