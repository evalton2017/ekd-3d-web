import { Component, inject, ChangeDetectorRef, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LayoutService } from '../layout.service';
import Keycloak from 'keycloak-js';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  userName = '';
  userInitials = '';
  isBrowser = false;

  public layoutService = inject(LayoutService);
  private readonly keycloak = inject(Keycloak);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly platformId = inject(PLATFORM_ID);

  private monitorTimer: any;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isBrowser = true;
      this.escutarAutenticacaoKeycloak();
    }
  }

  ngOnDestroy(): void {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
    }
  }

  escutarAutenticacaoKeycloak(): void {
    const processarDadosDeAutenticacao = () => {
      // Se o Keycloak já resolveu a autenticação no APP_INITIALIZER, captura na hora
      if (this.keycloak.authenticated && this.keycloak.tokenParsed) {
        this.isLoggedIn = true;
        const token = this.keycloak.tokenParsed as any;
        this.userName = token.name ?? token.preferred_username ?? 'Usuário';
        this.gerarIniciais();

        // Executa a filtragem caso estejamos na sidebar
        if (typeof (this as any).filtrarMenus === 'function') {
          (this as any).filtrarMenus();
        }

        this.cdr.detectChanges();
        return true;
      }
      return false;
    };

    // 1. Vincula os ouvintes de eventos para navegações ou logins futuros
    this.keycloak.onAuthSuccess = () => processarDadosDeAutenticacao();
    this.keycloak.onAuthRefreshSuccess = () => processarDadosDeAutenticacao();

    // 2. TENTA PROCESSAR IMEDIATAMENTE (Como o APP_INITIALIZER já rodou, isso vai bater True na hora)
    const jaEstavaLogado = processarDadosDeAutenticacao();
    if (jaEstavaLogado) return; // Encerra aqui se resolveu direto

    // 3. Contingência de segurança rápida (apenas se houver delay extremo no token)
    let ciclo = 0;
    this.monitorTimer = setInterval(() => {
      ciclo++;
      const logou = processarDadosDeAutenticacao();

      if (logou || ciclo > 10) {
        clearInterval(this.monitorTimer);

        if (!logou) {
          this.isLoggedIn = false;
          if (typeof (this as any).filtrarMenus === 'function') {
            (this as any).filtrarMenus();
          }
          this.cdr.detectChanges();
        }
      }
    }, 150);
  }

  gerarIniciais(): void {
    if (!this.userName) return;
    const partesDoNome = this.userName.trim().split(' ');
    if (partesDoNome.length > 1) {
      const primeiraLetra = partesDoNome[0].charAt(0);
      const ultimaLetra = partesDoNome[partesDoNome.length - 1].charAt(0);
      this.userInitials = (primeiraLetra + ultimaLetra).toUpperCase();
    } else {
      this.userInitials = this.userName.substring(0, 2).toUpperCase();
    }
  }

  login(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.keycloak.login({
      redirectUri: window.location.origin + '/ekd-3d-web/home'
    });
  }

  logout(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.keycloak.logout({
      redirectUri: window.location.origin + '/ekd-3d-web/'
    });
  }
}
