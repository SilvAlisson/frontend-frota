import { Skeleton } from "../ui/Skeleton";

export function SkeletonTable() {
  return (
    <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header da Tabela (Barra de busca fake e botão) */}
      <div className="p-4 border-b border-border flex justify-between items-center gap-4">
        <Skeleton className="h-10 w-full max-w-sm rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl hidden sm:block" />
      </div>
      
      {/* Linhas da Tabela */}
      <div className="p-2 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-transparent bg-surface">
            {/* Ícone/Avatar */}
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
            
            {/* Textos */}
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[40%] max-w-[200px]" />
              <Skeleton className="h-3 w-[25%] max-w-[150px]" />
            </div>
            
            {/* Botão de Ação (Desktop) */}
            <Skeleton className="h-8 w-8 rounded-lg shrink-0 hidden sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}