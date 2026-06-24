import { useMatrizQualificacao } from '../../hooks/useMatrizQualificacao';
import { Search, Download, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { Input } from '../ui/Input';

export function MatrizQualificacao() {
  const { data: matriz, isLoading } = useMatrizQualificacao();
  const [busca, setBusca] = useState('');

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!matriz || matriz.length === 0) {
    return <div className="p-8 text-center text-text-muted">Nenhum integrante encontrado.</div>;
  }

  // Identificar todas as colunas únicas (exigências)
  const colunasSet = new Set<string>();
  matriz.forEach(user => {
    user.exigencias.forEach(e => colunasSet.add(e.nome));
  });
  const colunas = Array.from(colunasSet).sort();

  const filtrados = matriz.filter(u => 
    u.nome.toLowerCase().includes(busca.toLowerCase()) || 
    u.cargo.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-text-main tracking-tight">Matriz de Qualificação SSMA</h3>
          <p className="text-sm text-text-secondary mt-1">
            Visão cruzada de integrantes e requisitos legais/obrigatórios.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Input 
            icon={<Search />}
            placeholder="Buscar integrante..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="bg-background min-w-[250px]"
          />
          {/* Export button disabled visually for now, could integrate ExcelJS */}
          <button className="btn btn-secondary whitespace-nowrap hidden sm:flex">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-border/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background/50 border-b border-border/60">
                <th className="p-4 font-bold text-sm text-text-secondary whitespace-nowrap sticky left-0 bg-surface z-10 border-r border-border/60 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  Integrante
                </th>
                <th className="p-4 font-bold text-sm text-text-secondary whitespace-nowrap border-r border-border/60">
                  Cargo
                </th>
                {colunas.map(col => (
                  <th key={col} className="p-4 font-bold text-sm text-text-secondary whitespace-nowrap text-center">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtrados.map((user) => (
                <tr key={user.userId} className="hover:bg-background/50 transition-colors">
                  <td className="p-4 font-bold text-sm text-text-main whitespace-nowrap sticky left-0 bg-surface/95 z-10 border-r border-border/60 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    {user.nome}
                  </td>
                  <td className="p-4 text-sm text-text-secondary whitespace-nowrap border-r border-border/60">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold">
                      {user.cargo}
                    </span>
                  </td>
                  {colunas.map(col => {
                    const exigencia = user.exigencias.find(e => e.nome === col);
                    
                    if (!exigencia) {
                      return (
                        <td key={col} className="p-4 text-center">
                          <span className="text-border/60 text-lg">-</span>
                        </td>
                      );
                    }

                    return (
                      <td key={col} className="p-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <div className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center shadow-sm",
                            exigencia.status === 'VÁLIDO' && "bg-green-500/10 text-green-500",
                            exigencia.status === 'VENCENDO' && "bg-yellow-500/10 text-yellow-500 animate-pulse",
                            (exigencia.status === 'VENCIDO' || exigencia.status === 'FALTANTE') && "bg-red-500/10 text-red-500"
                          )}>
                            {exigencia.status === 'VÁLIDO' && <CheckCircle2 className="w-5 h-5" />}
                            {exigencia.status === 'VENCENDO' && <AlertCircle className="w-5 h-5" />}
                            {(exigencia.status === 'VENCIDO' || exigencia.status === 'FALTANTE') && <XCircle className="w-5 h-5" />}
                          </div>
                          {exigencia.validade && (
                            <span className="text-[10px] font-bold text-text-muted mt-1">
                              {new Date(exigencia.validade).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          {exigencia.status === 'FALTANTE' && (
                            <span className="text-[10px] font-bold text-red-500 mt-1 uppercase">
                              Faltante
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-text-secondary bg-surface p-4 rounded-xl border border-border/60">
        <span className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" /> Válido
        </span>
        <span className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" /> Vencendo (&lt;= Limite)
        </span>
        <span className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" /> Vencido / Ausente
        </span>
        <span className="flex items-center gap-2">
          <div className="text-border/60 text-lg">-</div> Não Exigido
        </span>
      </div>
    </div>
  );
}
