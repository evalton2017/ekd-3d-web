import { Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {ProdutoService} from '../service/produto.service';
import {CategoriaResponseDTO, CategoriaService} from '../../categorias/service/categoria.service';
import {converterRealParaNumero, formatarParaReal} from '../../../utils/moeda-utils';


@Component({
  selector: 'app-cadastro-produto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cadastro-produto.component.html'
})
export class CadastroProdutoComponent implements OnInit {
  private produtoService = inject(ProdutoService);
  private categoriaService = inject(CategoriaService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  carregando = signal<boolean>(false);
  erroMensagem = signal<string | null>(null);
  sucessoMensagem = signal<string | null>(null);

  imagemSelecionada: File | null = null;
  arquivo3dSelecionado: File | null = null;
  precoVisual = signal<string>('R$ 0,00');


  nomeImagem = signal<string>('Nenhum arquivo de imagem selecionado');
  nomeArquivo3d = signal<string>('Nenhum arquivo 3D (.stl / .3mf) selecionado');

  // Signal para alimentar o select dinamicamente da API Java
  categorias = signal<CategoriaResponseDTO[]>([]);

  form = {
    nome: '',
    descricao: '',
    precoBase: 0,
    categoriaId: null
  };

  ngOnInit(): void {
    this.carregarCategoriasDoBanco();
  }

  onPrecoInput(event: any): void {
    const valorDigitado = event.target.value;

    // 1. Aplica a máscara visual em tempo real no input
    const formatado = formatarParaReal(valorDigitado);
    this.precoVisual.set(formatado);

    // 2. Extrai o número real puro e salva no objeto do formulário
    this.form.precoBase = converterRealParaNumero(formatado);

    this.cdr.markForCheck(); // Zoneless safe
  }

  carregarCategoriasDoBanco(): void {
    this.categoriaService.listarTodas().subscribe({
      next: (dados) => {
        this.categorias.set(dados);
        this.cdr.markForCheck(); // Notifica o Zoneless
      },
      error: () => {
        this.erroMensagem.set('Não foi possível carregar a lista de categorias do servidor.');
        this.cdr.markForCheck();
      }
    });
  }

  onImagemChange(event: any): void {
    const arquivo = event.target.files[0];
    if (arquivo) {
      this.imagemSelecionada = arquivo;
      this.nomeImagem.set(arquivo.name);
      this.cdr.markForCheck();
    }
  }

  onArquivo3dChange(event: any): void {
    const arquivo = event.target.files[0];
    if (arquivo) {
      const extensao = arquivo.name.split('.').pop()?.toLowerCase();
      if (extensao === 'stl' || extensao === '3mf') {
        this.arquivo3dSelecionado = arquivo;
        this.nomeArquivo3d.set(arquivo.name);
        this.erroMensagem.set(null);
      } else {
        this.erroMensagem.set('Formato inválido! Selecione arquivos .stl ou .3mf.');
        this.arquivo3dSelecionado = null;
        this.nomeArquivo3d.set('Nenhum arquivo 3D (.stl / .3mf) selecionado');
      }
      this.cdr.markForCheck();
    }
  }

  onSubmit(): void {
    if (!this.imagemSelecionada || !this.arquivo3dSelecionado) {
      this.erroMensagem.set('Faça o upload da imagem e do modelo 3D.');
      return;
    }

    this.carregando.set(true);
    this.erroMensagem.set(null);
    this.cdr.markForCheck();

    const dadosEnvio = {
      nome: this.form.nome,
      descricao: this.form.descricao,
      precoBase: this.form.precoBase,
      categoriaId: Number(this.form.categoriaId)
    };

    // Consome o método unificado dentro da ProdutoService
    this.produtoService.cadastrarNovoProduto(dadosEnvio, this.imagemSelecionada, this.arquivo3dSelecionado).subscribe({
      next: () => {
        this.sucessoMensagem.set('Modelo 3D cadastrado e salvo no S3!');
        this.carregando.set(false);
        setTimeout(() => this.router.navigate(['/produtos']), 2000);
      },
      error: (err) => {
        this.carregando.set(false);
        this.erroMensagem.set(err.error?.detail || err.error || 'Erro ao cadastrar produto.');
        this.cdr.markForCheck();
      }
    });
  }
}
