import { Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {PedidoService} from '../service/pedido.service';
import {ProdutoResponseDTO, ProdutoService} from '../../produtos/service/produto.service';

interface ItemCarrinhoLocal {
  nomeModelo: string;
  descricaoCustomizacao: string;
  precoEstimado: number;
  quantidade: number;
  produtoCatalogoId: number | null;
  arquivoFisico: File | null;
  nomeArquivoVisual: string;
}

@Component({
  selector: 'app-solicitar-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './solicitar-pedido.component.html'
})
export class SolicitarPedidoComponent implements OnInit {
  private pedidoService = inject(PedidoService);
  private produtoService = inject(ProdutoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  carregando = signal<boolean>(false);
  erro = signal<string | null>(null);

  // Lista global de produtos do banco para alimentar o select do catálogo
  produtosCatalogo = signal<ProdutoResponseDTO[]>([]);

  // Itens adicionados neste lote/carrinho de pedido
  itensCarrinho = signal<ItemCarrinhoLocal[]>([]);

  // Formulário do item que está sendo editado/montado no momento
  itemForm = {
    tipoOrigem: 'catalogo', // 'catalogo' ou 'ideia_livre'
    produtoSelecionadoId: null as number | null,
    nomeModelo: '',
    descricaoCustomizacao: '',
    quantidade: 1,
    precoEstimado: 0
  };

  arquivoUpload: File | null = null;
  nomeArquivoLabel = signal<string>('Anexar foto de referência ou malha 3D (.stl/.3mf)');

  ngOnInit(): void {
    this.carregarProdutosDoBanco();
  }

  carregarProdutosDoBanco(): void {
    // Carrega a lista completa para o select usando a paginação cheia ou método simples
    this.produtoService.listarPaginado(0, 50).subscribe({
      next: (res) => {
        this.produtosCatalogo.set(res.content);
        this.checarParametrosDeEntrada();
      }
    });
  }

  checarParametrosDeEntrada(): void {
    // Se veio do botão "Encomendar Objeto" do modal, captura as propriedades passadas por parâmetro
    const prodId = this.route.snapshot.queryParamMap.get('produtoId');
    if (prodId) {
      const produto = this.produtosCatalogo().find(p => p.id === Number(prodId));
      if (produto) {
        // Monta automaticamente o item vindo do catálogo
        const novoItem: ItemCarrinhoLocal = {
          nomeModelo: produto.nome,
          descricaoCustomizacao: 'Solicitação direta via galeria 3D.',
          precoEstimado: produto.precoBase,
          quantidade: 1,
          produtoCatalogoId: produto.id,
          arquivoFisico: null,
          nomeArquivoVisual: 'Utilizar arquivo 3D original do catálogo'
        };
        this.itensCarrinho.update(lista => [...lista, novoItem]);
        this.cdr.markForCheck();
      }
    }
  }

  onProdutoSelectChange(): void {
    const selecionado = this.produtosCatalogo().find(p => p.id === Number(this.itemForm.produtoSelecionadoId));
    if (selecionado) {
      this.itemForm.nomeModelo = selecionado.nome;
      this.itemForm.precoEstimado = selecionado.precoBase;
    }
    this.cdr.markForCheck();
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.arquivoUpload = file;
      this.nomeArquivoLabel.set(file.name);
      this.cdr.markForCheck();
    }
  }

  adicionarItemLote(): void {
    if (this.itemForm.tipoOrigem === 'ideia_livre' && !this.itemForm.nomeModelo) {
      alert('Por favor, digite o nome do modelo ou ideia.');
      return;
    }

    const novoItem: ItemCarrinhoLocal = {
      nomeModelo: this.itemForm.nomeModelo,
      descricaoCustomizacao: this.itemForm.descricaoCustomizacao,
      precoEstimado: this.itemForm.precoEstimado || 30.00, // Preço base simbólico para ideias customizadas
      quantidade: this.itemForm.quantidade,
      produtoCatalogoId: this.itemForm.tipoOrigem === 'catalogo' ? Number(this.itemForm.produtoSelecionadoId) : null,
      arquivoFisico: this.arquivoUpload,
      nomeArquivoVisual: this.arquivoUpload ? this.arquivoUpload.name : 'Nenhum anexo (Apenas descrição)'
    };

    this.itensCarrinho.update(lista => [...lista, novoItem]);

    // Reseta o formulário auxiliar de inserção
    this.itemForm = { tipoOrigem: 'catalogo', produtoSelecionadoId: null, nomeModelo: '', descricaoCustomizacao: '', quantidade: 1, precoEstimado: 0 };
    this.arquivoUpload = null;
    this.nomeArquivoLabel.set('Anexar foto de referência ou malha 3D (.stl/.3mf)');
    this.cdr.markForCheck();
  }

  removerItemLote(index: number): void {
    this.itensCarrinho.update(lista => lista.filter((_, i) => i !== index));
    this.cdr.markForCheck();
  }

  obterValorTotalLote(): number {
    return this.itensCarrinho().reduce((acc, item) => acc + (item.precoEstimado * item.quantidade), 0);
  }

  fecharEEnviarPedido(): void {
    if (this.itensCarrinho().length === 0) {
      alert('Seu lote de solicitações está vazio!');
      return;
    }

    this.carregando.set(true);
    this.cdr.markForCheck();

    // 1. Monta o DTO Master baseado nas classes Java
    const dadosMaster = {
      itens: this.itensCarrinho().map(item => ({
        nomeModelo: item.nomeModelo,
        descricaoCustomizacao: item.descricaoCustomizacao,
        precoEstimado: item.precoEstimado,
        quantidade: item.quantidade,
        produtoCatalogoId: item.produtoCatalogoId
      }))
    };

    // 2. Filtra e separa os arquivos físicos respeitando a mesma ordem dos itens
    const listaArquivos: File[] = this.itensCarrinho()
      .map(item => item.arquivoFisico)
      .filter((file): file is File => file !== null);

    // 3. Despacha o Multipart completo para a API
    this.pedidoService.criarPedidoMisto(dadosMaster, listaArquivos).subscribe({
      next: () => {
        this.carregando.set(false);
        this.router.navigate(['/encomenda-cliente']);
      },
      error: (err) => {
        this.carregando.set(false);
        this.erro.set(err.error?.detail || 'Erro ao processar lote de pedidos.');
        this.cdr.markForCheck();
      }
    });
  }
}
