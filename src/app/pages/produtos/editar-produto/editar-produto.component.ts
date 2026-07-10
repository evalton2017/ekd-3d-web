import { Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {ProdutoService} from '../service/produto.service';
import {CategoriaResponseDTO, CategoriaService} from '../../categorias/service/categoria.service';
import {converterRealParaNumero, formatarParaReal} from '../../../utils/moeda-utils';


@Component({
  selector: 'app-editar-produto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './editar-produto.component.html'
})
export class EditarProdutoComponent implements OnInit {
  private produtoService = inject(ProdutoService);
  private categoriaService = inject(CategoriaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  produtoId!: number;
  carregando = signal<boolean>(true);
  salvando = signal<boolean>(false);
  erroMensagem = signal<string | null>(null);
  sucessoMensagem = signal<string | null>(null);
  precoVisual = signal<string>('R$ 0,00');

  imagemSelecionada: File | null = null;
  arquivo3dSelecionado: File | null = null;
  nomeImagem = signal<string>('Manter imagem preview atual');
  nomeArquivo3d = signal<string>('Manter arquivo 3D atual');

  categorias = signal<CategoriaResponseDTO[]>([]);

  form = {
    nome: '',
    descricao: '',
    precoBase: 0,
    categoriaId: 0
  };

  ngOnInit(): void {
    this.produtoId = Number(this.route.snapshot.paramMap.get('id'));
    this.carregarDadosIniciais();
  }

  onPrecoInput(event: any): void {
    const formatado = formatarParaReal(event.target.value);
    this.precoVisual.set(formatado);
    this.form.precoBase = converterRealParaNumero(formatado);
    this.cdr.markForCheck();
  }

  carregarDadosIniciais(): void {
    this.categoriaService.listarTodas().subscribe({
      next: (cats) => {
        this.categorias.set(cats);

        // Busca os dados do produto para preencher o formulário
        this.produtoService.buscarPorId(this.produtoId).subscribe({
          next: (prod) => {
            this.form = {
              nome: prod.nome,
              descricao: prod.descricao,
              precoBase: prod.precoBase,
              categoriaId: prod.categoriaId
            };
            this.precoVisual.set(formatarParaReal(prod.precoBase.toFixed(2)));
            this.carregando.set(false);
            this.cdr.markForCheck();
          },
          error: () => {
            this.erroMensagem.set('Falha ao carregar metadados do produto.');
            this.carregando.set(false);
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  onImagemChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.imagemSelecionada = file;
      this.nomeImagem.set(file.name);
      this.cdr.markForCheck();
    }
  }

  onArquivo3dChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'stl' || ext === '3mf') {
        this.arquivo3dSelecionado = file;
        this.nomeArquivo3d.set(file.name);
      } else {
        alert('Formato inválido! Selecione .stl ou .3mf');
      }
      this.cdr.markForCheck();
    }
  }

  onSubmit(): void {
    this.salvando.set(true);
    this.cdr.markForCheck();

    const dadosEnvio = {
      nome: this.form.nome,
      descricao: this.form.descricao,
      precoBase: this.form.precoBase,
      categoriaId: Number(this.form.categoriaId)
    };

    this.produtoService.editarProduto(this.produtoId, dadosEnvio, this.imagemSelecionada, this.arquivo3dSelecionado).subscribe({
      next: () => {
        this.sucessoMensagem.set('Produto atualizado com sucesso!');
        this.salvando.set(false);
        setTimeout(() => this.router.navigate(['/produtos']), 1500);
      },
      error: (err) => {
        this.salvando.set(false);
        this.erroMensagem.set(err.error || 'Erro ao salvar alterações.');
        this.cdr.markForCheck();
      }
    });
  }
}
