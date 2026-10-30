import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { routes } from '../app.routes';
import { authGuard, guestGuard } from './auth.guard';

describe('authentication route guards', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    router = TestBed.inject(Router);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('redirects protected navigation to login without a session', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard(
        {} as ActivatedRouteSnapshot,
        { url: '/musicas' } as RouterStateSnapshot,
      ),
    );

    expect(result).not.toBe(true);
    expect(router.serializeUrl(result as ReturnType<typeof router.createUrlTree>))
      .toBe('/login');
  });

  it('allows guests to reach the login screen', () => {
    const result = TestBed.runInInjectionContext(() =>
      guestGuard(
        {} as ActivatedRouteSnapshot,
        { url: '/login' } as RouterStateSnapshot,
      ),
    );

    expect(result).toBe(true);
  });
});
