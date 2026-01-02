import { useState, useRef, useEffect } from 'react';

interface DropdownAcoesProps {
    onEditar?: () => void;
    onExcluir?: () => void;
    onVerDetalhes?: () => void;
    customActions?: { label: string; onClick: () => void; icon?: string; color?: string }[];
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

    return (
        <div className="relative inline-block text-left" ref={menuRef}>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); !disabled && setIsOpen(!isOpen); }}
                disabled={disabled}
                className={`
          p-2 rounded-lg transition-all duration-200
          ${isOpen ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}
        `}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                    <div className="py-1">
                        {onVerDetalhes && (
                            <MenuOption onClick={onVerDetalhes} icon="👁️" label="Ver Detalhes" />
                        )}

                        {onEditar && (
                            <MenuOption onClick={onEditar} icon="✏️" label="Editar" />
                        )}

                        {customActions?.map((action, idx) => (
                            <MenuOption key={idx} onClick={action.onClick} icon={action.icon || "•"} label={action.label} className={action.color} />
                        ))}

                        {onExcluir && (
                            <>
                                <div className="my-1 h-px bg-gray-100" />
                                <MenuOption onClick={onExcluir} icon="🗑️" label="Excluir" className="text-red-600 hover:bg-red-50" />
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function MenuOption({ onClick, icon, label, className }: any) {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors text-gray-700 hover:bg-gray-50 hover:text-primary ${className || ''}`}
        >
            <span className="text-lg opacity-70 w-5 text-center">{icon}</span>
            <span className="font-medium">{label}</span>
        </button>
    )
}