import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {UserRegistrationDTO, UserService} from './service/user.service';


@Component({
  selector: 'app-cadastro-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cadastro-usuario.component.html'
})
export class CadastroUsuarioComponent {
  private userService = inject(UserService);
  private router = inject(Router);

  erroMensagem = signal<string | null>(null);
  sucessoMensagem = signal<string | null>(null);
  carregando = signal<boolean>(false);

  form = {
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    telefone: ''
  };

  onSubmit() {
    this.carregando.set(true);
    this.erroMensagem.set(null);
    this.sucessoMensagem.set(null);

    const dto: UserRegistrationDTO = { ...this.form };

    this.userService.cadastrarUsuario(dto).subscribe({
      next: () => {
        this.sucessoMensagem.set('Conta criada com sucesso! Redirecionando para a Home...');
        this.carregando.set(false);
        // Limpa o formulário
        this.form = { username: '', email: '', password: '', firstName: '', lastName: '', telefone: '' };
        setTimeout(() => this.router.navigate(['/home']), 2500);
      },
      error: (err) => {
        this.carregando.set(false);
        // Captura a mensagem tratada da exceção Java (IllegalArgumentException)
        this.erroMensagem.set(err.error || 'Erro ao realizar o cadastro. Verifique se os dados estão corretos.');
      }
    });
  }
}
