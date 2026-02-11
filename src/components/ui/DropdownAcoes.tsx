import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit3, Trash2, Eye } from 'lucide-react';

// Tipagem para Ações Extras
interface CustomAction {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    className?: string;
    variant?: 'default' | 'danger'; // Permitir variantes semânticas
}

interface DropdownAcoesProps {
    onEditar?: () => void;
    onExcluir?: () => void;
    onVerDetalhes?: () => void;
    customActions?: CustomAction[];
    disabled?: boolean;
    align?: 'start' | 'end'; // [NOVO] Prop para alinhar à esquerda ou direita
}

export function DropdownAcoes({
    onEditar,
    onExcluir,
    onVerDetalhes,
    customActions,
    disabled,
    align = 'end' // Padrão: Abre para a esquerda (alinhado à direita)
}: DropdownAcoesProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Fechar ao clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    // Fechar ao rolar a tela (evita dropdown flutuando errado)
    useEffect(() => {
        const handleScroll = () => isOpen && setIsOpen(false);
        if (isOpen) {
            window.addEventListener('scroll', handleScroll, true);
        }
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [isOpen]);

    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!disabled) setIsOpen(!isOpen);
    };

    // Lógica de Alinhamento CSS
    const alignmentClasses = align === 'end' 
        ? 'right-0 origin-top-right' 
        : 'left-0 origin-top-left';

    return (
        <div className="relative inline-block text-left" ref={menuRef}>
            
            {/* Trigger Button (O botão de "...") */}
            <button
                type="button"
                onClick={toggleMenu}
                disabled={disabled}
                aria-haspopup="true"
                aria-expanded={isOpen}
                className={`
                    flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-primary/30
                    ${isOpen
                        ? 'bg-surface-hover text-primary shadow-inner'
                        : 'text-text-secondary hover:bg-surface-hover hover:text-text-main'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-90'}
                `}
            >
                <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div
                    className={`
                        absolute z-50 mt-1 w-52 rounded-xl bg-surface/95 backdrop-blur-md 
                        shadow-float border border-border/60 ring-1 ring-black/5 
                        animate-in fade-in zoom-in-95 duration-100 ease-out
                        ${alignmentClasses}
                    `}
                    onClick={(e) => e.stopPropagation()}
                    role="menu"
                >
                    <div className="p-1.5 space-y-0.5">

                        {onVerDetalhes && (
                            <MenuOption
                                onClick={() => { onVerDetalhes(); setIsOpen(false); }}
                                icon={<Eye className="w-4 h-4" />}
                                label="Ver Detalhes"
                            />
                        )}

                        {onEditar && (
                            <MenuOption
                                onClick={() => { onEditar(); setIsOpen(false); }}
                                icon={<Edit3 className="w-4 h-4" />}
                                label="Editar"
                            />
                        )}

                        {/* Ações Customizadas */}
                        {customActions?.map((action, idx) => (
                            <MenuOption
                                key={idx}
                                onClick={() => { action.onClick(); setIsOpen(false); }}
                                icon={action.icon}
                                label={action.label}
                                className={action.className}
                                variant={action.variant}
                            />
                        ))}

                        {/* Separador para Ações Destrutivas */}
                        {onExcluir && (
                            <>
                                {(onVerDetalhes || onEditar || (customActions && customActions.length > 0)) && (
                                    <div className="my-1 h-px bg-border/60 mx-1" />
                                )}
                                <MenuOption
                                    onClick={() => { onExcluir(); setIsOpen(false); }}
                                    icon={<Trash2 className="w-4 h-4" />}
                                    label="Excluir"
                                    variant="danger"
                                />
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Subcomponente de Opção de Menu ---

interface MenuOptionProps {
    onClick: () => void;
    icon?: React.ReactNode;
    label: string;
    className?: string;
    variant?: 'default' | 'danger';
}

function MenuOption({ onClick, icon, label, className, variant = 'default' }: MenuOptionProps) {
    
    // Classes dinâmicas baseadas na variante (Perigo vs Padrão)
    const variantClasses = variant === 'danger'
        ? "text-error hover:bg-error/10 hover:text-error-dark font-medium"
        : "text-text-main hover:bg-surface-hover hover:text-primary";

    return (
        <button
            type="button"
            onClick={onClick}
            role="menuitem"
            className={`
                flex w-full items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all
                group select-none
                ${variantClasses}
                ${className || ''}
            `}
        >
            {/* Ícone com opacidade leve que aumenta no hover */}
            {icon && (
                <span className={`shrink-0 transition-opacity ${variant === 'danger' ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                    {icon}
                </span>
            )}
            <span className="truncate font-medium">{label}</span>
        </button>
    );
}