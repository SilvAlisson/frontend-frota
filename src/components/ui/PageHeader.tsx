import type { ReactNode } from 'react';
import { Button } from './Button';
import { Link } from 'react-router-dom';
import { Plus, ChevronRight } from 'lucide-react';

interface PageHeaderProps {
    title: string | ReactNode;
    subtitle?: string;
    actionLabel?: string;
    onAction?: () => void;
    actionIcon?: ReactNode;
    extraAction?: ReactNode;
    breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function PageHeader({
    title,
    subtitle,
    actionLabel,
    onAction,
    actionIcon,
    extraAction,
    breadcrumbs
}: PageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-border pb-6 animate-enter">
            <div className="space-y-1">
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className="flex items-center gap-1.5 text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
                        {breadcrumbs.map((crumb, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                                {crumb.href ? (
                                    <Link to={crumb.href} className="hover:text-primary transition-colors">
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className="text-text-secondary">{crumb.label}</span>
                                )}
                                {idx < breadcrumbs.length - 1 && <ChevronRight className="w-3 h-3 opacity-50" />}
                            </div>
                        ))}
                    </nav>
                )}
                <h1 className="text-2xl font-bold text-text-main tracking-tight font-sans flex items-center gap-3">
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
                        className="w-full md:w-auto"
                    >
                        {actionLabel}
                    </Button>
                )}
            </div>
        </div>
    );
}


