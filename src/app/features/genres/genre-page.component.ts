import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { MusicGenre } from '../../models/music';

@Component({
  selector: 'app-genre-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="page-heading">
      <div>
        <span class="eyebrow">CATÁLOGO</span>
        <h1>Gêneros musicais</h1>
        <p>Organize os gêneros musicais disponíveis para artistas.</p>
      </div>
      <button class="button button-primary" type="button" (click)="openNew()">
        <span aria-hidden="true">+</span> Novo gênero
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
            <h2>{{ editing() ? 'Editar gênero' : 'Adicionar gênero' }}</h2>
          </div>
          <button class="icon-button" type="button" aria-label="Fechar formulário" (click)="cancelForm()">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m18 6-12 12M6 6l12 12" /></svg>
          </button>
        </div>
        <form class="music-form" [formGroup]="form" (ngSubmit)="submit()">
          <div class="field">
            <label for="genre-name">Nome <span aria-hidden="true">*</span></label>
            <input id="genre-name" maxlength="80" formControlName="nome" required />
            @if (form.controls.nome.invalid && form.controls.nome.touched) {
              <span class="field-hint form-message-error">Informe um nome com pelo menos 2 caracteres.</span>
            }
          </div>
          <div class="form-actions">
            <button class="button button-secondary" type="button" (click)="cancelForm()">Cancelar</button>
            <button class="button button-primary" type="submit" [disabled]="saving()">
              @if (saving()) {
                <span class="spinner" aria-hidden="true"></span> Salvando...
              } @else {
                Salvar gênero
              }
            </button>
          </div>
        </form>
      </section>
    }

    <section class="panel music-panel">
      <div class="panel-heading">
        <div><span class="eyebrow">BIBLIOTECA</span><h2>Gêneros cadastrados</h2></div>
        <span class="count-pill">{{ genres().length }} {{ genres().length === 1 ? 'gênero' : 'gêneros' }}</span>
      </div>
      @if (loading()) {
        <div class="loading-state" role="status"><span class="spinner"></span><span>Carregando gêneros...</span></div>
      } @else if (genres().length === 0) {
        <div class="empty-state"><strong>Nenhum gênero cadastrado</strong><span>Cadastre um gênero para disponibilizá-lo nos artistas.</span></div>
      } @else {
        <div class="table-scroll">
          <table>
            <thead><tr><th scope="col">Nome</th><th scope="col"><span class="sr-only">Ações</span></th></tr></thead>
            <tbody>
              @for (genre of genres(); track genre.id) {
                <tr>
                  <td><div class="table-title"><div class="genre-mark"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 5h16M4 12h16M4 19h16" /><circle cx="8" cy="5" r="2" /><circle cx="16" cy="12" r="2" /><circle cx="10" cy="19" r="2" /></svg></div><strong>{{ genre.nome }}</strong></div></td>
                  <td>
                    <div class="table-actions">
                      <button class="icon-button" type="button" [attr.aria-label]="'Editar ' + genre.nome" (click)="openEdit(genre)">
                        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m15 5 4 4M4 20l4-.8L19.5 7.7a2.1 2.1 0 0 0-3-3L5 16.2z" /></svg>
                      </button>
                      <button class="icon-button icon-button-danger" type="button" [disabled]="deletingId() === genre.id" [attr.aria-label]="'Excluir ' + genre.nome" (click)="remove(genre)">
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
export class GenrePageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(ApiService);
  readonly genres = signal<MusicGenre[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly formOpen = signal(false);
  readonly editing = signal<MusicGenre | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly error = signal('');
  readonly success = signal('');
  readonly form = this.formBuilder.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
  });

  ngOnInit(): void {
    this.refresh();
  }

  openNew(): void {
    this.editing.set(null);
    this.form.reset({ nome: '' });
    this.formOpen.set(true);
    this.clearMessages();
  }

  openEdit(genre: MusicGenre): void {
    this.editing.set(genre);
    this.form.reset({ nome: genre.nome });
    this.formOpen.set(true);
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
    const current = this.editing();
    this.saving.set(true);
    this.clearMessages();
    const operation = current
      ? this.api.updateGenre(current.id, this.form.getRawValue())
      : this.api.createGenre(this.form.getRawValue());
    operation.subscribe({
      next: () => {
        this.success.set(current ? 'Gênero atualizado com sucesso.' : 'Gênero cadastrado com sucesso.');
        this.cancelForm();
        this.refresh();
      },
      error: (reason: unknown) => {
        this.error.set(reason instanceof Error ? reason.message : 'Não foi possível salvar o gênero.');
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }

  remove(genre: MusicGenre): void {
    if (this.deletingId() === genre.id || !window.confirm(`Excluir o gênero "${genre.nome}"?`)) {
      return;
    }
    this.deletingId.set(genre.id);
    this.clearMessages();
    this.api.deleteGenre(genre.id).subscribe({
      next: () => {
        this.success.set('Gênero excluído com sucesso.');
        this.refresh();
      },
      error: (reason: unknown) => {
        this.error.set(reason instanceof Error ? reason.message : 'Não foi possível excluir o gênero.');
        this.deletingId.set(null);
      },
      complete: () => this.deletingId.set(null),
    });
  }

  private refresh(): void {
    this.loading.set(true);
    this.api.listGenres().subscribe({
      next: (genres) => {
        this.genres.set(genres);
        this.error.set('');
      },
      error: (reason: unknown) => {
        this.error.set(reason instanceof Error ? reason.message : 'Falha ao carregar gêneros.');
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
