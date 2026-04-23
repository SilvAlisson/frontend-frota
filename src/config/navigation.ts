import {
  LayoutDashboard,
  Truck,
  Users,
  FileText,
  Package,
  AlertTriangle,
  Medal,
  ClipboardList,
  Fuel,
  FileBadge,
  ShieldCheck,
  Briefcase,
  Activity
} from 'lucide-react';

import React from 'react';

export interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  highlight?: boolean;
}

export interface MenuGroup {
  title: string;
  roles?: string[];
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
      { icon: ClipboardList, label: 'Hist. Manutenções', path: '/admin/manutencoes' },
      { icon: Fuel, label: 'Hist. Abastecimentos', path: '/admin/abastecimentos' },
      { icon: Truck, label: 'Hist. Jornadas', path: '/admin/jornadas' },
      { icon: FileText, label: 'Planos Preventivos', path: '/admin/planos' },
    ]
  },
  {
    title: 'Cadastros',
    // Todos os que acedem ao AdminLayout veem este grupo, 
    // mas as permissões internas no Router.tsx (como GestãoUsuarios) barram acessos indevidos.
    items: [
      { icon: Truck, label: 'Veículos', path: '/admin/veiculos' },
      { icon: Users, label: 'Equipe', path: '/admin/usuarios' },
      { icon: Briefcase, label: 'Cargos', path: '/admin/cargos' },
      { icon: FileBadge, label: 'Documentos Legais', path: '/admin/documentos' },
      { icon: Package, label: 'Produtos/Serviços', path: '/admin/produtos' },
      { icon: Users, label: 'Fornecedores', path: '/admin/fornecedores' },
    ]
  },
  {
    title: 'SST',
    roles: ['ADMIN', 'COORDENADOR'],
    items: [
      { icon: ShieldCheck, label: 'Gestão de SST', path: '/admin/sst', highlight: true },
    ]
  },
  
  // Grupo de Sistema focado em monitoramento e TI
  {
    title: 'Sistema',
    roles: ['ADMIN'], 
    items: [
      { icon: Activity, label: 'Auditoria e Logs', path: '/admin/auditoria' }
    ]
  }
];