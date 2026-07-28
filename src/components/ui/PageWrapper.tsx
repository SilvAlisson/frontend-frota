import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from './Button';

export const PageWrapper = ({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) => (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 pb-20 min-h-screen bg-background -mx-4 sm:-mx-8 px-4 sm:px-8">
        <div className="flex items-center gap-4 py-6 sticky top-0 z-40 -mx-4 px-4 sm:-mx-8 sm:px-8 backdrop-blur-xl bg-background/80 border-b border-border/40">
            <Button 
              onClick={onBack} 
              variant="ghost" size="icon"
              className="w-11 h-11 rounded-2xl bg-surface hover:bg-surface-hover border border-border/40 hover:border-primary/30 text-text-muted hover:text-primary transition-all active:scale-95 shadow-sm"
            >
                <ChevronRight className="w-5 h-5 rotate-180" />
            </Button>
            <h2 className="text-xl sm:text-2xl font-black text-text-main tracking-tight uppercase italic drop-shadow-sm">{title}</h2>
        </div>
        <div className="max-w-7xl mx-auto">
            {children}
        </div>
    </div>
);
