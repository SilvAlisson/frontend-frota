import { Skeleton } from "../ui/Skeleton";

export function SkeletonTable() {
  return (
    <div className="bg-surface rounded-2xl border border-border/60 shadow-sm overflow-hidden animate-in fade-in duration-500">
      
      {/* 🖥️ Cabeçalho Fake (Só aparece no Desktop) */}
      <div className="hidden md:flex items-center justify-between gap-4 px-6 py-4 border-b border-border/60 bg-surface-hover/40">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-8" />
      </div>

      {/* 📱 / 🖥️ Linhas da Tabela (Responsivo) */}
      <div className="divide-y divide-border/40 p-4 md:p-0 space-y-4 md:space-y-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div 
            key={i} 
            className="flex items-center justify-between gap-4 md:px-6 md:py-5 p-5 rounded-[1.25rem] md:rounded-none border border-border/50 md:border-transparent bg-surface shadow-sm md:shadow-none"
          >
            <div className="flex items-start md:items-center gap-4 flex-1">
              {/* Fake Placa / Badge */}
              <Skeleton className="h-7 w-20 rounded-md shrink-0" />
              
              {/* Fake Textos (Título e Subtítulo) */}
              <div className="space-y-2.5 flex-1 max-w-[200px]">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>

            {/* Fake Badge de Status (Desktop) */}
            <Skeleton className="h-6 w-24 rounded-full hidden md:block shrink-0" />

            {/* Fake Botão de 3 Pontinhos */}
            <Skeleton className="h-9 w-9 rounded-xl shrink-0 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}