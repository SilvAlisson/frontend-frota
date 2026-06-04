import { Truck, Store, FilterX, Download } from 'lucide-react';
import { Select } from '../ui/Select';
import { DatePicker } from '../ui/DatePicker';
import { Button } from '../ui/Button';

interface FiltrosManutencaoProps {
  filtros: {
    veiculoId: string;
    dataInicio: string;
    dataFim: string;
    fornecedorId: string;
  };
  setFiltros: React.Dispatch<React.SetStateAction<{
    veiculoId: string;
    dataInicio: string;
    dataFim: string;
    fornecedorId: string;
  }>>;
  veiculosOptions: { value: string; label: string }[];
  fornecedoresOptions: { value: string; label: string }[];
  hasFiltrosAtivos: boolean;
  onLimparFiltros: () => void;
  onExportar: () => void;
  podeExportar: boolean;
}

export function FiltrosManutencao({
  filtros,
  setFiltros,
  veiculosOptions,
  fornecedoresOptions,
  hasFiltrosAtivos,
  onLimparFiltros,
  onExportar,
  podeExportar
}: FiltrosManutencaoProps) {
  return (
    <div className="flex flex-col gap-3 w-full max-w-full overflow-hidden bg-surface p-2 sm:p-3 rounded-2xl border border-border/60 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="w-full sm:w-56">
          <Select 
            label="Filtrar Veículo"
            options={veiculosOptions}
            value={filtros.veiculoId}
            onChange={e => setFiltros(prev => ({ ...prev, veiculoId: e.target.value }))}
            icon={<Truck className="w-4 h-4" />}
            containerClassName="!mb-0"
          />
        </div>
        <div className="w-full sm:w-64">
          <Select 
            label="Oficina / Fornecedor"
            options={fornecedoresOptions}
            value={filtros.fornecedorId}
            onChange={e => setFiltros(prev => ({ ...prev, fornecedorId: e.target.value }))}
            icon={<Store className="w-4 h-4" />}
            containerClassName="!mb-0"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-end sm:justify-between xl:justify-start">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-40">
            <DatePicker disableFuture
              label="Data Inicial"
              placeholder="Início"
              date={filtros.dataInicio ? new Date(`${filtros.dataInicio}T12:00:00`) : undefined}
              onChange={date => setFiltros(prev => ({ ...prev, dataInicio: date ? date.toISOString().split('T')[0] : '' }))}
            />
          </div>
          <div className="w-full sm:w-40">
            <DatePicker disableFuture
              label="Data Final"
              placeholder="Fim"
              date={filtros.dataFim ? new Date(`${filtros.dataFim}T12:00:00`) : undefined}
              onChange={date => setFiltros(prev => ({ ...prev, dataFim: date ? date.toISOString().split('T')[0] : '' }))}
            />
          </div>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 xl:ml-auto">
          {hasFiltrosAtivos && (
            <Button 
              variant="ghost" 
              onClick={onLimparFiltros} 
              icon={<FilterX className="w-4 h-4" />}
              className="h-11 sm:h-12 text-text-secondary hover:text-error hover:bg-error/10 transition-colors px-3"
            >
              Limpar
            </Button>
          )}
          <Button 
            variant="secondary" 
            onClick={onExportar} 
            disabled={!podeExportar}
            icon={<Download className="w-4 h-4" />}
            className="flex-1 xl:flex-none h-11 sm:h-12 bg-info/10 text-info hover:bg-info/20 border-info/20 shadow-sm"
          >
            Gerar BM (Excel)
          </Button>
        </div>
      </div>
    </div>
  );
}
