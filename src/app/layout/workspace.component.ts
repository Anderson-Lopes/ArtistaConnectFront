import { Component, inject, signal } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="app-shell">
      <aside class="sidebar" [class.sidebar-open]="menuOpen()">
        <a class="sidebar-brand" routerLink="/dashboard" (click)="closeMenu()">
          <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
          <span>ArtistaConnect</span>
        </a>
        <span class="nav-heading">ESPAÇO DE TRABALHO</span>
        <nav class="main-nav" aria-label="Navegação principal">
          <a
            class="nav-link"
            routerLink="/dashboard"
            routerLinkActive="nav-link-active"
            ariaCurrentWhenActive="page"
            (click)="closeMenu()"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>
            <span>Visão geral</span>
          </a>
          <a
            class="nav-link"
            routerLink="/musicas"
            routerLinkActive="nav-link-active"
            ariaCurrentWhenActive="page"
            (click)="closeMenu()"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
            <span>Músicas</span>
          </a>
          <a
            class="nav-link"
            routerLink="/artistas"
            routerLinkActive="nav-link-active"
            ariaCurrentWhenActive="page"
            (click)="closeMenu()"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></svg>
            <span>Artistas</span>
          </a>
          <a
            class="nav-link"
            routerLink="/generos"
            routerLinkActive="nav-link-active"
            ariaCurrentWhenActive="page"
            (click)="closeMenu()"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 5h16M4 12h16M4 19h16" /><circle cx="8" cy="5" r="2" /><circle cx="16" cy="12" r="2" /><circle cx="10" cy="19" r="2" /></svg>
            <span>Gêneros musicais</span>
          </a>
        </nav>

        <div class="sidebar-bottom">
          @if (auth.session(); as session) {
            <div class="account-card">
              <div class="avatar">{{ session.userName.charAt(0).toUpperCase() }}</div>
              <div class="account-copy">
                <strong>{{ session.userName }}</strong>
                <span>Sessão ativa</span>
              </div>
            </div>
          }
          <button class="logout-button" type="button" (click)="logout()">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M10 17l5-5-5-5M15 12H3M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></svg>
            <span>Sair da conta</span>
          </button>
        </div>
      </aside>

      @if (menuOpen()) {
        <button
          class="mobile-menu-scrim"
          type="button"
          aria-label="Fechar menu"
          (click)="closeMenu()"
        ></button>
      }

      <main class="workspace-main">
        <header class="topbar">
          <button
            class="menu-toggle"
            type="button"
            aria-label="Abrir menu"
            [attr.aria-expanded]="menuOpen()"
            (click)="toggleMenu()"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div class="breadcrumb">
            <span>Workspace</span>
            <span class="breadcrumb-divider">/</span>
            <strong>{{ currentTitle() }}</strong>
          </div>
          @if (auth.session(); as session) {
            <div class="topbar-user">
              <span>Olá, {{ session.userName }}</span>
              <div class="avatar avatar-small">{{ session.userName.charAt(0).toUpperCase() }}</div>
            </div>
          }
        </header>
        <div class="page-content">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
})
export class WorkspaceComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly menuOpen = signal(false);

  currentTitle(): string {
    const path = this.router.url.split('?')[0];
    if (path === '/musicas') {
      return 'Músicas';
    }
    if (path === '/artistas') {
      return 'Artistas';
    }
    if (path === '/generos') {
      return 'Gêneros musicais';
    }
    return 'Visão geral';
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
