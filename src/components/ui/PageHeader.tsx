import React from 'react';
import { Button } from '../ui/Button';
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-border pb-6 animate-enter">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-text-main tracking-tight font-sans">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-sm text-text-secondary font-medium leading-relaxed">
                        {subtitle}
                    </p>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {extraAction}

                {actionLabel && onAction && (
                    <Button
                        onClick={onAction}
                        icon={actionIcon || <Plus className="w-5 h-5" />}
                        className="w-full md:w-auto shadow-button hover:shadow-float"
                    >
                        {actionLabel}
                    </Button>
                )}
            </div>
        </div>
    );
}