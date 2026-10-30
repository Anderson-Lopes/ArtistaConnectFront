import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <section class="auth-art" aria-label="ArtistaConnect">
        <div class="auth-brand">
          <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
          <span>ArtistaConnect</span>
        </div>
        <div class="auth-art-copy">
          <span class="eyebrow">MÚSICA, CONEXÃO, MOVIMENTO</span>
          <h1>Seu som merece um espaço à altura.</h1>
          <p>Organize seu catálogo e mantenha suas músicas sempre em sintonia.</p>
        </div>
        <div class="sound-wave" aria-hidden="true">
          @for (height of waveHeights; track $index) {
            <span [style.height.%]="height"></span>
          }
        </div>
        <span class="auth-art-note">FEITO PARA QUEM FAZ MÚSICA</span>
      </section>

      <section class="auth-form-side">
        <div class="auth-form-wrap">
          <div class="mobile-brand">
            <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
            <span>ArtistaConnect</span>
          </div>

          @if (registration) {
            <div class="unavailable-panel">
              <span class="eyebrow">CADASTRO DE CONTA</span>
              <h2>Crie sua conta</h2>
              <p class="auth-intro">Cadastre seu nome e uma senha segura para continuar.</p>
              <form class="auth-form" [formGroup]="form" (ngSubmit)="submit()">
                <label for="register-name">Nome de usuário</label>
                <input
                  id="register-name"
                  type="text"
                  autocomplete="username"
                  maxlength="120"
                  formControlName="userName"
                  [attr.aria-invalid]="userName.invalid && userName.touched"
                />
                @if (userName.invalid && userName.touched) {
                  <p class="form-message form-message-error" role="alert">
                    Informe um nome com pelo menos 2 caracteres.
                  </p>
                }

                <label for="register-password">Senha</label>
                <div class="password-field">
                  <input
                    id="register-password"
                    [type]="showPassword() ? 'text' : 'password'"
                    autocomplete="new-password"
                    maxlength="128"
                    formControlName="password"
                    [attr.aria-invalid]="password.invalid && password.touched"
                  />
                  <button
                    class="password-toggle"
                    type="button"
                    [attr.aria-label]="showPassword() ? 'Ocultar senha' : 'Mostrar senha'"
                    [attr.aria-pressed]="showPassword()"
                    (click)="togglePassword()"
                  >
                    {{ showPassword() ? 'Ocultar' : 'Mostrar' }}
                  </button>
                </div>
                @if (password.invalid && password.touched) {
                  <p class="form-message form-message-error" role="alert">
                    A senha deve conter pelo menos 12 caracteres.
                  </p>
                }

                <label for="register-confirm-password">Confirme a senha</label>
                <div class="password-field">
                  <input
                    id="register-confirm-password"
                    [type]="showConfirmation() ? 'text' : 'password'"
                    autocomplete="new-password"
                    maxlength="128"
                    formControlName="passwordConfirmation"
                    [attr.aria-invalid]="passwordMismatch"
                  />
                  <button
                    class="password-toggle"
                    type="button"
                    [attr.aria-label]="showConfirmation() ? 'Ocultar confirmação' : 'Mostrar confirmação'"
                    [attr.aria-pressed]="showConfirmation()"
                    (click)="toggleConfirmation()"
                  >
                    {{ showConfirmation() ? 'Ocultar' : 'Mostrar' }}
                  </button>
                </div>
                @if (passwordMismatch) {
                  <p class="form-message form-message-error" role="alert">
                    As senhas informadas não coincidem.
                  </p>
                }
                @if (passwordConfirmation.invalid && passwordConfirmation.touched) {
                  <p class="form-message form-message-error" role="alert">
                    Confirme sua senha.
                  </p>
                }
                @if (error()) {
                  <p class="form-message form-message-error" role="alert">{{ error() }}</p>
                }
                <button class="button button-primary button-full" type="submit" [disabled]="loading()">
                  @if (loading()) {
                    <span class="spinner" aria-hidden="true"></span>
                    Criando conta...
                  } @else {
                    Criar conta
                  }
                </button>
              </form>
              <div class="auth-footer">
                <span>Já tem uma conta?</span>
                <a class="text-button" routerLink="/login">Entrar</a>
              </div>
            </div>
          } @else {
            <span class="eyebrow">BEM-VINDO AO ARTISTACONNECT</span>
            <h2>Entre no seu espaço</h2>
            <p class="auth-intro">Entre com seu nome de usuário e senha.</p>
            @if (registered) {
              <div class="success-banner" role="status">
                Cadastro concluído. Entre com seu nome e senha.
              </div>
            }

            <form class="auth-form" [formGroup]="form" (ngSubmit)="submit()">
              <label for="login-name">Nome de usuário</label>
              <input
                id="login-name"
                type="text"
                autocomplete="username"
                maxlength="120"
                placeholder="Como devemos chamar você?"
                formControlName="userName"
                [attr.aria-invalid]="userName.invalid && userName.touched"
              />
              @if (userName.invalid && userName.touched) {
                <p class="form-message form-message-error" role="alert">
                  Informe um nome com pelo menos 2 caracteres.
                </p>
              }
              <label for="login-password">Senha</label>
              <div class="password-field">
                <input
                  id="login-password"
                  [type]="showPassword() ? 'text' : 'password'"
                  autocomplete="current-password"
                  maxlength="128"
                  formControlName="password"
                  [attr.aria-invalid]="password.invalid && password.touched"
                />
                <button
                  class="password-toggle"
                  type="button"
                  [attr.aria-label]="showPassword() ? 'Ocultar senha' : 'Mostrar senha'"
                  [attr.aria-pressed]="showPassword()"
                  (click)="togglePassword()"
                >
                  {{ showPassword() ? 'Ocultar' : 'Mostrar' }}
                </button>
              </div>
              @if (password.invalid && password.touched) {
                <p class="form-message form-message-error" role="alert">
                  Informe sua senha.
                </p>
              }
              @if (error()) {
                <p class="form-message form-message-error" role="alert">{{ error() }}</p>
              }
              <button
                class="button button-primary button-full"
                type="submit"
                [disabled]="loading()"
              >
                @if (loading()) {
                  <span class="spinner" aria-hidden="true"></span>
                  Conectando...
                } @else {
                  Continuar
                }
              </button>
            </form>

            <div class="auth-footer">
              <span>Precisa criar uma conta?</span>
              <a class="text-button" routerLink="/cadastro">Cadastre-se</a>
            </div>
          }
        </div>
        <span class="auth-legal">ARTISTACONNECT · SEU CATÁLOGO MUSICAL</span>
      </section>
    </main>
  `,
})
export class AuthComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly registration =
    inject(ActivatedRoute).snapshot.data['registration'] === true;
  readonly loading = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);
  readonly showConfirmation = signal(false);
  readonly registered =
    inject(ActivatedRoute).snapshot.queryParamMap.get('registered') === '1';
  readonly waveHeights = Array.from(
    { length: 28 },
    (_, index) => 18 + ((index * 37) % 70),
  );
  readonly form = this.formBuilder.nonNullable.group({
    userName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    password: [
      '',
      [
        Validators.required,
        ...(this.registration ? [Validators.minLength(12)] : []),
        Validators.maxLength(128),
      ],
    ],
    passwordConfirmation: [
      '',
      this.registration ? [Validators.required, Validators.maxLength(128)] : [],
    ],
  }, {
    validators: (control: AbstractControl): ValidationErrors | null => {
      const passwordValue = control.get('password')?.value as string | undefined;
      const confirmation = control.get('passwordConfirmation')?.value as string | undefined;
      return confirmation && passwordValue !== confirmation
        ? { passwordMismatch: true }
        : null;
    },
  });

  get userName() {
    return this.form.controls.userName;
  }

  get password() {
    return this.form.controls.password;
  }

  get passwordConfirmation() {
    return this.form.controls.passwordConfirmation;
  }

  get passwordMismatch(): boolean {
    return this.registration &&
      this.form.controls.passwordConfirmation.touched &&
      this.form.hasError('passwordMismatch');
  }

  togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  toggleConfirmation(): void {
    this.showConfirmation.update((visible) => !visible);
  }

  submit(): void {
    if (this.loading()) {
      return;
    }
    if (
      this.form.invalid ||
      (this.registration &&
        this.form.controls.passwordConfirmation.value !== this.password.value)
    ) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set('');
    this.loading.set(true);
    const operation = this.registration
      ? this.auth.register(this.userName.value.trim(), this.password.value)
      : this.auth.login(this.userName.value.trim(), this.password.value);
    operation.subscribe({
      next: () => {
        void this.router.navigateByUrl(
          this.registration ? '/login?registered=1' : '/dashboard',
        );
      },
      error: (reason: unknown) => {
        this.error.set(
          reason instanceof Error
            ? reason.message
            : 'Não foi possível iniciar a sessão.',
        );
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
