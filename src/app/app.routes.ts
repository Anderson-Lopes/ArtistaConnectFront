import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';
import { AuthComponent } from './features/auth/auth.component';
import { ArtistPageComponent } from './features/artists/artist-page.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { GenrePageComponent } from './features/genres/genre-page.component';
import { MusicPageComponent } from './features/music/music-page.component';
import { WorkspaceComponent } from './layout/workspace.component';

export const routes: Routes = [
  {
    path: 'login',
    component: AuthComponent,
    canActivate: [guestGuard],
    data: { registration: false },
  },
  {
    path: 'cadastro',
    component: AuthComponent,
    canActivate: [guestGuard],
    data: { registration: true },
  },
  {
    path: '',
    component: WorkspaceComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'musicas', component: MusicPageComponent },
      { path: 'artistas', component: ArtistPageComponent },
      { path: 'generos', component: GenrePageComponent },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
