import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import Keycloak from 'keycloak-js';
import { RouterModule } from '@angular/router';
import {UserService, UsuarioResponse} from '../cadastro-usuario/service/user.service';

@Component({
  selector: 'app-perfil-usuario',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './perfil-usuario.component.html'
})
export class PerfilUsuarioComponent implements OnInit {
  private userService = inject(UserService);
  private keycloak = inject(Keycloak);

  usuario = signal<UsuarioResponse | null>(null);
  erro = signal<string | null>(null);
  carregando = signal<boolean>(true);

  ngOnInit(): void {
    // Captura o 'sub' (String ID) do Token JWT do Keycloak
    const idKeycloak = this.keycloak.subject;

    if (idKeycloak) {
      this.userService.consultarUsuario(idKeycloak).subscribe({
        next: (dados) => {
          this.usuario.set(dados);
          this.carregando.set(false);
        },
        error: (err) => {
          this.erro.set('Não foi possível carregar as informações do perfil local.');
          this.carregando.set(false);
        }
      });
    } else {
      this.erro.set('Você não está autenticado no sistema.');
      this.carregando.set(false);
    }
  }
}
