import {Routes} from '@angular/router';
import {authGuard} from './auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent)
  },
  {
    path: 'produtos',
    loadComponent: () => import('./pages/produtos/produtos.component').then(m => m.ProdutosComponent),
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR'] }
  },
  {
    path: 'admin/produtos/novo',
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR'] },
    loadComponent: () => import('./pages/produtos/cadastro-produto/cadastro-produto.component').then(m => m.CadastroProdutoComponent),
  },
  {
    path: 'produtos/editar/:id',
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR'] },
    loadComponent: () => import('./pages/produtos/editar-produto/editar-produto.component').then(m => m.EditarProdutoComponent)
  },
  {
    path: 'encomenda-cliente',
    canActivate: [authGuard],
    data: { roles: ['CLIENTE'] },
    loadComponent: () => import('./pages/pedidos/encomendas/encomendas.component').then(m => m.EncomendasComponent)
  },
  {
    path: 'admin/encomendas',
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR'] },
    loadComponent: () => import('./pages/pedidos/admin-encomendas/admin-encomendas.component').then(m => m.AdminEncomendasComponent)
  },
  {
    path: 'solicitar-pedido',
    canActivate: [authGuard],
    data: { roles: ['CLIENTE', 'ADMINISTRADOR'] },
    loadComponent: () => import('./pages/pedidos/solicitar-pedido/solicitar-pedido.component').then(m => m.SolicitarPedidoComponent)
  },
  {
    path: 'usuarios/cadastro',
    loadComponent: () => import('./pages/cadastro-usuario/cadastro-usuario.component').then(m => m.CadastroUsuarioComponent)
  },
  {
    path: 'usuarios/perfil',
    loadComponent: () => import('./pages/perfil-usuario/perfil-usuario.component').then(m => m.PerfilUsuarioComponent)
  },
  {
    path: 'politica-privacidade',
    loadComponent: () => import('./pages/politica-privacidade/politica-privacidade.component')
      .then(m => m.PoliticaPrivacidadeComponent)
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
