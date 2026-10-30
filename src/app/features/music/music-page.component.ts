import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Music, MusicFormValue } from '../../models/music';

@Component({
  selector: 'app-music-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="page-heading">
      <div>
        <span class="eyebrow">CATÁLOGO</span>
        <h1>Músicas</h1>
        <p>Gerencie as músicas registradas no seu catálogo.</p>
      </div>
      <button class="button button-primary" type="button" (click)="openNew()">
        <span aria-hidden="true">+</span> Nova música
      </button>
    </div>

    <div class="notice notice-info">
      O modelo atual da API aceita título, artista responsável e duração. Os dados
      são enviados ao servidor; artistas e gêneros ainda não têm endpoints próprios.
    </div>

    @if (error()) {
      <div class="error-banner" role="alert">
        <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></svg>
        <span>{{ error() }}</span>
      </div>
    }
    @if (success()) {
      <div class="success-banner" role="status">{{ success() }}</div>
    }

    @if (formOpen()) {
      <section class="panel music-form-panel">
        <div class="panel-heading">
          <div>
            <span class="eyebrow">{{ editing() ? 'EDIÇÃO' : 'NOVO REGISTRO' }}</span>
            <h2>{{ editing() ? 'Editar música' : 'Adicionar música' }}</h2>
          </div>
          <button
            class="icon-button"
            type="button"
            aria-label="Fechar formulário"
            (click)="cancelForm()"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m18 6-12 12M6 6l12 12" /></svg>
          </button>
        </div>

        <form class="music-form" [formGroup]="form" (ngSubmit)="submit()">
          <div class="field">
            <label for="music-title">Título <span aria-hidden="true">*</span></label>
            <input
              id="music-title"
              type="text"
              maxlength="255"
              required
              formControlName="titulo"
              [readonly]="editing() !== null"
              [attr.aria-invalid]="form.controls.titulo.invalid && form.controls.titulo.touched"
              [attr.aria-describedby]="form.controls.titulo.invalid && form.controls.titulo.touched ? 'title-error' : null"
            />
            @if (editing()) {
              <span class="field-hint">
                O título é a chave do registro e não pode ser alterado pela API atual.
              </span>
            }
            @if (form.controls.titulo.invalid && form.controls.titulo.touched) {
              <span class="field-hint form-message-error" id="title-error">
                O título da música é obrigatório.
              </span>
            }
          </div>
          <div class="field">
            <label for="music-artist">Artista responsável</label>
            <input id="music-artist" type="text" formControlName="artistaResponsavel" />
          </div>
          <div class="field">
            <label for="music-duration">Duração</label>
            <input id="music-duration" type="text" placeholder="Ex.: 3:45" formControlName="duracao" />
          </div>
          <div class="form-actions">
            <button class="button button-secondary" type="button" (click)="cancelForm()">
              Cancelar
            </button>
            <button class="button button-primary" type="submit" [disabled]="saving()">
              @if (saving()) {
                <span class="spinner" aria-hidden="true"></span>
                Salvando...
              } @else {
                Salvar música
              }
            </button>
          </div>
        </form>
      </section>
    }

    <section class="panel music-panel">
      <div class="panel-heading">
        <div>
          <span class="eyebrow">BIBLIOTECA</span>
          <h2>Seu catálogo</h2>
        </div>
        <span class="count-pill">
          {{ music().length }} {{ music().length === 1 ? 'música' : 'músicas' }}
        </span>
      </div>
      @if (loading()) {
        <div class="loading-state" role="status">
          <span class="spinner"></span>
          <span>Carregando músicas...</span>
        </div>
      } @else if (music().length === 0) {
        <div class="empty-state">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
          <strong>Nenhuma música cadastrada</strong>
          <span>Quando houver registros na API, eles aparecerão aqui.</span>
        </div>
      } @else {
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Título</th>
                <th scope="col">Artista responsável</th>
                <th scope="col">Duração</th>
                <th scope="col"><span class="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              @for (item of music(); track item.titulo) {
                <tr>
                  <td>
                    <div class="table-title">
                      <div class="music-cover music-cover-small">
                        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                      </div>
                      <strong>{{ item.titulo }}</strong>
                    </div>
                  </td>
                  <td>{{ item.artistaResponsavel || '—' }}</td>
                  <td>{{ item.duracao || '—' }}</td>
                  <td>
                    <div class="table-actions">
                      <button
                        class="icon-button"
                        type="button"
                        [attr.aria-label]="'Editar ' + item.titulo"
                        (click)="openEdit(item)"
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m15 5 4 4M4 20l4-.8L19.5 7.7a2.1 2.1 0 0 0-3-3L5 16.2z" /></svg>
                      </button>
                      <button
                        class="icon-button icon-button-danger"
                        type="button"
                        [disabled]="deletingTitle() === item.titulo"
                        [attr.aria-label]="'Excluir ' + item.titulo"
                        (click)="remove(item)"
                      >
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
export class MusicPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(ApiService);
  readonly music = signal<Music[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly formOpen = signal(false);
  readonly editing = signal<Music | null>(null);
  readonly deletingTitle = signal<string | null>(null);
  readonly error = signal('');
  readonly success = signal('');
  readonly form = this.formBuilder.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(255)]],
    artistaResponsavel: [''],
    duracao: [''],
  });

  ngOnInit(): void {
    this.refresh();
  }

  openNew(): void {
    this.editing.set(null);
    this.form.reset({ titulo: '', artistaResponsavel: '', duracao: '' });
    this.formOpen.set(true);
    this.error.set('');
    this.success.set('');
  }

  openEdit(item: Music): void {
    this.editing.set(item);
    this.form.reset({
      titulo: item.titulo,
      artistaResponsavel: item.artistaResponsavel ?? '',
      duracao: item.duracao ?? '',
    });
    this.formOpen.set(true);
    this.error.set('');
    this.success.set('');
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

    const values: MusicFormValue = this.form.getRawValue();
    const isEditing = this.editing() !== null;
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    const operation = isEditing
      ? this.api.updateMusic(values)
      : this.api.createMusic(values);

    operation.subscribe({
      next: () => {
        this.success.set(isEditing ? 'Música atualizada com sucesso.' : 'Música cadastrada com sucesso.');
        this.cancelForm();
        this.refresh();
      },
      error: (reason: unknown) => {
        this.error.set(
          reason instanceof Error ? reason.message : 'Não foi possível salvar a música.',
        );
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }

  remove(item: Music): void {
    if (this.deletingTitle() === item.titulo) {
      return;
    }
    if (!window.confirm(`Excluir a música "${item.titulo}"?`)) {
      return;
    }

    this.deletingTitle.set(item.titulo);
    this.error.set('');
    this.success.set('');
    this.api.deleteMusic(item).subscribe({
      next: () => {
        this.success.set('Música excluída com sucesso.');
        this.refresh();
      },
      error: (reason: unknown) => {
        this.error.set(
          reason instanceof Error ? reason.message : 'Não foi possível excluir a música.',
        );
        this.deletingTitle.set(null);
      },
      complete: () => this.deletingTitle.set(null),
    });
  }

  private refresh(): void {
    this.loading.set(true);
    this.api.listMusic().subscribe({
      next: (items) => {
        this.music.set(items);
        this.error.set('');
      },
      error: (reason: unknown) => {
        this.error.set(
          reason instanceof Error ? reason.message : 'Falha ao carregar músicas.',
        );
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
