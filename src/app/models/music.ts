export interface Music {
  titulo: string;
  artistaResponsavel: string | null;
  duracao: string | null;
}

export interface MusicFormValue {
  titulo: string;
  artistaResponsavel: string;
  duracao: string;
}

export interface Session {
  token: string;
  userName: string;
  expiresAt: number;
}

export interface Artist {
  id: string;
  nome: string;
  bio: string | null;
  generoMusical: string | null;
}

export interface ArtistFormValue {
  nome: string;
  bio: string;
  generoMusical: string;
}

export interface MusicGenre {
  id: string;
  nome: string;
}

export interface MusicGenreFormValue {
  nome: string;
}

export interface RegisteredUser {
  id: number;
  nome: string;
}
