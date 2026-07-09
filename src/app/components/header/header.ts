import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
export class HeaderComponent implements OnInit {
  isLoggedIn = false;
  userName = '';
  userInitials = '';

  public layoutService = inject(LayoutService);
  private keycloak = inject(Keycloak);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.escutarAutenticacaoKeycloak();
  }

  escutarAutenticacaoKeycloak(): void {
    // Como a inicialização do Keycloak roda assíncrona, criamos um observador de segurança
    // que só atualiza quando o token de fato estiver pronto e carregado na memória do cliente
    const checarStatusReal = () => {
      // Verifica se o objeto e as propriedades do token já foram populadas pelo Keycloak
      if (this.keycloak.authenticated && this.keycloak.tokenParsed) {
        this.isLoggedIn = true;
        const token = this.keycloak.tokenParsed as any;
        this.userName = token.name || token.preferred_username || 'Usuário';
        this.gerarIniciais();
        console.log('[Header] Interface atualizada para LOGADO: ', this.userName);
        this.cdr.markForCheck(); // Redesenha a tela com o nome
      } else if (!this.keycloak.authenticated && this.keycloak.tokenParsed === undefined) {
        // Se realmente não houver login após o boot do Keycloak, mantém deslogado
        this.isLoggedIn = false;
        this.userName = '';
        this.userInitials = '';
        this.cdr.markForCheck();
      }
    };

    // Executa uma vez no início
    checarStatusReal();

    // Cria um Polling longo e seguro (a cada 200ms) durante os primeiros 2 segundos de boot da página
    // Isso garante que assim que o app.config inicializar o SSO, o Header acompanha o estado na hora!
    let ciclo = 0;
    const monitor = setInterval(() => {
      ciclo++;
      checarStatusReal();

      // Se estabilizou logado ou se passou de 2 segundos, desliga o monitor para poupar memória
      if (this.isLoggedIn || ciclo > 10) {
        clearInterval(monitor);
      }
    }, 200);
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
    this.keycloak.login();
  }

  logout(): void {
    this.keycloak.logout({ redirectUri: window.location.origin });
  }
}
