import { inject, Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../../../environments/environment';

export interface ProdutoResponseDTO {
  id: number;
  nome: string;
  descricao: string;
  precoBase: number;
  urlImagemPreview: string;
  urlArquivo3d: string;
  categoriaId: number;
  categoriaNome: string;
}


export interface SpringPageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class ProdutoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.appApiBase}/produtos`;

  listarPaginado(page: number, size: number, nome?: string, categoriaId?: number): Observable<SpringPageResponse<ProdutoResponseDTO>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (nome) params = params.set('nome', nome);
    if (categoriaId) params = params.set('categoriaId', categoriaId.toString());

    return this.http.get<SpringPageResponse<ProdutoResponseDTO>>(this.apiUrl, { params });
  }
}
