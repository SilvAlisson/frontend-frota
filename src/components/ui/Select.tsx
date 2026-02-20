import React, { forwardRef, useState, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';
import * as RadixSelect from '@radix-ui/react-select';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

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

        // Intercepta a opção vazia que o HTML antigo usava
        const emptyOption = options.find(opt => String(opt.value) === '');
        const validOptions = options.filter(opt => String(opt.value) !== '');
        
        // Usa a label da opção vazia como Placeholder do Radix
        const displayPlaceholder = emptyOption ? emptyOption.label : (placeholder || "Selecione uma opção");

        const [internalValue, setInternalValue] = useState<string>(value !== undefined ? String(value) : '');

        useEffect(() => {
            if (value !== undefined) {
                setInternalValue(String(value));
            }
        }, [value]);

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
                        className="text-xs font-bold text-text-secondary uppercase tracking-wider select-none ml-1"
                    >
                        {label}
                    </label>
                )}

                <RadixSelect.Root
                    value={radixValue}
                    onValueChange={handleValueChange}
                    disabled={disabled}
                    name={name}
                >
                    <div className="relative group w-full">
                        {icon && (
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10 [&>svg]:w-5 [&>svg]:h-5 transition-colors group-focus-within:text-primary">
                                {icon}
                            </div>
                        )}

                        <RadixSelect.Trigger
                            id={selectId}
                            className={cn(
                                "flex items-center justify-between w-full py-2.5 text-sm bg-surface border rounded-xl transition-all duration-200 outline-none text-left",
                                "focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm",
                                "disabled:bg-surface-hover/50 disabled:text-text-muted disabled:cursor-not-allowed",
                                "data-[placeholder]:text-text-muted",
                                icon ? "pl-10 pr-4" : "px-4",
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
                            // 🔥 O SEGREDO DO SCROLL: Usamos var(--radix-select-content-available-height)
                            className="z-[9999] w-[var(--radix-select-trigger-width)] min-w-[200px] max-h-[var(--radix-select-content-available-height)] overflow-hidden bg-surface rounded-xl border border-border/60 shadow-float data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                        >
                            <RadixSelect.ScrollUpButton className="flex items-center justify-center h-[25px] bg-surface text-text-muted cursor-default hover:bg-surface-hover transition-colors">
                                <ChevronDown className="w-4 h-4 rotate-180" />
                            </RadixSelect.ScrollUpButton>

                            {/* 🔥 Limitando o Viewport para forçar o scroll interno */}
                            <RadixSelect.Viewport className="p-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                                <RadixSelect.Group>
                                    {validOptions.map((opt) => (
                                        <RadixSelect.Item
                                            key={opt.value}
                                            value={String(opt.value)}
                                            className="relative flex items-center w-full px-8 py-2.5 text-sm font-bold text-text-main rounded-lg outline-none cursor-pointer select-none focus:bg-primary/10 focus:text-primary data-[disabled]:text-text-muted data-[disabled]:pointer-events-none transition-colors"
                                        >
                                            <span className="absolute left-2 flex items-center justify-center w-4 h-4">
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
                    ref={ref}
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