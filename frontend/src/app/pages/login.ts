import { DetalleDialogo } from '../services/detalle-dialogo';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import {
  AbstractControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Button } from '../components/button';
import { IconButton } from '../components/icon-button';
import { Icon } from '../components/icon';
import { Logo } from '../components/logo';
import { PieceArt } from '../components/piece-art';
import { Tabs } from '../components/tabs';
import { TextField } from '../components/text-field';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const MENSAJES: Record<string, Record<string, string>> = {
  username: {
    required: 'Elige un nombre de usuario.',
    pattern: 'Usa de 3 a 30 letras o números, sin espacios (ej. tomas_retro).',
  },
  email: {
    required: 'Escribe tu correo.',
    pattern: 'Revisa el correo: le falta el dominio (ej. .cl).',
  },
  password: {
    required: 'Escribe tu contraseña.',
    minlength: 'Tu contraseña necesita al menos 8 caracteres.',
    bytes: 'Tu contraseña es demasiado larga.',
  },
};

function maximo72Bytes(control: AbstractControl): ValidationErrors | null {
  return new TextEncoder().encode(control.value).length > 72 ? { bytes: true } : null;
}

function mensajeError(error: HttpErrorResponse): string {
  if (error.status === 0 || error.status >= 500) {
    return 'El servidor no responde. Intenta de nuevo en unos minutos.';
  }
  if (typeof error.error?.detail === 'string') return error.error.detail;
  if (error.status === 422) return 'Revisa los datos ingresados.';
  return 'No pudimos completar la solicitud.';
}

