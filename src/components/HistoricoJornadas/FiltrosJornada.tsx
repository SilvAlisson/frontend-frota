import { Filter, Download } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { DatePicker } from '../ui/DatePicker';
import { Button } from '../ui/Button';

interface FiltrosJornadaProps {
  filtros: {
    dataInicio: string;
    dataFim: string;
    veiculoId: string;
    buscaMotorista: string;
    buscaPlaca: string;
  };
  setFiltros: React.Dispatch<React.SetStateAction<{
    dataInicio: string;
    dataFim: string;
    veiculoId: string;
    buscaMotorista: string;
    buscaPlaca: string;
  }>>;
  veiculosOptions: { value: string; label: string }[];
  onExportar: () => void;
  podeExportar: boolean;
}

export function FiltrosJornada({
  filtros,
  setFiltros,
  veiculosOptions,
  onExportar,
  podeExportar
}: FiltrosJornadaProps) {
  return (
    <div className="flex flex-col gap-3 w-full max-w-full overflow-hidden bg-surface p-2 sm:p-3 rounded-2xl border border-border/60 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="w-full sm:w-44">
          <Input 
            placeholder="Nome do motorista..." 
            label="Buscar Motorista"
            value={filtros.buscaMotorista}
            onChange={e => setFiltros(prev => ({...prev, buscaMotorista: e.target.value}))}
            containerClassName="!mb-0"
          />
        </div>
        <div className="w-full sm:w-32">
          <Input 
            placeholder="ABC-1234" 
            label="Buscar Placa"
            value={filtros.buscaPlaca}
            onChange={e => setFiltros(prev => ({...prev, buscaPlaca: e.target.value}))}
            containerClassName="!mb-0"
            className="font-mono uppercase tracking-widest"
          />
        </div>
        <div className="w-px h-10 bg-border/60 hidden sm:block mx-1"></div>
        <div className="w-full sm:w-56">
          <Select 
            label="Lista de Veículos" 
            options={veiculosOptions}
            value={filtros.veiculoId}
            onChange={e => setFiltros(prev => ({...prev, veiculoId: e.target.value}))}
            icon={<Filter className="w-4 h-4" />}
            containerClassName="!mb-0"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-end sm:justify-between xl:justify-start">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-40">
            <DatePicker disableFuture
              label="Data Início"
              placeholder="Início"
              date={filtros.dataInicio ? new Date(`${filtros.dataInicio}T12:00:00`) : undefined}
              onChange={date => setFiltros(prev => ({ 
                ...prev, 
                dataInicio: date ? date.toISOString().split('T')[0] : '' 
              }))}
            />
          </div>
          <div className="w-full sm:w-40">
            <DatePicker disableFuture
              label="Data Fim"
              placeholder="Fim"
              date={filtros.dataFim ? new Date(`${filtros.dataFim}T12:00:00`) : undefined}
              onChange={date => setFiltros(prev => ({ 
                ...prev, 
                dataFim: date ? date.toISOString().split('T')[0] : '' 
              }))}
            />
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 xl:ml-auto">
          <Button 
            variant="secondary" 
            onClick={onExportar} 
            icon={<Download className="w-4 h-4" />}
            disabled={!podeExportar}
            className="h-11 sm:h-12 w-full sm:w-auto flex-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 shadow-sm"
          >
            Excel
          </Button>
        </div>
      </div>
    </div>
  );
}
