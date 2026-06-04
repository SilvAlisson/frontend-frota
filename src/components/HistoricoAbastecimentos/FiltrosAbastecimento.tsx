import { Truck, Store, FilterX, FileDown } from 'lucide-react';
import { Select } from '../ui/Select';
import { DatePicker } from '../ui/DatePicker';
import { Button } from '../ui/Button';

interface FiltrosAbastecimentoProps {
  filtros: {
    dataInicio: string;
    dataFim: string;
    veiculoId: string;
    fornecedorId: string;
    tipoProduto: string;
  };
  setFiltros: React.Dispatch<React.SetStateAction<{
    dataInicio: string;
    dataFim: string;
    veiculoId: string;
    fornecedorId: string;
    tipoProduto: string;
  }>>;
  veiculosOptions: { value: string; label: string }[];
  fornecedoresOptions: { value: string; label: string }[];
  hasFiltrosAtivos: boolean;
  onLimparFiltros: () => void;
  onExportar: () => void;
  podeExportar: boolean;
}

export function FiltrosAbastecimento({
  filtros,
  setFiltros,
  veiculosOptions,
  fornecedoresOptions,
  hasFiltrosAtivos,
  onLimparFiltros,
  onExportar,
  podeExportar
}: FiltrosAbastecimentoProps) {
  return (
    <div className="flex flex-col gap-3 w-full max-w-full overflow-hidden bg-surface p-2 sm:p-3 rounded-2xl border border-border/60 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="w-full sm:w-56">
          <Select 
            label="Filtrar Veículo"
            options={veiculosOptions}
            value={filtros.veiculoId}
            onChange={(e) => setFiltros(prev => ({ ...prev, veiculoId: e.target.value }))}
            icon={<Truck className="w-4 h-4" />}
            containerClassName="!mb-0"
          />
        </div>
        <div className="w-full sm:w-64">
          <Select 
            label="Posto / Fornecedor"
            options={fornecedoresOptions}
            value={filtros.fornecedorId}
            onChange={(e) => setFiltros(prev => ({ ...prev, fornecedorId: e.target.value }))}
            icon={<Store className="w-4 h-4" />}
            containerClassName="!mb-0"
          />
        </div>
        <div className="w-full sm:w-[220px]">
          <Select
            label="Tipo de Produto"
            value={filtros.tipoProduto}
            onChange={(e) => setFiltros(prev => ({ ...prev, tipoProduto: e.target.value }))}
            options={[
              { value: '', label: 'Todos os Produtos' },
              { value: 'COMBUSTIVEL', label: 'Apenas Combustíveis' },
              { value: 'ADITIVO', label: 'Aditivos e Fluidos' },
              { value: 'OUTRO', label: 'Outros' }
            ]}
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
            icon={<FileDown className="w-4 h-4" />}
            className="flex-1 xl:flex-none h-11 sm:h-12 bg-emerald-500/10 text-emerald-700 dark:text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"
          >
            Gerar BM (Excel)
          </Button>
        </div>
      </div>
    </div>
  );
}
