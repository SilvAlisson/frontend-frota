import React from 'react';
import { Button } from './Button';

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-border pb-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-primary tracking-tight font-sans">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-sm text-gray-500 font-medium">
                        {subtitle}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
                {extraAction}

                {actionLabel && onAction && (
                    <Button
                        onClick={onAction}
                        icon={actionIcon || <span className="text-xl leading-none">+</span>}
                        className="w-full md:w-auto shadow-lg shadow-primary/20"
                    >
                        {actionLabel}
                    </Button>
                )}
            </div>
        </div>
    );
}