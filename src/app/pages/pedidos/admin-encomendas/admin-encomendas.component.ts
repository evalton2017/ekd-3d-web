import { Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {PedidoMasterResponseDTO, PedidoService} from '../service/pedido.service';


@Component({
  selector: 'app-admin-encomendas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-encomendas.component.html'
})
export class AdminEncomendasComponent implements OnInit {
  private pedidoService = inject(PedidoService);
  private cdr = inject(ChangeDetectorRef);

  pedidos = signal<PedidoMasterResponseDTO[]>([]);
  carregando = signal<boolean>(true);
  pedidoExpandidoId = signal<number | null>(null);
  mensagemSucesso = signal<string | null>(null);
  listaStatus = ['SOLICITADO', 'RECEBIDO', 'FABRICANDO', 'PREPARANDO_ENVIO', 'ENVIADO', 'ENTREGUE'];

  paginaAtual = signal<number>(0);
  totalDePaginas = signal<number>(0);
  tamanhoPagina = 10;

  filtroDataInicio = '';
  filtroDataFim = '';

  ngOnInit(): void {
    this.carregarFilaDePedidos();
  }

  carregarFilaDePedidos(): void {
    this.carregando.set(true);
    this.cdr.markForCheck();

    // Formata os parâmetros de data apenas se preenchidos
    const inicioIso = this.filtroDataInicio ? `${this.filtroDataInicio}T00:00:00` : undefined;
    const fimIso = this.filtroDataFim ? `${this.filtroDataFim}T23:59:59` : undefined;

    this.pedidoService.listarTodosOsPedidosGeraisPaginado(this.paginaAtual(), this.tamanhoPagina, inicioIso, fimIso).subscribe({
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

  aplicarFiltros(): void {
    this.paginaAtual.set(0); // Sempre reseta para a primeira página ao aplicar novo filtro
    this.carregarFilaDePedidos();
  }

  limparFiltros(): void {
    this.filtroDataInicio = '';
    this.filtroDataFim = '';
    this.paginaAtual.set(0);
    this.carregarFilaDePedidos();
  }

  mudarPagina(novaPagina: number): void {
    if (novaPagina >= 0 && novaPagina < this.totalDePaginas()) {
      this.paginaAtual.set(novaPagina);
      this.carregarFilaDePedidos();
    }
  }

  alternarExpansao(id: number): void {
    this.pedidoExpandidoId.set(this.pedidoExpandidoId() === id ? null : id);
    this.cdr.markForCheck();
  }

  onStatusChange(pedidoId: number, novoStatus: string): void {
    this.pedidoService.atualizarStatusEsteira(pedidoId, novoStatus).subscribe({
      next: () => {
        this.mensagemSucesso.set(`Pedido #${pedidoId} atualizado para ${novoStatus} com sucesso!`);
        this.carregarFilaDePedidos(); // Recarrega a tabela e a linha do tempo na hora

        setTimeout(() => {
          this.mensagemSucesso.set(null);
          this.cdr.markForCheck();
        }, 3500);
      },
      error: () => {
        alert('Erro ao tentar atualizar o status na API. Verifique as credenciais administrativas.');
      }
    });
  }

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
