import { Skeleton } from "../ui/Skeleton";
import { cn } from "../../lib/utils";

interface SkeletonCardProps {
  highlight?: boolean;
}

export function SkeletonCard({ highlight = false }: SkeletonCardProps) {
  return (
    <div className={cn(
      "bg-surface rounded-2xl border border-border/60 p-5 shadow-sm flex flex-col justify-between border-l-[4px] border-l-border/40 animate-in fade-in duration-500",
      highlight ? "min-h-[160px]" : "min-h-[150px]"
    )}>
      {/* Cabeçalho do Card (Label + Ícone Fake) */}
      <div className="flex justify-between items-start w-full mb-4">
        <Skeleton className="h-3 w-24 rounded-full mt-1.5" /> 
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      
      {/* Valor Grande + Subtítulo */}
      <div className="space-y-4 mt-auto">
        <Skeleton className="h-8 w-1/2" />
        
        <div className="pt-3 border-t border-border/40 flex justify-between items-center">
            <Skeleton className="h-2.5 w-3/4 opacity-60" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonKpiGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* O primeiro card geralmente é o de Destaque (Custo Total) que ocupa 2 colunas */}
            <div className="lg:col-span-2">
                <SkeletonCard highlight />
            </div>
            <SkeletonCard />
            <SkeletonCard />
            
            {/* Linha 2 simulada */}
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
        </div>
    )
}