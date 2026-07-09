import { Routes } from '@angular/router';
import {authGuard} from './auth/auth.guard';
import {DashboardComponent} from './pages/dashboard/dashboard';

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
    loadComponent: () => import('./pages/produtos/produtos.component').then(m => m.ProdutosComponent)
  },
  {
    path: 'encomenda-cliente',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/encomendas/cliente/encomendas.component').then(m => m.EncomendasComponent)
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
    path: '**',
    redirectTo: 'home'
  }
];
