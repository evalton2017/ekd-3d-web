import { inject, Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../../../environments/environment';

export interface ItemPedidoResponseDTO {
  id: number;
  nomeModelo: string;
  descricaoCustomizacao: string;
  urlArquivo3d: string;
  precoEstimado: number;
  quantidade: number;
}

export interface PedidoHistoricoResponseDTO {
  id: number;
  statusAnterior: string | null;
  statusNovo: string;
  dataAlteracao: string;
  responsavelNome: string;
}

export interface PedidoMasterResponseDTO {
  id: number;
  clienteNome: string;
  clienteEmail: string;
  status: string;
  dataSolicitacao: string;
  valorTotalPedido: number;
  itens: ItemPedidoResponseDTO[];
  historicos: PedidoHistoricoResponseDTO[];
}

// Interface correspondente à paginação do Spring Boot
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
export class PedidoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.appApiBase}/pedidos`;

  criarPedidoMisto(dadosMaster: any, arquivos: File[]): Observable<string> {
    const formData = new FormData();

    // Envelopa o JSON para bater com o @RequestPart("dados") do Spring
    const dadosBlob = new Blob([JSON.stringify(dadosMaster)], { type: 'application/json' });
    formData.append('dados', dadosBlob);

    // Anexa a lista de arquivos de customização (fotos ou malhas), se houver
    if (arquivos && arquivos.length > 0) {
      arquivos.forEach(file => {
        formData.append('arquivos', file);
      });
    }

    return this.http.post<string>(this.apiUrl, formData, { responseType: 'text' as 'json' });
  }

  atualizarStatusEsteira(pedidoId: number, novoStatus: string): Observable<void> {
    // Passa o status como HttpParam para bater com o @RequestParam do Spring Boot
    return this.http.put<void>(`${this.apiUrl}/${pedidoId}/status`, null, {
      params: { novoStatus }
    });
  }

  listarMeusPedidosPaginado(page: number, size: number): Observable<SpringPageResponse<PedidoMasterResponseDTO>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<SpringPageResponse<PedidoMasterResponseDTO>>(`${this.apiUrl}/cliente/meus`, { params });
  }

  // Listagem do Administrador: Paginada + Filtro Opcional de Período Between
  listarTodosOsPedidosGeraisPaginado(page: number, size: number, dataInicio?: string, dataFim?: string): Observable<SpringPageResponse<PedidoMasterResponseDTO>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (dataInicio) params = params.set('dataInicio', dataInicio);
    if (dataFim) params = params.set('dataFim', dataFim);

    return this.http.get<SpringPageResponse<PedidoMasterResponseDTO>>(`${this.apiUrl}/admin/todos`, { params });
  }


}
