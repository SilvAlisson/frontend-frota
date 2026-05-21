import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { exportarParaExcel } from '../utils';
import { toast } from 'sonner';
import {
 Calendar, Download, ChevronDown, 
 FileText, FileX, DollarSign, Wrench, Store, Truck, FilterX, ZoomIn, X
} from 'lucide-react';
import type { OrdemServico } from '../types';

// --- HOOKS ATÔMICOS ---
import { useVeiculos } from '../hooks/useVeiculos';

// --- DESIGN SYSTEM ---
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { ListaResponsiva } from './ui/ListaResponsiva';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { ConfirmModal } from './ui/ConfirmModal';
import { DropdownAcoes } from './ui/DropdownAcoes';
import { DatePicker } from './ui/DatePicker';
import { TableStyles } from '../styles/table';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/Tooltip';
import { DateHelper } from '../lib/dateHelper';
import { PullToRefresh } from './ui/PullToRefresh';

// --- FORMS ---
import { FormEditarManutencao } from './forms/FormEditarManutencao';
import { FormRegistrarManutencao } from './forms/FormRegistrarManutencao';

interface HistoricoManutencoesProps {
 userRole: string;
 filtroInicial?: { veiculoId?: string; dataInicio?: string; };
}

const ITENS_POR_PAGINA = 20;

// HELPER 1: Limpador Automático de Placas (Remove o prefixo da marca)
const extrairPlaca = (placaBruta: string) => {
 if (!placaBruta) return '---';
 const match = placaBruta.match(/\(([^)]+)\)/);
 if (match && match[1]) {
  return match[1].trim();
 }
 return placaBruta.trim();
};


