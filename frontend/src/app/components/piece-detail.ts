import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { relativo } from '../models/format';
import { categoriaDe } from '../models/vitrina';
import { AuthService } from '../services/auth.service';
import { CatalogoPublicoService, PiezaPublica } from '../services/catalogo-publico.service';
import { ComentariosService } from '../services/comentarios.service';
import { ToastService } from '../services/toast.service';
import { InteraccionesService } from '../services/interacciones.service';
import { Avatar } from './avatar';
import { Button } from './button';
import { CatalogTag } from './catalog-tag';
import { CommentSheet } from './comment-sheet';
import { ConfirmSheet } from './confirm-sheet';
import { IconButton } from './icon-button';
import { LikeButton } from './like-button';
import { PieceArt } from './piece-art';

/**
 * Detalle de la pieza en escritorio: la foto a un lado y, al otro, los datos, las acciones y los
 * comentarios en línea. Se usa como página (enlace directo) y dentro de la ventana sobre Explorar.
 */
@Component({
  selector: 'vt-piece-detail',
  imports: [
    Avatar,
    Button,
    CatalogTag,
    CommentSheet,
    ConfirmSheet,
    IconButton,
    LikeButton,
    PieceArt,
    RouterLink,
  ],
  host: { '[class]': '"vt-c-" + pieza().categoria', '[attr.data-modo]': 'modo()' },
  template: `
    @let p = pieza();
    <section class="foto" aria-label="Foto de la pieza">
      <div class="ph">
        @if (p.imagen_url && !fallo()) {
          <img [src]="p.imagen_url" [alt]="'Foto de ' + p.nombre" (error)="fallo.set(true)" />
        } @else {
          <vt-piece-art [categoria]="p.categoria" />
        }
      </div>
      @if (modo() === 'pagina') {
        <button
          type="button"
          vt-icon-button
          class="volver"
          tone="glass"
          icon="arrow_back"
          label="Volver"
          (click)="volver()"
        ></button>
      }
      <button
        type="button"
        vt-icon-button
        class="guardar"
        tone="glass"
        icon="bookmark"
        [label]="interacciones.estado(p).guardada ? 'Quitar de favoritos' : 'Guardar en favoritos'"
        [active]="interacciones.estado(p).guardada"
        [pressed]="interacciones.estado(p).guardada"
        (click)="interacciones.alternarGuardado(p)"
      ></button>
      <vt-catalog-tag class="ficha" [categoria]="p.categoria" [numero]="p.id" />
    </section>

    <aside class="panel" [attr.aria-label]="'Datos y comentarios de ' + p.nombre">
      <div class="cabecera">
        <a
          class="persona"
          [routerLink]="['/coleccionistas', p.dueno.username]"
          (click)="irA.emit()"
        >
          <vt-avatar [nombre]="p.dueno.username" [tam]="44" />
          <span class="quien">
            <strong class="body-strong">&#64;{{ p.dueno.username }}</strong>
            <span class="caption vt-muted"
              >{{ categoriaDe(p.categoria).nombre }} · {{ cuando(p.creado_en) }}</span
            >
          </span>
        </a>
        @if (soyDueno()) {
          <a
            vt-icon-button
            size="sm"
            icon="edit"
            label="Editar pieza"
            [routerLink]="['/coleccion', p.id, 'editar']"
            (click)="irA.emit()"
          ></a>
          <button
            type="button"
            vt-icon-button
            size="sm"
            tone="danger"
            icon="delete"
            label="Eliminar pieza"
            [disabled]="eliminando()"
            (click)="errorEliminar.set(''); confirmando.set(true)"
          ></button>
        } @else {
          <a
            vt-button
            size="sm"
            variant="secondary"
            [routerLink]="['/coleccionistas', p.dueno.username]"
            (click)="irA.emit()"
            >Ver perfil</a
          >
        }
      </div>
      <div class="texto">
        <h1 class="display-lg nombre">{{ p.nombre }}</h1>
        <p class="body descripcion">{{ p.descripcion }}</p>
      </div>
      <div class="acciones">
        <vt-like-button [pieza]="p" />
        <button
          type="button"
          vt-button
          class="compartir"
          size="sm"
          variant="secondary"
          icon="link"
          (click)="compartir()"
        >
          Compartir
        </button>
      </div>
      <vt-comment-sheet [duenoId]="p.dueno.id" [enLinea]="true" />
    </aside>

    @if (soyDueno()) {
      <vt-confirm-sheet
        [categoria]="p.categoria"
        [abierto]="confirmando()"
        [pendiente]="eliminando()"
        [error]="errorEliminar()"
        titulo="¿Eliminar esta pieza?"
        [texto]="'Vas a quitar «' + p.nombre + '» de tu colección. No se puede deshacer.'"
        (cancelado)="confirmando.set(false)"
        (confirmado)="eliminar()"
      />
    }
  `,
  styles: `
    :host {
      display: flex;
      gap: var(--space-6);
      height: 100%;
      min-height: 0;
    }
    .foto {
      position: relative;
      flex: 1;
      min-width: 0;
    }
    .ph {
      position: absolute;
      inset: 0;
      overflow: hidden;
      border-radius: var(--radius-xl);
      background: var(--c-soft);
    }
    .ph img,
    .ph vt-piece-art {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .volver,
    .guardar {
      position: absolute;
      top: var(--space-4);
    }
    .volver {
      left: var(--space-4);
    }
    .guardar {
      right: var(--space-4);
    }
    .ficha {
      position: absolute;
      left: 28px;
      bottom: -12px;
      transform: rotate(-3deg);
    }
    .panel {
      display: flex;
      flex-direction: column;
      flex: none;
      width: clamp(360px, 34vw, 460px);
      min-height: 0;
      overflow: hidden;
      background: var(--surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-card);
    }
    .cabecera {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-5) var(--space-5) 0;
    }
    .persona {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex: 1;
      min-width: 0;
    }
    .quien {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .texto {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: var(--space-4) var(--space-5) 0;
    }
    .nombre {
      font-size: 26px;
      line-height: 30px;
      overflow-wrap: anywhere;
    }
    .descripcion {
      font-size: 14px;
      line-height: 21px;
      overflow-wrap: anywhere;
    }
    .acciones {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-4) var(--space-5);
    }
    .compartir {
      margin-left: auto;
    }
    vt-comment-sheet {
      flex: 1;
      min-height: 0;
      border-top: 1px solid var(--line);
    }
    /* En la ventana, la foto y el panel forman una sola caja y la ficha va dentro de la foto. */
    :host([data-modo='ventana']) {
      gap: 0;
      overflow: hidden;
      background: var(--surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-float);
    }
    :host([data-modo='ventana']) .ph,
    :host([data-modo='ventana']) .panel {
      border-radius: 0;
    }
    :host([data-modo='ventana']) .panel {
      width: clamp(340px, 38%, 440px);
      box-shadow: none;
    }
    :host([data-modo='ventana']) .ficha {
      top: var(--space-5);
      left: var(--space-5);
      bottom: auto;
      transform: none;
    }
  `,
})
export class PieceDetail {
  private readonly api = inject(CatalogoPublicoService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toast = inject(ToastService);
  protected readonly interacciones = inject(InteraccionesService);
  private readonly destroy = inject(DestroyRef);
  private readonly comentarios = inject(ComentariosService);

  readonly pieza = input.required<PiezaPublica>();
  readonly modo = input<'pagina' | 'ventana'>('pagina');
  /** La ventana se cierra sin volver atrás en el historial cuando se va a otra página. */
  readonly irA = output<void>();

  protected readonly categoriaDe = categoriaDe;
  protected readonly fallo = signal(false);
  protected readonly confirmando = signal(false);
  protected readonly eliminando = signal(false);
  protected readonly errorEliminar = signal('');
  protected readonly soyDueno = computed(() => this.auth.usuario()?.id === this.pieza().dueno.id);
  private readonly piezaId = computed(() => this.pieza().id);

  constructor() {
    effect(() => this.comentarios.cargar(this.piezaId()));
    effect(() => {
      this.piezaId();
      this.fallo.set(false);
    });
  }

  protected cuando(fecha: string): string {
    return relativo(Math.max(0, Math.floor((Date.now() - Date.parse(fecha)) / 60_000)));
  }

  protected volver(): void {
    if (window.history.state?.navigationId > 1) this.location.back();
    else void this.router.navigateByUrl('/');
  }

  protected async compartir(): Promise<void> {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: this.pieza().nombre, url: window.location.href });
        return;
      } catch (error) {
        if ((error as DOMException).name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      this.toast.show('Enlace copiado', 'success');
    } catch {
      this.toast.show(
        'No pudimos copiar el enlace: cópialo desde la barra del navegador.',
        'danger',
      );
    }
  }

  protected eliminar(): void {
    if (this.eliminando()) return;
    const p = this.pieza();
    this.eliminando.set(true);
    this.errorEliminar.set('');
    this.api
      .eliminar(p.id)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => {
          this.eliminando.set(false);
          this.confirmando.set(false);
          this.toast.show('Pieza eliminada', 'success');
          this.irA.emit();
          void this.router.navigate(['/coleccionistas', p.dueno.username]);
        },
        error: (e: HttpErrorResponse) => {
          this.eliminando.set(false);
          this.errorEliminar.set(
            e.status === 403
              ? 'Solo el dueño puede eliminar esta pieza.'
              : e.status === 404
                ? 'Esta pieza ya no está disponible.'
                : 'No pudimos eliminar la pieza. Inténtalo de nuevo.',
          );
        },
      });
  }
}
