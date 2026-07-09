import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import Keycloak from 'keycloak-js';
import {LayoutService} from '../layout.service';
import {MENU_ITEMS} from '../dto/menu-item';
import {ItemMenu} from '../dto/item-menu';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html'
})
export class SidebarComponent implements OnInit {
  public layoutService = inject(LayoutService);
  private keycloak = inject(Keycloak);
  private cdr = inject(ChangeDetectorRef);

  menuCompleto: ItemMenu[] = MENU_ITEMS;
  menuFiltrado: ItemMenu[] = [];
  userRoles: string[] = [];
  isLoggedIn = false;

  ngOnInit(): void {
    this.escutarSessaoParaFiltrarMenu();
  }

  escutarSessaoParaFiltrarMenu(): void {
    const processarFiltro = () => {
      this.isLoggedIn = this.keycloak.authenticated ?? false;

      if (this.isLoggedIn && this.keycloak.tokenParsed) {
        const token = this.keycloak.tokenParsed as any;

        // Extrai as roles do Realm e do Client de forma combinada
        const realmRoles = token.realm_access?.roles || [];
        const clientRoles = token.resource_access?.[this.keycloak.clientId ?? '']?.roles || [];
        this.userRoles = [...realmRoles, ...clientRoles].map(r => r.toUpperCase());
      } else {
        this.userRoles = [];
      }

      // Executa a filtragem dos itens do menu
      this.filtrarMenus();
    };

    // Executa imediatamente na inicialização
    processarFiltro();

    // Cria o monitor seguro sincronizado com o tempo de boot do Keycloak
    let ciclo = 0;
    const monitor = setInterval(() => {
      ciclo++;
      processarFiltro();

      // Se detectou o login e montou as roles, ou bateu o limite de tempo, desliga
      if ((this.isLoggedIn && this.userRoles.length > 0) || ciclo > 10) {
        clearInterval(monitor);
      }
    }, 200);
  }

  filtrarMenus(): void {
    this.menuFiltrado = this.menuCompleto.filter(item => {
      // Se o menu exigir mais de um perfil (Ex: ['CLIENTE', 'ADMINISTRADOR']), ele é considerado público
      const isPublicMenu = item.roles.length > 1;

      if (isPublicMenu) {
        return true;
      }

      // Menus privados somem caso o usuário não esteja logado
      if (!this.isLoggedIn) {
        return false;
      }

      // Confere se o perfil do Keycloak mapeia a permissão do menu privado
      return item.roles.some(role => this.userRoles.includes(role.toUpperCase()));
    });

    // Notifica o modo Zoneless para desenhar os novos menus na árvore de componentes
    this.cdr.markForCheck();
  }
}