export function HistoricoManutencoes({
 userRole,
 filtroInicial
}: HistoricoManutencoesProps) {

 // 📡 BUSCA INDEPENDENTE COM CACHE
 const { data: veiculos = [] } = useVeiculos();

 // --- ESTADOS DE DADOS ---
 const [historico, setHistorico] = useState<OrdemServico[]>([]);
 const [fornecedores, setFornecedores] = useState<{ id: string, nome: string }[]>([]);
 const [loading, setLoading] = useState(true);

 // --- ESTADOS DE RENDERIZAÇÃO PROGRESSIVA ---
 const [visibleCount, setVisibleCount] = useState(ITENS_POR_PAGINA);

 // --- ESTADOS DE INTERAÇÃO ---
 const [editingOS, setEditingOS] = useState<OrdemServico | null>(null);
 const [deletingId, setDeletingId] = useState<string | null>(null);
 const [docParaVisualizar, setDocParaVisualizar] = useState<{ url: string, titulo: string } | null>(null);
 const [zoomNivel, setZoomNivel] = useState(1);
 const [isNovaOSOpen, setIsNovaOSOpen] = useState(false);

 // --- ESTADOS DE FILTRO (API) ---
 const [filtros, setFiltros] = useState({
  veiculoId: filtroInicial?.veiculoId || '',
  dataInicio: filtroInicial?.dataInicio || '',
  dataFim: '',
 });

 // --- ESTADO DE FILTRO LOCAL (FRONTEND) ---
 const [fornecedorIdFiltro, setFornecedorIdFiltro] = useState('');

 const hasFiltrosAtivos = Boolean(filtros.dataInicio || filtros.dataFim || filtros.veiculoId || fornecedorIdFiltro);

 const canEdit = ['ADMIN', 'ENCARREGADO', 'COORDENADOR'].includes(userRole);
 const canDelete = ['ADMIN', 'COORDENADOR'].includes(userRole);

 // --- BUSCA DE FORNECEDORES PARA O SELECT DO BM ---
 useEffect(() => {
  api.get('/fornecedores')
   .then(res => setFornecedores(res.data))
   .catch(err => { if (import.meta.env.DEV) console.error("Erro ao carregar fornecedores", err); });
 }, []);

 // FETCHING OTIMIZADO (Correção do Erro 400 da API)
 const fetchHistorico = useCallback(async () => {
  setLoading(true);
  try {
   const response = await api.get<OrdemServico[]>('/manutencoes/recentes', { params: { limit: 'all' } });
   setHistorico(response.data);
   setVisibleCount(ITENS_POR_PAGINA);
  } catch (err) {
   if (import.meta.env.DEV) console.error(err);
   toast.error('Erro ao carregar o histórico financeiro da oficina.');
  } finally {
   setLoading(false);
  }
 }, []);

 useEffect(() => {
  fetchHistorico();
 }, [fetchHistorico]);

 // FILTRO LOCAL INTELIGENTE (Instantâneo na RAM limpo e otimizado)
 const historicoFiltrado = useMemo(() => {
  return historico.filter(os => {
   if (fornecedorIdFiltro && os.fornecedorId !== fornecedorIdFiltro) return false;
   if (filtros.veiculoId && os.veiculoId !== filtros.veiculoId) return false;
   if (filtros.dataInicio && new Date(os.data) < new Date(`${filtros.dataInicio}T00:00:00`)) return false;
   if (filtros.dataFim && new Date(os.data) > new Date(`${filtros.dataFim}T23:59:59`)) return false;
   return true;
  }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
 }, [historico, fornecedorIdFiltro, filtros]);

 const totalGasto = useMemo(() => {
  return historicoFiltrado.reduce((acc, os) => acc + (Number(os.custoTotal) || 0), 0);
 }, [historicoFiltrado]);

 const osAbertas = useMemo(() => {
  return historicoFiltrado.filter(m => m.status === 'PENDENTE' || m.status === 'EM_ANDAMENTO').length;
 }, [historicoFiltrado]);

 const historicoVisivel = useMemo(() => {
  return historicoFiltrado.slice(0, visibleCount);
 }, [historicoFiltrado, visibleCount]);

 const handleCarregarMais = () => setVisibleCount(prev => prev + ITENS_POR_PAGINA);

 const handleDelete = async () => {
  if (!deletingId) return;
  try {
   await api.delete(`/manutencoes/${deletingId}`);
   setHistorico(prev => prev.filter(os => os.id !== deletingId));
   toast.success('Registro financeiro removido.');
  } catch (error) {
   toast.error('Ocorreu um erro ao remover o Registro.');
  } finally {
   setDeletingId(null);
  }
 };

 const handleExportar = () => {
  if (historicoFiltrado.length === 0) {
   toast.warning("Sem dados disponíveis para exportar com estes filtros.");
   return;
  }
  const exportPromise = new Promise((resolve, reject) => {
   try {
    // MAPA DE DADOS OTIMIZADO PARA O BM (Com fallback seguro para produtos)
    const dados = historicoFiltrado.map(os => ({
     'Data da OS': DateHelper.getExcel(os.data),
     'Oficina / Fornecedor': os.fornecedor?.nome || 'Não Registrada',
     'Placa do Veículo': extrairPlaca(os.veiculo?.placa || ''),
     'Categoria de Serviço': os.tipo,
     'Serviços Realizados': (os.itens || []).map(i => `${i.quantidade}x ${i.produto?.nome || 'Serviço'}`).join(' | '),
     'Valor Total (R$)': Number(os.custoTotal),
     'Comprovante': os.fotoComprovanteUrl ? `=HYPERLINK("${os.fotoComprovanteUrl}", "Visualizar Comprovante")` : 'Sem anexo'
    }));

    let nomeArquivo = "BM_Manutencoes_Globais.xlsx";
    if (fornecedorIdFiltro) {
     const nomeFornecedor = fornecedores.find(f => f.id === fornecedorIdFiltro)?.nome?.replace(/[^a-zA-Z0-9]/g, '_');
     nomeArquivo = `BM_${nomeFornecedor}.xlsx`;
    }

    exportarParaExcel(dados, nomeArquivo);
    resolve(true);
   } catch (err) {
    reject(err);
   }
  });

  toast.promise(exportPromise, {
   loading: 'Gerando folha de cálculo...',
   success: 'Boletim de Medição exportado com sucesso!',
   error: 'Erro a exportar Arquivo.'
  });
 };

 // --- HELPERS VISUAIS (DESIGN SYSTEM) ---
 const getBadgeTipo = (tipo: string) => {
  const map: Record<string, "warning" | "info" | "success" | "neutral"> = {
   'CORRETIVA': 'warning',
   'PREVENTIVA': 'info',
   'LAVAGEM': 'success'
  };
  return <Badge variant={map[tipo] || 'neutral'}>{tipo}</Badge>;
 };

 const veiculosOptions = useMemo(() => [
  { value: "", label: "Todos os Veículos" },
  ...veiculos.map(v => ({ value: v.id, label: `${extrairPlaca(v.placa)} - ${v.modelo}` }))
 ], [veiculos]);

 const fornecedoresOptions = useMemo(() => [
  { value: "", label: "Todas as Oficinas / Postos" },
  ...fornecedores.map(f => ({ value: f.id, label: f.nome }))
 ], [fornecedores]);

 return (
  <PullToRefresh onRefresh={fetchHistorico}>
   <div className="space-y-6 sm:space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

   {/* 1. HEADER & FILTROS */}
   <PageHeader
    title="Boletim de Manutenções"
    subtitle="Controle de manutenções KLIN. Filtre por oficina para gerar o Boletim de Medição (BM)."
    actionLabel={canEdit ? "Nova Manutenção" : undefined}
    onAction={canEdit ? () => setIsNovaOSOpen(true) : undefined}
    extraAction={
      // Mudamos para flex-col (duas linhas) com padding
      <div className="flex flex-col gap-3 w-full max-w-full overflow-hidden bg-surface p-2 sm:p-3 rounded-2xl border border-border/60 shadow-sm">
        
        {/* LINHA 1: Filtros de Seleção (Veículo e Fornecedor) */}
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
              value={fornecedorIdFiltro}
              onChange={e => setFornecedorIdFiltro(e.target.value)}
              icon={<Store className="w-4 h-4" />}
              containerClassName="!mb-0"
            />
          </div>
        </div>

        {/* LINHA 2: Filtros de Data e Botões de Ação */}
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
          
          {/* Botões empurrados para a direita no Desktop */}
          <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 xl:ml-auto">
            {hasFiltrosAtivos && (
              <Button 
                variant="ghost" 
                onClick={() => {
                  setFiltros({ veiculoId: '', dataInicio: '', dataFim: '' });
                  setFornecedorIdFiltro('');
                }} 
                icon={<FilterX className="w-4 h-4" />}
                className="h-11 sm:h-12 text-text-secondary hover:text-error hover:bg-error/10 transition-colors px-3"
              >
                Limpar
              </Button>
            )}
            <Button 
              variant="secondary" 
              onClick={handleExportar} 
              disabled={historicoFiltrado.length === 0}
              icon={<Download className="w-4 h-4" />}
              className="flex-1 xl:flex-none h-11 sm:h-12 bg-info/10 text-info hover:bg-info/20 border-info/20 shadow-sm"
            >
              Gerar BM (Excel)
            </Button>
          </div>
        </div>

      </div>
    }
   />

   {/* 2. SUMÁRIO DA CONSULTA (KPIs Premium) */}
   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
    <Card className="bg-surface border-border/60 flex flex-col justify-center gap-2 p-6 shadow-sm hover:shadow-md transition-shadow group">
     <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
      <DollarSign className="w-4 h-4 text-primary" /> Subtotal do Período/Oficina
     </span>
     <span className="text-3xl font-mono font-black text-text-main truncate group-hover:text-primary transition-colors">
      {totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
     </span>
    </Card>

    <Card className="bg-surface border-border/60 flex flex-col justify-center gap-2 p-6 shadow-sm hover:shadow-md transition-shadow group">
     <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
      <Wrench className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Ordens de Serviço (Fichas)
     </span>
     <span className="text-3xl font-mono font-black text-text-main truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
      {osAbertas} <small className="text-lg font-bold opacity-60 uppercase tracking-widest ml-1">Em Oficina</small>
     </span>
    </Card>
   </div>

   {/* 3. TABELA BLINDADA (CSS Grid + Limpeza de Placa) */}
   <Card padding="none" className="overflow-hidden border-border/60 shadow-sm rounded-3xl bg-surface">
    {loading ? (
     <div className="p-6 sm:p-8 space-y-4">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-surface-hover/50 rounded-xl animate-pulse border border-border/30" />)}
     </div>
    ) : (
     <div className="flex flex-col h-full">
      <ListaResponsiva
       virtualized={true}
       itens={historicoVisivel}
       emptyMessage="Nenhum Registro encontrado com estes filtros."
       // 🚨 NOVO GRID SEM A COLUNA STATUS: Espaço extra para Informação Técnica e Custo
       desktopGridCols="grid-cols-[1.2fr_3fr_1.5fr_1fr_80px]"

       // --- DESKTOP HEADER ---
       desktopHeader={
        <>
         <th className={`${TableStyles.th} justify-start text-left pl-8 py-5`}>Data da OS</th>
         <th className={`${TableStyles.th} justify-start text-left`}>Informação Técnica</th>
         {/* Status Removido Daqui */}
         <th className={`${TableStyles.th} justify-center text-center whitespace-nowrap`}>Custo Financeiro</th>
         <th className={`${TableStyles.th} justify-center text-center whitespace-nowrap`}>Ticket Manutenção</th>
         <th className={`${TableStyles.th} justify-end text-right pr-8`}>Gestão</th>
        </>
       }
       
       // --- DESKTOP ROW ---
       renderDesktop={(os) => (
        <>
         <td className={`${TableStyles.td} justify-start text-left pl-8`}>
          <div className="flex flex-col gap-2 items-start">
           <span className="font-bold text-text-main flex items-center gap-2">
            <Calendar className="w-4 h-4 text-text-muted/60" />
            {DateHelper.getCompleta(os.data)}
           </span>
           {getBadgeTipo(os.tipo)}
          </div>
         </td>

         <td className={`${TableStyles.td} justify-start text-left min-w-0`}>
          <div className="flex flex-col gap-1 max-w-[280px] min-w-0">
           <div className="flex items-center gap-2 min-w-0 truncate">
            {/* Limpeza da Placa na Tabela Desktop */}
            <span className="font-mono font-black text-primary text-base tracking-tight truncate">{extrairPlaca(os.veiculo?.placa || 'N/D')}</span>
            <span className="text-[10px] bg-surface-hover px-1.5 py-0.5 rounded border border-border/60 font-bold uppercase tracking-widest text-text-secondary shrink-0">{os.veiculo?.modelo}</span>
           </div>
           <span className="text-xs text-text-secondary font-medium mt-1 truncate" title={os.fornecedor?.nome}>{os.fornecedor?.nome || 'Oficina Não Registrada'}</span>
           <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold mt-1.5 leading-snug line-clamp-2" title={(os.itens || []).map(i => i.produto.nome).join(', ')}>
            {(os.itens || []).map(i => i.produto.nome).join(', ')}
           </p>
           {os.observacoes && (
            <div className="mt-1.5 text-[10px] text-text-muted italic line-clamp-2 max-w-[200px]" title={os.observacoes}>
             Obs: {os.observacoes}
            </div>
           )}
          </div>
         </td>

         {/* Status Removido Daqui */}

         <td className={`${TableStyles.td} justify-center text-center whitespace-nowrap`}>
          <span className="font-mono font-black text-text-main text-base inline-block w-full">
           {Number(os.custoTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
         </td>

         <td className={`${TableStyles.td} justify-center text-center`}>
          {os.fotoComprovanteUrl ? (
           <Tooltip>
            <TooltipTrigger asChild>
             <Button
              variant="ghost"
              size="icon"
              onClick={() => { setDocParaVisualizar({ url: os.fotoComprovanteUrl || '', titulo: `Manutenção - ${extrairPlaca(os.veiculo?.placa || '')}` }); setZoomNivel(1); }}
              className="h-10 w-10 bg-info/10 text-info hover:bg-info/20 transition-all shadow-sm border border-info/20 group"
              aria-label="Visualizar Nota de Serviço"
             >
              <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
             </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Visualizar Comprovante</TooltipContent>
           </Tooltip>
          ) : (
           <Tooltip>
            <TooltipTrigger asChild>
             <span className="inline-flex items-center justify-center p-2 rounded-xl bg-surface-hover text-text-muted/40 border border-border/50 cursor-not-allowed">
              <FileX className="w-5 h-5" />
             </span>
            </TooltipTrigger>
            <TooltipContent side="top">Sem anexo físico</TooltipContent>
           </Tooltip>
          )}
         </td>

         <td className={`${TableStyles.td} justify-end text-right pr-8`}>
          <DropdownAcoes
           onEditar={canEdit ? () => setEditingOS(os) : undefined}
           onExcluir={canDelete ? () => setDeletingId(os.id) : undefined}
          />
         </td>
        </>
       )}

       // --- MOBILE ---
       renderMobile={(os) => (
        <div className="p-5 flex flex-col gap-4 border-b border-border/60 hover:bg-surface-hover/30 transition-colors">
         <div className="flex justify-between items-start gap-2">
          <div className="flex gap-3 min-w-0 flex-1">
           <div className="bg-surface shadow-sm text-text-main p-2 rounded-xl border border-border/80 flex flex-col items-center justify-center w-14 h-14 shrink-0">
            <span className="text-lg font-black leading-none">{DateHelper.getDia(os.data)}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted mt-0.5">
             {DateHelper.getMesCurto(os.data)}
            </span>
           </div>
           <div className="flex flex-col justify-center min-w-0">
            {/* Limpeza da Placa no Card Mobile */}
            <span className="font-mono font-black text-primary text-lg tracking-tight leading-none block mb-1 truncate">{extrairPlaca(os.veiculo?.placa || 'Sem Placa')}</span>
            <span className="text-xs text-text-secondary font-medium truncate">{os.fornecedor?.nome || 'Oficina não registrada'}</span>
            {os.observacoes && (
              <span className="text-[10px] text-text-muted italic mt-1 line-clamp-2" title={os.observacoes}>
               Obs: {os.observacoes}
              </span>
            )}
           </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0 ml-auto">
           <div className="flex items-center justify-end gap-1 flex-wrap">
            {/* Status Removido Daqui também */}
            <DropdownAcoes
             onEditar={canEdit ? () => setEditingOS(os) : undefined}
             onExcluir={canDelete ? () => setDeletingId(os.id) : undefined}
            />
           </div>
          </div>
         </div>
         <div className="flex justify-between items-center bg-surface-hover/50 p-3 rounded-xl border border-border/40">
          <div className="flex flex-col gap-1.5 items-start">
           <span className="text-[9px] text-text-muted uppercase font-black tracking-widest">Serviço</span>
           {getBadgeTipo(os.tipo)}
          </div>
          <div className="flex flex-col items-end">
           <span className="text-[9px] text-text-muted uppercase font-black tracking-widest mb-1">Custo da OS</span>
           <span className="font-mono font-black text-text-main text-lg tracking-tighter">
            {Number(os.custoTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
           </span>
          </div>
         </div>
         {os.fotoComprovanteUrl && (
          <Button
           variant="secondary"
           className="w-full text-xs font-bold h-11 bg-info/10 text-info border-info/20 hover:bg-info/20 shadow-sm transition-all"
           icon={<FileText className="w-4 h-4" />}
           onClick={() => { setDocParaVisualizar({ url: os.fotoComprovanteUrl || '', titulo: `Manutenção - ${extrairPlaca(os.veiculo?.placa || '')}` }); setZoomNivel(1); }}
          >
           Visualizar Nota de Serviço
          </Button>
         )}
        </div>
       )}
      />

      {historicoVisivel.length < historicoFiltrado.length && (
       <div className="p-6 border-t border-border/60 bg-surface-hover/30 flex justify-center">
        <Button
         variant="secondary"
         onClick={handleCarregarMais}
         className="w-full sm:w-auto bg-surface hover:shadow-md transition-all group"
        >
         Ver mais {Math.min(ITENS_POR_PAGINA, historicoFiltrado.length - historicoVisivel.length)} Fichas
         <ChevronDown className="w-4 h-4 ml-2 text-text-muted group-hover:text-primary transition-colors" />
        </Button>
       </div>
      )}
     </div>
    )}
   </Card>

   {/* --- MODAIS --- */}
   <Modal
    isOpen={isNovaOSOpen}
    onClose={() => setIsNovaOSOpen(false)}
    title="Nova Manutenção"
    className="max-w-3xl"
   >
    {isNovaOSOpen && (
     <FormRegistrarManutencao
      onSuccess={() => { setIsNovaOSOpen(false); fetchHistorico(); }}
      onClose={() => setIsNovaOSOpen(false)}
     />
    )}
   </Modal>

   <Modal
    isOpen={!!editingOS}
    onClose={() => setEditingOS(null)}
    title="Gestão de Manutenção"
    className="max-w-3xl"
   >
    {editingOS && (
     <FormEditarManutencao
      osParaEditar={editingOS}
      onSuccess={() => { setEditingOS(null); fetchHistorico(); }}
      onClose={() => setEditingOS(null)}
     />
    )}
   </Modal>

   <ConfirmModal
    isOpen={!!deletingId}
    onCancel={() => setDeletingId(null)}
    onConfirm={handleDelete}
    title="Eliminar Registro de Oficina"
    description="Esta ação é permanente. Ao apagar, o relatório financeiro e o histórico de manutenções do veículo serão alterados."
    variant="danger"
    confirmLabel="Sim, Apagar Registro"
   />

   {/* 🔮 Visualizador Cinemático de Perícia Documental */}
   {docParaVisualizar && (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-3xl p-4 sm:p-8 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
     
     {/* Top Navigation Bar HUD */}
     <div className="absolute top-0 left-0 w-full flex justify-between items-center p-6 bg-gradient-to-b from-black/80 to-transparent z-50">
      <div className="flex items-center gap-3">
       <div className="w-10 h-10 bg-info/20 flex items-center justify-center rounded-lg border border-info/30 text-info">
        <FileText className="w-5 h-5" />
       </div>
       <div>
        <span className="text-white font-black uppercase text-sm tracking-widest block">{docParaVisualizar.titulo}</span>
        <span className="text-info font-medium text-[10px] uppercase tracking-wider block">Visualizador de Comprovantes</span>
       </div>
      </div>
      <div className="flex gap-2">
       <Button
        type="button"
        variant="ghost"
        className="bg-white/10 hover:bg-white/20 text-white rounded-xl h-11 w-11 touch-target focus-ring"
        onClick={() => setZoomNivel(prev => prev < 4 ? prev + 0.5 : prev)}
        title="Aumentar Zoom"
       >
        <ZoomIn className="w-5 h-5" />
       </Button>
       <Button
        type="button"
        variant="ghost"
        className="bg-white/10 hover:bg-white/20 text-white rounded-xl h-11 w-11 touch-target focus-ring"
        onClick={() => { setDocParaVisualizar(null); setZoomNivel(1); }}
        title="Fechar Visualizador"
       >
        <X className="w-6 h-6" />
       </Button>
      </div>
     </div>

     {/* Imagem/PDF Viewer usando zoom nativo em v4 */}
     <div className="w-full max-w-5xl h-full flex items-center justify-center overflow-auto rounded-3xl mt-16 sm:mt-0 cursor-move scrollbar-thin">
      {docParaVisualizar.url.toLowerCase().includes('.pdf') ? (
       <iframe
        src={`${docParaVisualizar.url}#toolbar=0`}
        className="w-full h-[85vh] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10"
        style={{ zoom: zoomNivel }}
        title={docParaVisualizar.titulo}
       />
      ) : (
       <img
        src={docParaVisualizar.url}
        alt={docParaVisualizar.titulo}
        style={{ zoom: zoomNivel }}
        className="max-h-[85vh] max-w-full object-contain pointer-events-auto rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] filter contrast-125 transition-transform duration-300"
        onDoubleClick={() => setZoomNivel(prev => prev > 1 ? 1 : 2.5)}
        title="Clique duplo para Zoom Rápido"
        draggable={false}
       />
      )}
     </div>

     {/* Dica Floating Bar */}
     <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/60 border border-white/10 text-white font-bold text-[10px] uppercase tracking-widest px-6 py-3 rounded-full flex gap-3 backdrop-blur shadow-2xl items-center pointer-events-none">
      <span className="w-2 h-2 rounded-full bg-info animate-pulse"></span>
      Toque no botão de lupa ou dê duplo-clique na imagem para Inspecionar
     </div>
    </div>
   )}

  </div>
  </PullToRefresh>
 );
}