import { Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Visualizador3dComponent} from '../../components/visualizador/visualizador.component';
import {ProdutoResponseDTO, ProdutoService} from '../produtos/service/produto.service';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, Visualizador3dComponent],
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {
  private produtoService = inject(ProdutoService);
  private cdr = inject(ChangeDetectorRef);

  produtos = signal<ProdutoResponseDTO[]>([]);

  // CORREÇÃO: Garanta que comece rigorosamente como null e false
  produtoSelecionado = signal<ProdutoResponseDTO | null>(null);
  modalAberto = signal<boolean>(false);
  carregandoLista = signal<boolean>(true);

  paginaAtual = signal<number>(0);
  totalDePaginas = signal<number>(0);
  totalDeItens = signal<number>(0);
  tamanhoPagina = 10;

  ngOnInit(): void {
    this.carregarProdutos();
  }

  carregarProdutos(): void {
    this.carregandoLista.set(true);
    this.cdr.markForCheck();

    this.produtoService.listarPaginado(this.paginaAtual(), this.tamanhoPagina).subscribe({
      next: (response) => {
        this.produtos.set(response.content);
        this.totalDePaginas.set(response.totalPages);
        this.totalDeItens.set(response.totalElements);
        this.carregandoLista.set(false);
        this.cdr.markForCheck(); // Renderiza dados no modo Zoneless
      },
      error: () => {
        this.carregandoLista.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  mudarPagina(novaPagina: number): void {
    if (novaPagina >= 0 && novaPagina < this.totalDePaginas()) {
      this.paginaAtual.set(novaPagina);
      this.carregarProdutos();
      // Scroll suave para o topo da página ao mudar de lote
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  abrirModal3D(produto: ProdutoResponseDTO): void {
    console.log('--- ABRINDO VISUALIZADOR PARA ---', produto.nome);
    this.produtoSelecionado.set(produto);
    this.modalAberto.set(true);
    this.cdr.markForCheck();
  }

  fecharModal3D(): void {
    this.modalAberto.set(false);
    this.produtoSelecionado.set(null);
    this.cdr.markForCheck();
  }
}
