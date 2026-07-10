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

    return this.http.get<SpringPageResponse<ProdutoResponseDTO>>(`${this.apiUrl}/consulta`, { params });
  }

  deletarProduto(id: number){
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  cadastrarNovoProduto(dados: any, imagem: File, arquivo3d: File): Observable<string> {
    const formData = new FormData();

    // Cria o Blob JSON para bater exatamente com o @RequestPart("dados") do Spring Boot
    const dadosBlob = new Blob([JSON.stringify(dados)], { type: 'application/json' });
    formData.append('dados', dadosBlob);

    // Anexa as mídias binárias interceptadas pelo input
    formData.append('imagem', imagem);
    formData.append('arquivo3d', arquivo3d);

    // Envia o POST Multipart. O Interceptor anexa o Token JWT automaticamente
    return this.http.post<string>(this.apiUrl, formData, { responseType: 'text' as 'json' });
  }

  buscarPorId(id: number): Observable<ProdutoResponseDTO> {
    return this.http.get<ProdutoResponseDTO>(`${this.apiUrl}/${id}`);
  }

  editarProduto(id: number, dados: any, imagem: File | null, arquivo3d: File | null): Observable<string> {
    const formData = new FormData();
    const dadosBlob = new Blob([JSON.stringify(dados)], { type: 'application/json' });
    formData.append('dados', dadosBlob);

    if (imagem) formData.append('imagem', imagem);
    if (arquivo3d) formData.append('arquivo3d', arquivo3d);

    return this.http.put<string>(`${this.apiUrl}/${id}`, formData, { responseType: 'text' as 'json' });
  }

}
