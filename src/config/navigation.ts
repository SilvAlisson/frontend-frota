import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  FileText, 
  Wrench, 
  Briefcase, 
  Package, 
  AlertTriangle, 
  Medal, 
  ClipboardList, 
  Fuel, 
  FileBadge 
} from 'lucide-react';

export interface MenuItem {
  icon: any;
  label: string;
  path: string;
  highlight?: boolean;
}

export interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export const MENU_ITEMS: MenuGroup[] = [
  {
    title: 'Visão Geral',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
      { icon: AlertTriangle, label: 'Alertas', path: '/admin/alertas' },
      { icon: Medal, label: 'Ranking', path: '/admin/ranking' },
    ]
  },
  {
    title: 'Operacional',
    items: [
      { icon: Wrench, label: 'Nova Manutenção', path: '/admin/manutencoes/nova', highlight: true },
      { icon: Fuel, label: 'Novo Abastecimento', path: '/admin/abastecimentos/novo', highlight: true },
      { icon: ClipboardList, label: 'Hist. Manutenções', path: '/admin/manutencoes' },
      { icon: Fuel, label: 'Hist. Abastecimentos', path: '/admin/abastecimentos' },
      { icon: Truck, label: 'Hist. Jornadas', path: '/admin/jornadas' },
      { icon: FileText, label: 'Planos Preventivos', path: '/admin/planos' },
    ]
  },
  {
    title: 'Cadastros',
    items: [
      { icon: Truck, label: 'Veículos', path: '/admin/veiculos' },
      { icon: Users, label: 'Equipe', path: '/admin/usuarios' },
      { icon: FileBadge, label: 'Documentos Legais', path: '/admin/documentos' },
      { icon: Package, label: 'Produtos/Serviços', path: '/admin/produtos' },
      { icon: Users, label: 'Fornecedores', path: '/admin/fornecedores' },
    ]
  }
];