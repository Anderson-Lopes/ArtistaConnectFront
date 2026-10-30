import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Artist, Music, MusicGenre } from '../../models/music';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (auth.session(); as session) {
      <div class="page-heading">
        <div>
          <span class="eyebrow">SEU CATÁLOGO EM UM SÓ LUGAR</span>
          <h1>Bom ter você por aqui, {{ session.userName }}.</h1>
          <p>Acompanhe e organize o que você está criando.</p>
        </div>
      </div>

      @if (error()) {
        <div class="error-banner" role="alert">
          <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></svg>
          <span>{{ error() }}</span>
        </div>
      }

      <section class="stats-grid" aria-label="Resumo do catálogo">
        <article class="stat-card stat-card-primary">
          <span class="stat-icon">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
          </span>
          <span class="stat-label">Músicas no catálogo</span>
          <strong class="stat-value">{{ loading() ? '—' : music().length.toString().padStart(2, '0') }}</strong>
          <span class="stat-caption">{{ loading() ? 'Carregando catálogo' : 'Registros disponíveis na API' }}</span>
        </article>
        <article class="stat-card">
          <span class="stat-icon stat-icon-muted">
            <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></svg>
          </span>
          <span class="stat-label">Artistas</span>
          <strong class="stat-value">{{ artistCount() === null ? '—' : (artistCount() ?? 0).toString().padStart(2, '0') }}</strong>
          <span class="stat-caption">{{ artistCount() === null ? 'Carregando artistas' : 'Registros disponíveis na API' }}</span>
        </article>
        <article class="stat-card">
          <span class="stat-icon stat-icon-muted">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 5h16M4 12h16M4 19h16" /><circle cx="8" cy="5" r="2" /><circle cx="16" cy="12" r="2" /><circle cx="10" cy="19" r="2" /></svg>
          </span>
          <span class="stat-label">Gêneros musicais</span>
          <strong class="stat-value">{{ genreCount() === null ? '—' : (genreCount() ?? 0).toString().padStart(2, '0') }}</strong>
          <span class="stat-caption">{{ genreCount() === null ? 'Carregando gêneros' : 'Registros disponíveis na API' }}</span>
        </article>
      </section>

      <section class="dashboard-lower">
        <div class="panel recent-panel">
          <div class="panel-heading">
            <div>
              <span class="eyebrow">BIBLIOTECA</span>
              <h2>Adicionadas recentemente</h2>
            </div>
            <a class="text-button" routerLink="/musicas">Ver todas <span aria-hidden="true">→</span></a>
          </div>
          @if (loading()) {
            <div class="loading-state" role="status"><span class="spinner"></span><span>Carregando músicas...</span></div>
          } @else if (musicError()) {
            <p class="empty-state">Não foi possível carregar o catálogo.</p>
          } @else if (music().length === 0) {
            <div class="empty-state">
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
              <strong>Seu catálogo começa aqui</strong>
              <span>Adicione uma música para ela aparecer nesta lista.</span>
            </div>
          } @else {
            <div class="recent-list">
              @for (item of music().slice(0, 5); track item.titulo) {
                <div class="recent-item">
                  <div class="music-cover">
                    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                  </div>
                  <div class="recent-track">
                    <strong>{{ item.titulo }}</strong>
                    <span>{{ item.artistaResponsavel || 'Artista não informado' }}</span>
                  </div>
                  <span class="duration">{{ item.duracao || '—' }}</span>
                </div>
              }
            </div>
          }
        </div>
        <aside class="panel api-panel">
          <span class="api-panel-mark">
            <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
          </span>
          <span class="eyebrow">SEU PRÓXIMO PASSO</span>
          <h2>Seu catálogo, em movimento.</h2>
          <p>Registre suas músicas e mantenha suas informações organizadas em um só lugar.</p>
          <a class="button button-dark" routerLink="/musicas">Abrir músicas <span aria-hidden="true">→</span></a>
        </aside>
      </section>
      <p class="session-note">
        A sessão fica apenas na memória desta aba e termina ao sair ou atualizar a página.
        O servidor não possui endpoint de renovação ou revogação.
      </p>
    }
  `,
})
export class DashboardComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  readonly music = signal<Music[]>([]);
  readonly artistCount = signal<number | null>(null);
  readonly genreCount = signal<number | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly musicError = signal('');

  ngOnInit(): void {
    this.api.listMusic().subscribe({
      next: (items) => {
        this.music.set(items);
        this.error.set('');
      },
      error: (reason: unknown) => {
        const message =
          reason instanceof Error ? reason.message : 'Falha ao carregar músicas.';
        this.error.set(message);
        this.musicError.set(message);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
    this.api.listArtists().subscribe({
      next: (items: Artist[]) => this.artistCount.set(items.length),
      error: (reason: unknown) =>
        this.setSummaryError(reason, 'Falha ao carregar artistas.'),
    });
    this.api.listGenres().subscribe({
      next: (items: MusicGenre[]) => this.genreCount.set(items.length),
      error: (reason: unknown) =>
        this.setSummaryError(reason, 'Falha ao carregar gêneros musicais.'),
    });
  }

  private setSummaryError(reason: unknown, fallback: string): void {
    this.error.set(reason instanceof Error ? reason.message : fallback);
  }
}
