import React from 'react';
import { Button } from './Button';
import { Plus } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    actionLabel?: string;
    onAction?: () => void;
    actionIcon?: React.ReactNode;
    extraAction?: React.ReactNode;
}

export function PageHeader({
    title,
    subtitle,
    actionLabel,
    onAction,
    actionIcon,
    extraAction
}: PageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-100 pb-6 animate-in fade-in slide-in-from-top-2 duration-500">
            {/* Títulos e Subtítulos */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Área de Ações */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {extraAction}

                {actionLabel && onAction && (
                    <Button
                        onClick={onAction}
                        icon={actionIcon || <Plus className="w-5 h-5" />}
                        className="w-full md:w-auto shadow-lg shadow-primary/20"
                    >
                        {actionLabel}
                    </Button>
                )}
            </div>
        </div>
    );
}