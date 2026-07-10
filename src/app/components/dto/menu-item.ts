import { ItemMenu } from './item-menu';

export const MENU_ITEMS: ItemMenu[] = [
  // PÚBLICO: Aparece sempre (com ou sem autenticação)
  {
    route: '/home',
    label: 'Dashboard',
    icon: 'space_dashboard',
    roles: ['CLIENTE', 'ADMINISTRADOR']
  },
  // PRIVADO: Aparece apenas para CLIENTE autenticado
  {
    route: '/encomenda-cliente',
    label: 'Encomendas',
    icon: 'assignment_ind',
    roles: ['CLIENTE']
  },
  // PRIVADO: Aparece apenas para ADMINISTRADOR autenticado
  {
    route: '/produtos',
    label: 'Produtos',
    icon: 'view_in_ar',
    roles: ['ADMINISTRADOR']
  },
  {
    route: '/admin/encomendas',
    label: 'Painel Encomendas',
    icon: 'admin_panel_settings',
    roles: ['ADMINISTRADOR']
  },
  {
    route: '/categorias',
    label: 'Categorias',
    icon: 'category',
    roles: ['ADMINISTRADOR']
  },
  // ROTAS PUBLICAS
  {
    route: '/solicitar-pedido',
    label: 'Personalize sua ideia',
    icon: 'psychology',
    roles: ['CLIENTE', 'ADMINISTRADOR']
  },
  {
    route: '/politica-privacidade',
    label: 'Politica de Privacidade',
    icon: 'gavel',
    roles: ['CLIENTE', 'ADMINISTRADOR']
  },
];