@Component({
  selector: 'vt-login-page',
  imports: [Button, IconButton, Icon, Logo, PieceArt, ReactiveFormsModule, Tabs, TextField],
  template: `
    <main class="ingreso">
      <section class="hero vt-showcase">
        <vt-logo tono="invert" [tam]="40" />
        <div class="piezas" aria-hidden="true">
          <span class="pieza vt-c-vinilos p0"><vt-piece-art categoria="vinilos" /></span>
          <span class="pieza vt-c-cartas p1"><vt-piece-art categoria="cartas" /></span>
          <span class="pieza vt-c-juguetes p2"><vt-piece-art categoria="juguetes" /></span>
          <span class="etiqueta"
            ><vt-icon name="auto_awesome" [size]="18" />Cada pieza tiene una historia</span
          >
        </div>
        <h1 class="display-xl">Tu colección<br />merece vitrina.</h1>
        <p class="sub">
          Cartas, videojuegos, juguetes y vinilos. Muéstralos y sigue a quien colecciona lo mismo.
        </p>
      </section>

      <form class="form" [formGroup]="formulario()" (ngSubmit)="enviar()" novalidate>
        <vt-tabs [opciones]="opciones" etiqueta="Ingresar o registrarse" [(valor)]="modo" />

        @if (modo() === 'registro') {
          <vt-text-field
            label="Nombre de usuario"
            formControlName="username"
            ayuda="Sin espacios, por ejemplo tomas_retro."
            [error]="mensaje('username')"
            autocomplete="username"
            icono="person"
            [maxLength]="30"
          />
        }
        <vt-text-field
          label="Correo"
          tipo="email"
          icono="mail"
          formControlName="email"
          placeholder="tu@correo.cl"
          [error]="mensaje('email')"
          autocomplete="email"
          [maxLength]="255"
        />
        <vt-text-field
          label="Contraseña"
          icono="lock"
          [tipo]="verClave() ? 'text' : 'password'"
          formControlName="password"
          [error]="mensaje('password')"
          [autocomplete]="modo() === 'ingreso' ? 'current-password' : 'new-password'"
        >
          <button
            sufijo
            type="button"
            vt-icon-button
            tone="plain"
            [icon]="verClave() ? 'visibility_off' : 'visibility'"
            [label]="verClave() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            (click)="verClave.set(!verClave())"
          ></button>
        </vt-text-field>

        <button type="submit" vt-button size="lg" [block]="true" [disabled]="enviando()">
          {{ modo() === 'ingreso' ? 'Ingresar' : 'Crear cuenta' }}
          <vt-icon name="arrow_forward" [size]="22" />
        </button>
        <p class="alternar">
          {{ modo() === 'ingreso' ? '¿Primera vez?' : '¿Ya tienes cuenta?' }}
          <button type="button" (click)="modo.set(modo() === 'ingreso' ? 'registro' : 'ingreso')">
            {{ modo() === 'ingreso' ? 'Crea tu cuenta' : 'Ingresa aquí' }}
          </button>
        </p>
      </form>
    </main>
  `,
  styles: `
    .ingreso {
      width: 100%;
      display: flex;
      flex-direction: column;
      min-height: 100dvh;
      background: var(--brand);
    }
    .hero {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--space-6) max(24px, calc((100vw - 520px) / 2)) 52px;
    }
    .etiqueta {
      position: absolute;
      z-index: 2;
      right: 0;
      bottom: 6px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 9px 14px;
      border-radius: var(--radius-pill);
      background: var(--spark);
      color: var(--on-vivid);
      font: var(--text-label);
      max-width: 100%;
      transform: rotate(-3deg);
    }
    h1 {
      font-size: clamp(30px, 7.8vw, 42px);
      line-height: 1.12;
    }
    .sub {
      color: var(--on-brand-muted);
      max-width: 38ch;
      font-size: 15px;
      line-height: 1.6;
    }
    .piezas {
      position: relative;
      isolation: isolate;
      align-self: center;
      width: min(100%, 370px);
      height: 206px;
      margin-block: 12px 24px;
    }
    .pieza {
      position: absolute;
      width: 37%;
      height: 168px;
      overflow: hidden;
      border: 3px solid var(--on-night);
      border-radius: 22px;
      box-shadow: var(--shadow-pop);
      background: var(--c-soft);
    }
    .pieza vt-piece-art {
      width: 100%;
      height: 100%;
    }
    .p0 {
      left: 2%;
      bottom: 18px;
      transform: rotate(-12deg);
    }
    .p1 {
      left: 31.5%;
      bottom: 30px;
      transform: rotate(4deg);
      z-index: 1;
    }
    .p2 {
      right: 2%;
      bottom: 12px;
      transform: rotate(13deg);
    }
    .form {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      position: relative;
      margin-top: -24px;
      padding: var(--space-5) max(24px, calc((100vw - 520px) / 2))
        calc(var(--space-8) + env(safe-area-inset-bottom));
      border-radius: 32px 32px 0 0;
      background: var(--bg);
      flex: 1;
    }
    vt-tabs {
      margin-bottom: 4px;
    }
    .alternar {
      text-align: center;
      color: var(--ink-muted);
    }
    .alternar button {
      background: transparent;
      border: 0;
      padding: 8px 3px;
      min-height: 44px;
      text-decoration: underline;
      text-underline-offset: 4px;
      font-weight: 700;
      cursor: pointer;
    }
    /* En el teléfono el botón principal debe quedar a la vista sin bajar la pantalla. */
    @media (max-width: 599px) {
      .hero {
        gap: var(--space-2);
        padding-bottom: 40px;
      }
      h1 {
        font-size: clamp(26px, 7vw, 32px);
      }
      .sub {
        display: none;
      }
      .piezas {
        height: 124px;
        margin-block: 4px 8px;
      }
      .pieza {
        height: 102px;
        border-width: 2px;
        border-radius: 16px;
      }
      .etiqueta {
        bottom: 0;
        padding: 6px 12px;
      }
    }
    @media (min-width: 1000px) {
      .ingreso {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
      }
      .hero {
        padding: clamp(32px, 4vw, 64px);
        justify-content: center;
      }
      .piezas {
        height: 240px;
        margin-block: 16px 20px;
      }
      .pieza {
        height: 190px;
      }
      h1 {
        font-size: clamp(38px, 3.5vw, 52px);
      }
      .form {
        margin: 0;
        border-radius: 0;
        padding: 48px clamp(32px, 4vw, 64px);
        justify-content: center;
      }
    }
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly detalle = inject(DetalleDialogo);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly returnUrl = input<string>();
  readonly pieza = input<string>();

  protected readonly opciones = [
    { id: 'ingreso', texto: 'Ingresar' },
    { id: 'registro', texto: 'Crear cuenta' },
  ];
  protected readonly modo = signal('ingreso');
  protected readonly verClave = signal(false);
  protected readonly enviando = signal(false);

  private readonly ingreso = this.fb.group({
    email: ['', [Validators.required, Validators.pattern(PATRON_CORREO)]],
    password: ['', Validators.required],
  });
  private readonly registro = this.fb.group({
    username: ['', [Validators.required, Validators.pattern(/^[\w.]{3,30}$/)]],
    email: ['', [Validators.required, Validators.pattern(PATRON_CORREO)]],
    password: ['', [Validators.required, Validators.minLength(8), maximo72Bytes]],
  });
  protected readonly formulario = computed<FormGroup>(() =>
    this.modo() === 'ingreso' ? this.ingreso : this.registro,
  );

  protected mensaje(campo: string): string {
    const control = this.formulario().get(campo);
    if (!control?.errors || !control.touched) return '';
    return MENSAJES[campo][Object.keys(control.errors)[0]] ?? '';
  }

  protected enviar(): void {
    const formulario = this.formulario();
    if (formulario.invalid) {
      formulario.markAllAsTouched();
      this.toast.show('Revisa los campos marcados para continuar.', 'danger');
      return;
    }

    const peticion =
      this.modo() === 'ingreso'
        ? this.auth.ingresar(this.ingreso.getRawValue())
        : this.auth.registrar(this.registro.getRawValue());

    this.enviando.set(true);
    peticion.pipe(finalize(() => this.enviando.set(false))).subscribe({
      next: ({ usuario }) => {
        this.toast.show(`Hola, @${usuario.username}`, 'success');
        const pieza = Number(this.pieza());
        void this.router.navigateByUrl(this.destino()).then((navego) => {
          if (navego && Number.isSafeInteger(pieza) && pieza > 0 && !this.detalle.abrir(pieza)) {
            void this.router.navigate(['/pieza', pieza]);
          }
        });
      },
      error: (error: HttpErrorResponse) => this.toast.show(mensajeError(error), 'danger'),
    });
  }

  private destino(): string {
    const url = this.returnUrl();
    return url?.startsWith('/') && !url.startsWith('//') ? url : '/';
  }
}
