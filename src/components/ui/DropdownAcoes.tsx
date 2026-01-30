import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit3, Trash2, Eye } from 'lucide-react';

interface CustomAction {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    className?: string;
}

interface DropdownAcoesProps {
    onEditar?: () => void;
    onExcluir?: () => void;
    onVerDetalhes?: () => void;
    customActions?: CustomAction[];
    disabled?: boolean;
}

export function DropdownAcoes({
    onEditar,
    onExcluir,
    onVerDetalhes,
    customActions,
    disabled
}: DropdownAcoesProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const handleScroll = () => isOpen && setIsOpen(false);
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [isOpen]);

    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!disabled) setIsOpen(!isOpen);
    };

    return (
        <div className="relative inline-block text-left" ref={menuRef}>
            <button
                type="button"
                onClick={toggleMenu}
                disabled={disabled}
                className={`
                    flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-primary/20
                    ${isOpen
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-muted hover:bg-surface-hover hover:text-text-main'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
                `}
            >
                <MoreVertical className="w-5 h-5" />
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl bg-surface shadow-float border border-border ring-1 ring-black/5 animate-enter overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
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

                        {customActions?.map((action, idx) => (
                            <MenuOption
                                key={idx}
                                onClick={() => { action.onClick(); setIsOpen(false); }}
                                icon={action.icon}
                                label={action.label}
                                className={action.className}
                            />
                        ))}

                        {onExcluir && (
                            <>
                                {(onVerDetalhes || onEditar || (customActions && customActions.length > 0)) && (
                                    <div className="my-1 h-px bg-border mx-2" />
                                )}
                                <MenuOption
                                    onClick={() => { onExcluir(); setIsOpen(false); }}
                                    icon={<Trash2 className="w-4 h-4" />}
                                    label="Excluir"
                                    className="text-error hover:bg-error/5 hover:text-error font-medium"
                                />
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function MenuOption({ onClick, icon, label, className }: { onClick: () => void, icon?: React.ReactNode, label: string, className?: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                flex w-full items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors 
                text-text-main hover:bg-surface-hover hover:text-primary
                ${className || ''}
            `}
        >
            {icon && <span className="opacity-70">{icon}</span>}
            <span className="truncate">{label}</span>
        </button>
    );
}