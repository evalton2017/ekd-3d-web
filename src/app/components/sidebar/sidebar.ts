import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import Keycloak from 'keycloak-js';
import { LayoutService } from '../layout.service';
import { MENU_ITEMS } from '../dto/menu-item';
import { ItemMenu } from '../dto/item-menu';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html'
})
export class SidebarComponent implements OnInit, OnDestroy {
  public layoutService = inject(LayoutService);
  private readonly keycloak = inject(Keycloak);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly platformId = inject(PLATFORM_ID); // Injeta o detector de plataforma

  menuCompleto: ItemMenu[] = MENU_ITEMS;
  menuFiltrado: ItemMenu[] = [];
  userRoles: string[] = [];
  isLoggedIn = false;
  isBrowser = false; // Flag protetora para o SSR

  private monitorTimer: any;

  ngOnInit(): void {
    // Só executa a escuta e manipulação de sessão se estiver rodando no Browser
    if (isPlatformBrowser(this.platformId)) {
      this.isBrowser = true;
      this.escutarSessaoParaFiltrarMenu();
    } else {
      // Se for o Servidor (SSR), deixa apenas os menus 100% públicos visíveis de início
      this.filtrarMenus();
    }
  }

  ngOnDestroy(): void {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
    }
  }

  escutarSessaoParaFiltrarMenu(): void {
    const processarFiltro = () => {
      this.isLoggedIn = this.keycloak.authenticated ?? false;

      if (this.isLoggedIn && this.keycloak.tokenParsed) {
        const token = this.keycloak.tokenParsed as any;

        const realmRoles = token.realm_access?.roles || [];
        const clientRoles = token.resource_access?.[this.keycloak.clientId ?? '']?.roles || [];
        this.userRoles = [...realmRoles, ...clientRoles].map(r => r.toUpperCase());
      } else {
        this.userRoles = [];
      }

      this.filtrarMenus();
    };

    // Executa imediatamente na inicialização do navegador
    processarFiltro();

    let ciclo = 0;
    this.monitorTimer = setInterval(() => {
      ciclo++;
      processarFiltro();

      // No F5, estendemos para até 25 ciclos (5 segundos) para esperar o Keycloak injetar o tokenParsed
      if ((this.isLoggedIn && this.userRoles.length > 0) || ciclo > 25) {
        clearInterval(this.monitorTimer);
      }
    }, 200);
  }

  filtrarMenus(): void {
    this.menuFiltrado = this.menuCompleto.filter(item => {
      const isPublicMenu = item.roles.length > 1;

      if (isPublicMenu) {
        return true;
      }

      if (!this.isLoggedIn) {
        return false;
      }

      return item.roles.some(role => this.userRoles.includes(role.toUpperCase()));
    });
    
    this.cdr.detectChanges();
  }
}
