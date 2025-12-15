import { useState } from 'react';
import { FormRegistrarManutencao } from './forms/FormRegistrarManutencao';
import { DashboardRelatorios } from './DashboardRelatorios';
import { FormPlanoManutencao } from './forms/FormPlanoManutencao';
import { PainelAlertas } from './PainelAlertas';
import { RankingOperadores } from './RankingOperadores';
import { HistoricoAbastecimentos } from './HistoricoAbastecimentos';
import { HistoricoManutencoes } from './HistoricoManutencoes';
import { HistoricoJornadas } from './HistoricoJornadas';
import { GestaoUsuarios } from './GestaoUsuarios';
import { GestaoVeiculos } from './GestaoVeiculos';
import { GestaoProdutos } from './GestaoProdutos';
import { GestaoFornecedores } from './GestaoFornecedores';
import { GestaoCargos } from './GestaoCargos';
import { RegistrarAbastecimento } from './RegistrarAbastecimento';
import { ModalRelatorioFinanceiro } from './ModalRelatorioFinanceiro';
import { Button } from './ui/Button';
import { ModalGerenciarServicos } from './ModalGerenciarServicos';

// Ícones (Simplificados para leitura e reutilização)
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

// Ícones originais do Dashboard (Mantidos para o menu)
const Icons = {
  Dashboard: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>,
  Alertas: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>,
  Operacao: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.25 2.25 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.5 2.5 0 0 1-2.88 1.132l-3.128-.686a1 1 0 0 1-.602-.602l-.686-3.128a2.5 2.5 0 0 1 1.132-2.88L6.25 10" /></svg>,
  Cadastros: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>,
};

interface AdminDashboardProps {
  veiculos: any[];
  produtos: any[];
  fornecedores: any[];
  usuarios: any[];
  adminUserId: string;
}

type CategoriaMenu = 'VISAO_GERAL' | 'OPERACIONAL' | 'CADASTROS' | 'FINANCEIRO';

