import { Skeleton } from "../ui/Skeleton";

export function SkeletonCard() {
  return (
    <div className="bg-surface rounded-3xl border border-border p-5 shadow-sm space-y-4">
      {/* Cabeçalho do Card (Label + Ícone) */}
      <div className="flex justify-between items-start">
        <Skeleton className="h-3 w-[100px] rounded-full" /> 
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      
      {/* Valor Grande */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-[140px]" />
      </div>
    </div>
  );
}

export function SkeletonKpiGrid() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
        </div>
    )
}