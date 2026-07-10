import {ChangeDetectorRef, Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import {ProdutoResponseDTO, ProdutoService} from './service/produto.service';
import {CategoriaService} from '../categorias/service/categoria.service';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-produtos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './produtos.component.html'
})
export class ProdutosComponent implements OnInit {
  private produtoService = inject(ProdutoService);
  private cdr = inject(ChangeDetectorRef);

  produtos = signal<ProdutoResponseDTO[]>([]);
  paginaAtual = signal<number>(0);
  totalDePaginas = signal<number>(0);
  totalDeItens = signal<number>(0);
  tamanhoPagina = 8;

  carregando = signal<boolean>(true);
  mensagemSucesso = signal<string | null>(null);

  ngOnInit(): void {
    this.carregaListaAdministrativa();
  }

  carregaListaAdministrativa(): void {
    this.carregando.set(true);
    this.cdr.markForCheck();

    // Consome o método do seu serviço: listarPaginado(page, size)
    this.produtoService.listarPaginado(this.paginaAtual(), this.tamanhoPagina).subscribe({
      next: (response) => {
        this.produtos.set(response.content);
        this.totalDePaginas.set(response.totalPages);
        this.totalDeItens.set(response.totalElements);
        this.carregando.set(false);
        this.cdr.markForCheck(); // Notifica o Zoneless
      },
      error: () => {
        this.carregando.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  mudarPagina(novaPagina: number): void {
    if (novaPagina >= 0 && novaPagina < this.totalDePaginas()) {
      this.paginaAtual.set(novaPagina);
      this.carregaListaAdministrativa();
    }
  }

  deletarProduto(id: number, nome: string): void {
    if (confirm(`Tem certeza absoluta que deseja excluir o modelo "${nome}" do catálogo definitivo da EKD?`)) {
      this.produtoService.deletarProduto(id).subscribe({
        next: () => {
          this.mensagemSucesso.set(`Modelo "${nome}" removido com sucesso.`);
          // Retorna para a página anterior se a exclusão esvaziar o lote atual
          if (this.produtos().length === 1 && this.paginaAtual() > 0) {
            this.paginaAtual.update(p => p - 1);
          }
          this.carregaListaAdministrativa(); // Atualiza os dados na hora
          setTimeout(() => this.mensagemSucesso.set(null), 3000);
        },
        error: () => {
          alert('Falha ao processar a exclusão do produto. Verifique as credenciais no Keycloak.');
        }
      })
    }

  }
}
