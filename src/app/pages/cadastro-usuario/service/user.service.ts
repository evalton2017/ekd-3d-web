import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../../../environments/environment';


// Interfaces baseadas no DTO Java que criamos
export interface UserRegistrationDTO {
  username: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  telefone?: string;
}

export interface UsuarioResponse {
  idKeycloak: string;
  nome: string;
  email: string;
  telefone?: string;
  perfil: string;
  dataCriacao: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.appApiBase}/usuarios`;

  // Endpoint: POST /api/v1/usuarios/cadastro
  cadastrarUsuario(dto: UserRegistrationDTO): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/cadastro`, dto, { responseType: 'text' as 'json' });
  }

  // Endpoint: GET /api/v1/usuarios/consulta?idKeycloak=...
  consultarUsuario(idKeycloak: string): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.apiUrl}/consulta/${idKeycloak}`);
  }
}
