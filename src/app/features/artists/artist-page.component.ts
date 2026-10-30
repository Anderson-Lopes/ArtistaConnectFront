import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Artist, MusicGenre } from '../../models/music';

@Component({
  selector: 'app-artist-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="page-heading">
      <div>
        <span class="eyebrow">CATÁLOGO</span>
        <h1>Artistas</h1>
        <p>Cadastre e organize seus artistas.</p>
      </div>
      <button class="button button-primary" type="button" (click)="openNew()">
        <span aria-hidden="true">+</span> Novo artista
      </button>
    </div>

    @if (error()) {
      <div class="error-banner" role="alert">{{ error() }}</div>
    }
    @if (success()) {
      <div class="success-banner" role="status">{{ success() }}</div>
    }

    @if (formOpen()) {
      <section class="panel music-form-panel">
        <div class="panel-heading">
          <div>
            <span class="eyebrow">{{ editing() ? 'EDIÇÃO' : 'NOVO REGISTRO' }}</span>
            <h2>{{ editing() ? 'Editar artista' : 'Adicionar artista' }}</h2>
          </div>
          <button class="icon-button" type="button" aria-label="Fechar formulário" (click)="cancelForm()">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m18 6-12 12M6 6l12 12" /></svg>
          </button>
        </div>
        @if (genresError()) {
          <div class="error-banner" role="alert">
            {{ genresError() }} O gênero pode ser informado como texto.
          </div>
        }
        <form class="music-form" [formGroup]="form" (ngSubmit)="submit()">
          <div class="field">
            <label for="artist-name">Nome <span aria-hidden="true">*</span></label>
            <input id="artist-name" maxlength="120" formControlName="nome" required />
            @if (form.controls.nome.invalid && form.controls.nome.touched) {
              <span class="field-hint form-message-error">Informe um nome com pelo menos 2 caracteres.</span>
            }
          </div>
          <div class="field">
            <label for="artist-bio">Bio</label>
            <textarea id="artist-bio" rows="3" formControlName="bio"></textarea>
          </div>
          <div class="field">
            <label for="artist-genre">Gênero musical</label>
            @if (genres().length > 0) {
              <select id="artist-genre" formControlName="generoMusical">
                <option value="">Não informado</option>
                @for (genre of genres(); track genre.id) {
                  <option [value]="genre.nome">{{ genre.nome }}</option>
                }
              </select>
            } @else {
              <input id="artist-genre" type="text" formControlName="generoMusical" />
            }
          </div>
          <div class="form-actions">
            <button class="button button-secondary" type="button" (click)="cancelForm()">Cancelar</button>
            <button class="button button-primary" type="submit" [disabled]="saving()">
              @if (saving()) {
                <span class="spinner" aria-hidden="true"></span> Salvando...
              } @else {
                Salvar artista
              }
            </button>
          </div>
        </form>
      </section>
    }

    <section class="panel music-panel">
      <div class="panel-heading">
        <div><span class="eyebrow">BIBLIOTECA</span><h2>Artistas cadastrados</h2></div>
        <span class="count-pill">{{ artists().length }} {{ artists().length === 1 ? 'artista' : 'artistas' }}</span>
      </div>
      @if (loading()) {
        <div class="loading-state" role="status"><span class="spinner"></span><span>Carregando artistas...</span></div>
      } @else if (artists().length === 0) {
        <div class="empty-state"><strong>Nenhum artista cadastrado</strong><span>Cadastre um artista para começar.</span></div>
      } @else {
        <div class="table-scroll">
          <table>
            <thead><tr><th scope="col">Nome</th><th scope="col">Gênero musical</th><th scope="col">Bio</th><th scope="col"><span class="sr-only">Ações</span></th></tr></thead>
            <tbody>
              @for (artist of artists(); track artist.id) {
                <tr>
                  <td><div class="table-title"><div class="avatar">{{ artist.nome.charAt(0).toUpperCase() }}</div><strong>{{ artist.nome }}</strong></div></td>
                  <td>{{ artist.generoMusical || '—' }}</td>
                  <td class="bio-cell">{{ artist.bio || '—' }}</td>
                  <td>
                    <div class="table-actions">
                      <button class="icon-button" type="button" [attr.aria-label]="'Editar ' + artist.nome" (click)="openEdit(artist)">
                        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m15 5 4 4M4 20l4-.8L19.5 7.7a2.1 2.1 0 0 0-3-3L5 16.2z" /></svg>
                      </button>
                      <button class="icon-button icon-button-danger" type="button" [disabled]="deletingId() === artist.id" [attr.aria-label]="'Excluir ' + artist.nome" (click)="remove(artist)">
                        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class ArtistPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(ApiService);
  readonly artists = signal<Artist[]>([]);
  readonly genres = signal<MusicGenre[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly formOpen = signal(false);
  readonly editing = signal<Artist | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly error = signal('');
  readonly success = signal('');
  readonly genresError = signal('');
  readonly form = this.formBuilder.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    bio: [''],
    generoMusical: [''],
  });

  ngOnInit(): void {
    this.refresh();
  }

  openNew(): void {
    this.editing.set(null);
    this.form.reset({ nome: '', bio: '', generoMusical: '' });
    this.formOpen.set(true);
    this.loadGenres();
    this.clearMessages();
  }

  openEdit(artist: Artist): void {
    this.editing.set(artist);
    this.form.reset({
      nome: artist.nome,
      bio: artist.bio ?? '',
      generoMusical: artist.generoMusical ?? '',
    });
    this.formOpen.set(true);
    this.loadGenres();
    this.clearMessages();
  }

  cancelForm(): void {
    this.formOpen.set(false);
    this.editing.set(null);
  }

  submit(): void {
    if (this.saving()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const values = this.form.getRawValue();
    const current = this.editing();
    this.saving.set(true);
    this.clearMessages();
    const operation = current
      ? this.api.updateArtist(current.id, values)
      : this.api.createArtist(values);
    operation.subscribe({
      next: () => {
        this.success.set(current ? 'Artista atualizado com sucesso.' : 'Artista cadastrado com sucesso.');
        this.cancelForm();
        this.refresh();
      },
      error: (reason: unknown) => {
        this.error.set(reason instanceof Error ? reason.message : 'Não foi possível salvar o artista.');
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }

  remove(artist: Artist): void {
    if (this.deletingId() === artist.id || !window.confirm(`Excluir o artista "${artist.nome}"?`)) {
      return;
    }
    this.deletingId.set(artist.id);
    this.clearMessages();
    this.api.deleteArtist(artist.id).subscribe({
      next: () => {
        this.success.set('Artista excluído com sucesso.');
        this.refresh();
      },
      error: (reason: unknown) => {
        this.error.set(reason instanceof Error ? reason.message : 'Não foi possível excluir o artista.');
        this.deletingId.set(null);
      },
      complete: () => this.deletingId.set(null),
    });
  }

  private loadGenres(): void {
    this.genresError.set('');
    this.api.listGenres().subscribe({
      next: (genres) => this.genres.set(genres),
      error: (reason: unknown) => {
        this.genresError.set(reason instanceof Error ? reason.message : 'Falha ao carregar gêneros.');
      },
    });
  }

  private refresh(): void {
    this.loading.set(true);
    this.api.listArtists().subscribe({
      next: (artists) => {
        this.artists.set(artists);
        this.error.set('');
      },
      error: (reason: unknown) => {
        this.error.set(reason instanceof Error ? reason.message : 'Falha ao carregar artistas.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  private clearMessages(): void {
    this.error.set('');
    this.success.set('');
  }
}
