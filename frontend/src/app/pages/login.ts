import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from '../components/button';
import { IconButton } from '../components/icon-button';
import { Logo } from '../components/logo';
import { PieceArt } from '../components/piece-art';
import { Tabs } from '../components/tabs';
import { TextField } from '../components/text-field';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'vt-login-page',
  imports: [Button, IconButton, Logo, PieceArt, Tabs, TextField],
  template: `
    <main class="ingreso">
      <section class="hero vt-showcase">
        <vt-logo tono="invert" [tam]="40" />
        <span class="etiqueta catalog">Red de coleccionistas</span>
        <h1 class="display-xl">Tu colección merece vitrina.</h1>
        <p class="sub">Cartas, videojuegos, juguetes y vinilos, bien exhibidos.</p>
        <div class="piezas" aria-hidden="true">
          <span class="pieza vt-c-cartas p0"><vt-piece-art categoria="cartas" /></span>
          <span class="pieza vt-c-vinilos p1"><vt-piece-art categoria="vinilos" /></span>
          <span class="pieza vt-c-videojuegos p2"><vt-piece-art categoria="videojuegos" /></span>
        </div>
      </section>

      <p class="caption vt-muted">Vista previa: el ingreso y registro se conectarán al backend.</p>
      <form class="form" (submit)="enviar($event)" novalidate>
        <vt-tabs [opciones]="opciones" etiqueta="Ingresar o registrarse" [(valor)]="modo" />

        @if (modo() === 'registro') {
          <vt-text-field
            label="Nombre de usuario"
            [(valor)]="usuario"
            ayuda="Sin espacios, por ejemplo tomas_retro."
            [error]="errores().usuario"
            autocomplete="username"
            [maxLength]="30"
          />
        }
        <vt-text-field
          label="Correo"
          tipo="email"
          [(valor)]="correo"
          placeholder="tu@correo.cl"
          [error]="errores().correo"
          autocomplete="email"
          [maxLength]="255"
        />
        <vt-text-field
          label="Contraseña"
          [tipo]="verClave() ? 'text' : 'password'"
          [(valor)]="clave"
          [error]="errores().clave"
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

        <button type="submit" vt-button size="lg" [block]="true">
          {{ modo() === 'ingreso' ? 'Ingresar' : 'Crear cuenta' }}
        </button>
      </form>
    </main>
  `,
  styles: `
    .ingreso {
      max-width: 480px;
      margin-inline: auto;
      padding: var(--space-4) var(--space-4) var(--space-8);
      display: flex;
      flex-direction: column;
      gap: var(--space-8);
    }
    .hero {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--space-5) var(--space-5) 120px;
      border-radius: var(--radius-xl);
    }
    .etiqueta {
      margin-top: var(--space-3);
      padding: 4px 10px;
      border-radius: var(--radius-pill);
      background: var(--spark);
      color: var(--on-vivid);
      text-transform: uppercase;
      transform: rotate(-3deg);
    }
    h1 {
      max-width: 11ch;
    }
    .sub {
      color: var(--on-brand-muted);
      max-width: 30ch;
    }
    .piezas {
      position: absolute;
      right: var(--space-5);
      bottom: -36px;
      width: 180px;
      height: 150px;
    }
    .pieza {
      position: absolute;
      width: 84px;
      height: 112px;
      overflow: hidden;
      border: 3px solid var(--on-night);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-pop);
      background: var(--c-soft);
    }
    .pieza vt-piece-art {
      width: 100%;
      height: 100%;
    }
    .p0 {
      left: 0;
      bottom: 10px;
      transform: rotate(-12deg);
    }
    .p1 {
      left: 48px;
      bottom: 0;
      transform: rotate(4deg);
      z-index: 1;
    }
    .p2 {
      right: 0;
      bottom: 14px;
      transform: rotate(13deg);
    }
    .form {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
  `,
})
export class LoginPage {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly opciones = [
    { id: 'ingreso', texto: 'Ingresar' },
    { id: 'registro', texto: 'Crear cuenta' },
  ];
  protected readonly modo = signal('ingreso');
  protected readonly usuario = signal('');
  protected readonly correo = signal('');
  protected readonly clave = signal('');
  protected readonly verClave = signal(false);
  private readonly intento = signal(false);

  protected readonly errores = computed(() => {
    if (!this.intento()) return { usuario: '', correo: '', clave: '' };
    return {
      usuario:
        this.modo() === 'registro' && !/^[\w.]{3,30}$/.test(this.usuario())
          ? 'Usa de 3 a 30 letras o números, sin espacios (ej. tomas_retro).'
          : '',
      correo: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(this.correo())
        ? ''
        : 'Revisa el correo: le falta el dominio (ej. .cl).',
      clave: this.clave().length >= 8 ? '' : 'Tu contraseña necesita al menos 8 caracteres.',
    };
  });

  protected enviar(ev: Event): void {
    ev.preventDefault();
    this.intento.set(true);
    if (Object.values(this.errores()).some(Boolean)) {
      this.toast.show('Revisa los campos marcados para continuar.', 'danger');
      return;
    }
    this.toast.show('Demostración completada. La sesión de muestra sigue activa.', 'success');
    this.router.navigateByUrl('/');
  }
}
