import { Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {PedidoMasterResponseDTO, PedidoService} from '../service/pedido.service';


@Component({
  selector: 'app-encomendas',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './encomendas.component.html'
})
export class EncomendasComponent implements OnInit {
  private pedidoService = inject(PedidoService);
  private cdr = inject(ChangeDetectorRef);

  pedidos = signal<PedidoMasterResponseDTO[]>([]);
  carregando = signal<boolean>(true);
  pedidoExpandidoId = signal<number | null>(null);

  paginaAtual = signal<number>(0);
  totalDePaginas = signal<number>(0);
  tamanhoPagina = 5;

  ngOnInit(): void {
    this.carregarHistoricoDePedidos();
  }

  carregarHistoricoDePedidos(): void {
    this.carregando.set(true);
    this.cdr.markForCheck();

    this.pedidoService.listarMeusPedidosPaginado(this.paginaAtual(), this.tamanhoPagina).subscribe({
      next: (response) => {
        this.pedidos.set(response.content);
        this.totalDePaginas.set(response.totalPages);
        this.carregando.set(false);
        this.cdr.markForCheck();
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
      this.carregarHistoricoDePedidos();
    }
  }

  alternarExpansaoPedido(id: number): void {
    if (this.pedidoExpandidoId() === id) {
      this.pedidoExpandidoId.set(null); // Fecha se clicar no mesmo
    } else {
      this.pedidoExpandidoId.set(id); // Abre o selecionado
    }
    this.cdr.markForCheck();
  }

  // Helper visual para pintar as tags de status da esteira de produção
  obterClasseStatus(status: string): string {
    switch (status) {
      case 'SOLICITADO': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'RECEBIDO': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'FABRICANDO': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'PREPARANDO_ENVIO': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'ENVIADO': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'ENTREGUE': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  }
}