export function AdminDashboard({
  veiculos,
  produtos,
  fornecedores,
  usuarios,
  adminUserId
}: AdminDashboardProps) {

  // Estado principal de navegação
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaMenu>('VISAO_GERAL');
  const [viewAtiva, setViewAtiva] = useState<string>('dashboard');

  const [financeiroAberto, setFinanceiroAberto] = useState(false);
  const [modalServicosOpen, setModalServicosOpen] = useState(false);
  
  // Controle do Menu Mobile (Drawer)
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  // Função centralizada de navegação: muda a tela e fecha o menu (se estiver no mobile)
  const handleNavegacao = (cat: CategoriaMenu, view: string) => {
    setCategoriaAtiva(cat);
    setViewAtiva(view);
    setMenuMobileAberto(false); // Fecha a gaveta automaticamente
  };

  const handleDrillDown = (tipo: 'ABASTECIMENTO' | 'MANUTENCAO' | 'JORNADA' | 'GERAL') => {
    const mapa: Record<string, string> = {
      'ABASTECIMENTO': 'hist_abastecimento',
      'MANUTENCAO': 'hist_manutencao',
      'JORNADA': 'hist_jornada',
      'GERAL': 'dashboard'
    };
    // Reutiliza handleNavegacao para garantir o comportamento correto
    handleNavegacao('OPERACIONAL', mapa[tipo]);
  };

  const renderContent = () => {
    switch (viewAtiva) {
      // Visão Geral
      case 'dashboard': return <DashboardRelatorios veiculos={veiculos} onDrillDown={handleDrillDown} />;
      case 'alertas': return <PainelAlertas />;
      case 'ranking': return <RankingOperadores />;

      // Operacional
      case 'nova_os': return (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="secondary"
              onClick={() => setModalServicosOpen(true)}
              className="text-xs h-8 shadow-sm border border-gray-200"
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>}
            >
              Catálogo de Serviços
            </Button>
          </div>
          <FormRegistrarManutencao veiculos={veiculos} produtos={produtos} fornecedores={fornecedores} />
        </div>
      );
      case 'nova_jornada': return <div className="text-center py-10 text-gray-500">Funcionalidade no App Mobile</div>;
      case 'novo_abastecimento': return <RegistrarAbastecimento usuarios={usuarios} veiculos={veiculos} produtos={produtos} fornecedores={fornecedores} />;
      
      case 'hist_jornada': return <HistoricoJornadas veiculos={veiculos} userRole="ADMIN" />;
      case 'hist_abastecimento': return <HistoricoAbastecimentos userRole="ADMIN" veiculos={veiculos} />;
      case 'hist_manutencao': return <HistoricoManutencoes userRole="ADMIN" veiculos={veiculos} produtos={produtos} fornecedores={fornecedores} />;
      case 'planos': return <FormPlanoManutencao veiculos={veiculos} />;

      // Cadastros
      case 'cad_veiculos': return <GestaoVeiculos />;
      case 'cad_pessoas': return <GestaoUsuarios adminUserId={adminUserId} />;
      case 'cad_cargos': return <GestaoCargos />;
      case 'cad_parceiros': return <GestaoFornecedores />;
      case 'cad_catalogo': return <GestaoProdutos />;

      default: return null;
    }
  };

  // Componente interno para os links do menu (DRY - Don't Repeat Yourself)
  // Isso evita duplicar o código do menu para a versão Desktop e Mobile
  const MenuLinks = () => (
    <div className="flex flex-col gap-6">
      {/* Bloco Visão Geral */}
      <div>
        <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 px-2 transition-colors ${categoriaAtiva === 'VISAO_GERAL' ? 'text-primary' : 'text-gray-400'}`}>Visão Geral</h4>
        <div className="space-y-1">
          <MenuButton active={viewAtiva === 'dashboard'} onClick={() => handleNavegacao('VISAO_GERAL', 'dashboard')} icon={Icons.Dashboard} label="Dashboard" />
          <MenuButton active={viewAtiva === 'alertas'} onClick={() => handleNavegacao('VISAO_GERAL', 'alertas')} icon={Icons.Alertas} label="Alertas e Avisos" />
          <MenuButton active={viewAtiva === 'ranking'} onClick={() => handleNavegacao('VISAO_GERAL', 'ranking')} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0V5.625a1.125 1.125 0 0 0-1.125-1.125h-2.75a1.125 1.125 0 0 0-1.125 1.125v8.625" /></svg>} label="Ranking" />
        </div>
      </div>

      {/* Bloco Operacional */}
      <div>
        <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 px-2 transition-colors ${categoriaAtiva === 'OPERACIONAL' ? 'text-primary' : 'text-gray-400'}`}>Operacional</h4>
        <div className="space-y-1">
          <MenuButton active={viewAtiva === 'nova_os'} onClick={() => handleNavegacao('OPERACIONAL', 'nova_os')} icon={Icons.Operacao} label="Nova Manutenção" />
          <MenuButton active={viewAtiva === 'novo_abastecimento'} onClick={() => handleNavegacao('OPERACIONAL', 'novo_abastecimento')} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>} label="Novo Abastecimento" />

          <div className="pt-2 pb-1 border-t border-gray-100 my-1"></div>

          <MenuButton active={viewAtiva === 'hist_manutencao'} onClick={() => handleNavegacao('OPERACIONAL', 'hist_manutencao')} label="Histórico OS" small />
          <MenuButton active={viewAtiva === 'hist_abastecimento'} onClick={() => handleNavegacao('OPERACIONAL', 'hist_abastecimento')} label="Histórico Abast." small />
          <MenuButton active={viewAtiva === 'hist_jornada'} onClick={() => handleNavegacao('OPERACIONAL', 'hist_jornada')} label="Histórico Jornadas" small />
          <MenuButton active={viewAtiva === 'planos'} onClick={() => handleNavegacao('OPERACIONAL', 'planos')} label="Planos Preventivos" small />
        </div>
      </div>

      {/* Bloco Cadastros */}
      <div>
        <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 px-2 transition-colors ${categoriaAtiva === 'CADASTROS' ? 'text-primary' : 'text-gray-400'}`}>Cadastros</h4>
        <div className="space-y-1">
          <MenuButton active={viewAtiva === 'cad_veiculos'} onClick={() => handleNavegacao('CADASTROS', 'cad_veiculos')} icon={Icons.Cadastros} label="Veículos" />
          <MenuButton active={viewAtiva === 'cad_pessoas'} onClick={() => handleNavegacao('CADASTROS', 'cad_pessoas')} label="Equipe & Acessos" />
          <MenuButton active={viewAtiva === 'cad_cargos'} onClick={() => handleNavegacao('CADASTROS', 'cad_cargos')} label="Cargos & Treinamentos" />

          <div className="pt-2 pb-1 border-t border-gray-100 my-1"></div>

          <MenuButton active={viewAtiva === 'cad_parceiros'} onClick={() => handleNavegacao('CADASTROS', 'cad_parceiros')} label="Parceiros (Oficina/Posto)" highlight />
          <MenuButton active={viewAtiva === 'cad_catalogo'} onClick={() => handleNavegacao('CADASTROS', 'cad_catalogo')} label="Catálogo (Serviços/Peças)" highlight />
        </div>
      </div>

      {/* Botão Financeiro Destacado */}
      <div className="mt-auto pt-4 border-t border-gray-100">
        <Button
          variant="secondary"
          onClick={() => { setFinanceiroAberto(true); setMenuMobileAberto(false); }}
          className="w-full justify-center py-3 shadow-md border-primary/20 text-primary bg-primary/5 hover:bg-primary/10"
        >
          💰 Inteligência Financeira
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-[80vh] relative">

      {/* 1. BOTÃO FLUTUANTE/TOPO PARA MOBILE (Só aparece em telas pequenas - md:hidden) */}
      <div className="md:hidden mb-2">
        <Button 
          onClick={() => setMenuMobileAberto(true)} 
          variant="secondary" 
          className="w-full justify-between shadow-sm border border-gray-200" 
          icon={<MenuIcon />}
        >
            Menu de Gestão
        </Button>
      </div>

      {/* 2. SIDEBAR DESKTOP (Fixo, visível apenas em telas médias ou maiores - hidden md:flex) */}
      <aside className="hidden md:flex w-64 bg-white rounded-2xl shadow-card border border-gray-100 p-4 flex-col gap-6 sticky top-6 h-fit shrink-0">
        <MenuLinks />
      </aside>

      {/* 3. SIDEBAR MOBILE (Overlay / Gaveta) */}
      {/* Fica invisível por padrão, só renderiza se menuMobileAberto for true */}
      {menuMobileAberto && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Fundo escuro (Backdrop) que fecha o menu ao clicar fora */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setMenuMobileAberto(false)}
          ></div>
          
          {/* O Menu em si (Desliza da esquerda) */}
          <aside className="absolute inset-y-0 left-0 w-[85%] max-w-xs bg-white shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-left duration-300">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <span className="font-bold text-lg text-gray-800">Menu de Gestão</span>
                <button onClick={() => setMenuMobileAberto(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                    <CloseIcon />
                </button>
            </div>
            <MenuLinks />
          </aside>
        </div>
      )}

      {/* 4. ÁREA DE CONTEÚDO */}
      {/* max-w-full e overflow-hidden impedem que o conteúdo "vaze" lateralmente */}
      <main className="flex-1 bg-white rounded-2xl shadow-card border border-gray-100 p-4 sm:p-6 min-h-[600px] w-full max-w-full overflow-x-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
        {renderContent()}
      </main>

      {/* MODAIS */}
      {financeiroAberto && (
        <ModalRelatorioFinanceiro
          onClose={() => setFinanceiroAberto(false)}
          veiculos={veiculos}
        />
      )}

      {modalServicosOpen && (
        <ModalGerenciarServicos onClose={() => setModalServicosOpen(false)} />
      )}
    </div>
  );
}

// Componente auxiliar de botão do menu (Mantido)
function MenuButton({ active, onClick, icon, label, small, highlight }: any) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200
        ${active ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}
        ${small ? 'text-xs pl-4' : 'text-sm font-medium'}
        ${highlight && !active ? 'text-blue-600 font-bold bg-blue-50/50 hover:bg-blue-50' : ''}
      `}
    >
      {icon && <span className={`${active ? 'text-white' : 'text-gray-400'}`}>{icon}</span>}
      {label}
    </button>
  );
}