import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Artist,
  ArtistFormValue,
  Music,
  MusicFormValue,
  MusicGenre,
  MusicGenreFormValue,
  RegisteredUser,
} from '../models/music';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  login(userName: string, password: string): Observable<string> {
    return this.request(
      this.http.post(
        `${this.baseUrl}/login/auth`,
        { nome: userName, senha: password },
        { responseType: 'text' },
      ),
    );
  }

  registerUser(userName: string, password: string): Observable<RegisteredUser> {
    return this.request(
      this.http.post<RegisteredUser>(`${this.baseUrl}/usuarios`, {
        nome: userName,
        senha: password,
      }),
    );
  }

  listArtists(): Observable<Artist[]> {
    return this.request(this.http.get<Artist[]>(`${this.baseUrl}/artistas/`));
  }

  getArtist(id: string): Observable<Artist> {
    return this.request(this.http.get<Artist>(`${this.baseUrl}/artistas/${encodeURIComponent(id)}`));
  }

  createArtist(values: ArtistFormValue): Observable<Artist> {
    return this.request(this.http.post<Artist>(`${this.baseUrl}/artistas/`, values));
  }

  updateArtist(id: string, values: ArtistFormValue): Observable<Artist> {
    return this.request(
      this.http.put<Artist>(`${this.baseUrl}/artistas/${encodeURIComponent(id)}`, values),
    );
  }

  deleteArtist(id: string): Observable<void> {
    return this.request(
      this.http.delete<void>(`${this.baseUrl}/artistas/${encodeURIComponent(id)}`),
    );
  }

  listGenres(): Observable<MusicGenre[]> {
    return this.request(
      this.http.get<MusicGenre[]>(`${this.baseUrl}/generos-musicais/`),
    );
  }

  getGenre(id: string): Observable<MusicGenre> {
    return this.request(
      this.http.get<MusicGenre>(
        `${this.baseUrl}/generos-musicais/${encodeURIComponent(id)}`,
      ),
    );
  }

  createGenre(values: MusicGenreFormValue): Observable<MusicGenre> {
    return this.request(
      this.http.post<MusicGenre>(`${this.baseUrl}/generos-musicais/`, values),
    );
  }

  updateGenre(id: string, values: MusicGenreFormValue): Observable<MusicGenre> {
    return this.request(
      this.http.put<MusicGenre>(
        `${this.baseUrl}/generos-musicais/${encodeURIComponent(id)}`,
        values,
      ),
    );
  }

  deleteGenre(id: string): Observable<void> {
    return this.request(
      this.http.delete<void>(
        `${this.baseUrl}/generos-musicais/${encodeURIComponent(id)}`,
      ),
    );
  }

  listMusic(): Observable<Music[]> {
    return this.request(
      this.http.get<Music[]>(`${this.baseUrl}/musicas/`),
    );
  }

  createMusic(values: MusicFormValue): Observable<string> {
    return this.request(
      this.http.post(`${this.baseUrl}/musicas/`, this.toPayload(values), {
        responseType: 'text',
      }),
    );
  }

  updateMusic(values: MusicFormValue): Observable<string> {
    return this.request(
      this.http.put(`${this.baseUrl}/musicas/`, this.toPayload(values), {
        responseType: 'text',
      }),
    );
  }

  deleteMusic(music: Music): Observable<string> {
    return this.request(
      this.http.delete(`${this.baseUrl}/musicas/`, {
        body: music,
        responseType: 'text',
      }),
    );
  }

  private toPayload(values: MusicFormValue): Music {
    return {
      titulo: values.titulo.trim(),
      artistaResponsavel: values.artistaResponsavel.trim() || null,
      duracao: values.duracao.trim() || null,
    };
  }

  private request<T>(observable: Observable<T>): Observable<T> {
    return observable.pipe(
      catchError((error: unknown) => throwError(() => this.toApiError(error))),
    );
  }

  private toApiError(error: unknown): Error {
    if (!(error instanceof HttpErrorResponse)) {
      return new Error('Ocorreu um erro inesperado. Tente novamente.');
    }
    if (error.status === 0 || error.status === 502 || error.status === 504) {
      return new Error(
        'Não foi possível conectar à API. Verifique se o back-end está em execução.',
      );
    }
    if (error.status === 401) {
      return new Error('Nome de usuário ou senha inválidos.');
    }

    const body: unknown = error.error;
    if (typeof body === 'string' && body.trim()) {
      try {
        const parsed: unknown = JSON.parse(body);
        const message = this.readMessage(parsed);
        if (message) {
          return new Error(message);
        }
      } catch {
        return new Error(body);
      }
      return new Error(body);
    }
    const detail = this.readMessage(body);
    if (detail) {
      return new Error(detail);
    }
    const validationMessage = this.readValidationMessage(body);
    if (validationMessage) {
      return new Error(validationMessage);
    }
    return new Error(
      error.status === 403
        ? 'Você não tem autorização para realizar esta ação.'
        : `A API respondeu com o erro ${error.status}.`,
    );
  }

  private readMessage(value: unknown): string | null {
    if (typeof value !== 'object' || value === null) {
      return null;
    }
    const details = value as Record<string, unknown>;
    const message = details['detail'] ?? details['title'] ?? details['message'];
    return typeof message === 'string' && message.trim() ? message : null;
  }

  private readValidationMessage(value: unknown): string | null {
    if (typeof value !== 'object' || value === null || !('errors' in value)) {
      return null;
    }
    const errors = value.errors;
    if (typeof errors !== 'object' || errors === null) {
      return null;
    }
    const messages = Object.values(errors)
      .flatMap((entry) => (Array.isArray(entry) ? entry : []))
      .filter((entry): entry is string => typeof entry === 'string');
    return messages.length > 0 ? messages.join(' ') : null;
  }
}
