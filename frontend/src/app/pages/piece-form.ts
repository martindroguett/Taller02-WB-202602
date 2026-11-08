import { MatChipsModule } from '@angular/material/chips';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { map, startWith } from 'rxjs';
import { Avatar } from '../components/avatar';
import { Button } from '../components/button';
import { CategoryChip } from '../components/category-chip';
import { ConfirmSheet } from '../components/confirm-sheet';
import { EmptyState } from '../components/empty-state';
import { Icon } from '../components/icon';
import { ImageDrop } from '../components/image-drop';
import { TextField } from '../components/text-field';
import { TopBar } from '../components/top-bar';
import { numeroCatalogo } from '../models/format';
import { CATEGORIAS, CategoriaSlug, categoriaDe } from '../models/vitrina';
import { AuthService } from '../services/auth.service';
import { CatalogoPublicoService } from '../services/catalogo-publico.service';
import { ToastService } from '../services/toast.service';

// Pydantic cuenta puntos Unicode después de quitar espacios, no unidades UTF-16.
const texto: (max: number) => ValidatorFn = (max) => (control) => {
  const valor = (control.value as string).trim();
  return !valor ? { required: true } : Array.from(valor).length > max ? { maxlength: true } : null;
};

@Component({
  selector: 'vt-piece-form-page',
  imports: [
    ReactiveFormsModule,
    Avatar,
    Button,
    CategoryChip,
    MatChipsModule,
    ConfirmSheet,
    EmptyState,
    Icon,
    ImageDrop,
    TextField,
    TopBar,
    RouterLink,
  ],
  template: `
    @if (estado() === 'lista') {
      <form class="vt-screen formulario" [formGroup]="formulario" (ngSubmit)="guardar()" novalidate>
        <vt-top-bar
          [titulo]="id() ? 'Editar pieza' : 'Agregar pieza'"
          [small]="true"
          icono="close"
        />
        <div class="campos">
          <vt-image-drop
            [deshabilitado]="ocupado()"
            [imagen]="formulario.controls.imagen_url.value || null"
            (imagenChange)="formulario.controls.imagen_url.setValue($event || '')"
            (lectura)="leyendo.set($event)"
          />
          @if (intento() && formulario.controls.imagen_url.invalid) {
            <p class="error-txt" role="alert">Agrega una foto de tu pieza.</p>
          }
          <vt-text-field
            label="Nombre de la pieza"
            formControlName="nombre"
            placeholder="Ej. Carta holo 1ª edición"
            [error]="errorTexto('nombre', 100)"
          />
          <vt-text-field
            label="Descripción"
            formControlName="descripcion"
            [multilinea]="true"
            placeholder="Estado, edición, de dónde viene"
            ayuda="Cuéntale a otros coleccionistas qué la hace especial."
            [error]="errorTexto('descripcion', 2000)"
          />
          <fieldset>
            <legend class="label">Categoría</legend>
            <mat-chip-listbox
              class="vt-rail vt-category-list form-categorias"
              aria-label="Categoría de la pieza"
              [value]="formulario.controls.categoria.value"
              (change)="formulario.controls.categoria.setValue($event.value)"
            >
              @for (c of categorias; track c.slug) {
                <mat-basic-chip-option
                  [value]="c.slug"
                  [disabled]="ocupado()"
                  (selectionChange)="
                    $event.isUserInput && !$event.selected && $event.source.select()
                  "
                >
                  <vt-category-chip
                    [slug]="c.slug"
                    [active]="formulario.controls.categoria.value === c.slug"
                  />
                </mat-basic-chip-option>
              }
            </mat-chip-listbox>
            @if (intento() && formulario.controls.categoria.invalid) {
              <p class="error-txt" role="alert">Elige la categoría de tu pieza.</p>
            }
          </fieldset>
          @if (errorAccion()) {
            <p class="error-txt" role="alert">{{ errorAccion() }}</p>
          }
          <div class="acciones">
            @if (id()) {
              <button
                type="button"
                vt-button
                variant="danger"
                icon="delete"
                [disabled]="ocupado() || leyendo()"
                (click)="errorAccion.set(''); confirmando.set(true)"
              >
                Eliminar pieza
              </button>
            }
            <button
              type="submit"
              vt-button
              variant="primary"
              size="lg"
              [block]="true"
              [disabled]="ocupado() || leyendo()"
            >
              {{ ocupado() ? 'Guardando…' : id() ? 'Guardar cambios' : 'Agregar pieza' }}
            </button>
          </div>
        </div>
        <aside class="vista" aria-label="Vista previa de la pieza">
          <div class="vista-cab">
            <h2 class="title">Así se verá</h2>
            <p class="caption vt-muted">Se actualiza mientras escribes.</p>
          </div>
          @let v = datosVista();
          <div class="escenario" [class]="v.clase">
            <article class="muestra">
              <div class="muestra-foto">
                @if (v.imagen) {
                  <img [src]="v.imagen" alt="" />
                } @else {
                  <vt-icon name="image" [size]="40" />
                }
                <span class="etiqueta"><i></i>{{ v.codigo }} · {{ v.numero }}</span>
              </div>
              <p class="muestra-nombre">{{ v.nombre }}</p>
              <p class="muestra-meta caption vt-muted">
                <vt-avatar [nombre]="usuario()" [tam]="24" />
                <span>&#64;{{ usuario() }}</span>
                <span class="ahora">ahora</span>
              </p>
            </article>
            <p class="caption vt-muted centrado">
              Así aparece en Explorar y en tu colección. La foto se recorta en cuadrado.
            </p>
          </div>
          <div class="detalle-mini" [class]="v.clase">
            <span class="marco">
              @if (v.imagen) {
                <img [src]="v.imagen" alt="" />
              }
            </span>
            <span class="detalle-datos">
              <span class="etiqueta plana"><i></i>{{ v.codigo }} · {{ v.numero }}</span>
              <span class="body-strong">{{ v.nombre }}</span>
              <span class="caption cat">{{ v.categoriaNombre }} · recién agregada</span>
            </span>
          </div>
          <p class="caption vt-muted">El número de catálogo se asigna al guardar la pieza.</p>
        </aside>
      </form>
      <vt-confirm-sheet
        [categoria]="formulario.controls.categoria.value || 'cartas'"
        [abierto]="confirmando()"
        [pendiente]="ocupado()"
        [error]="errorAccion()"
        titulo="¿Eliminar esta pieza?"
        [texto]="
          'Vas a quitar «' +
          formulario.controls.nombre.value +
          '» de tu colección. No se puede deshacer.'
        "
        (cancelado)="confirmando.set(false)"
        (confirmado)="eliminar()"
      />
    } @else if (estado() === 'cargando') {
      <main class="vt-screen"><p role="status">Cargando pieza…</p></main>
    } @else {
      <main class="vt-screen">
        <vt-empty-state
          [titulo]="
            estado() === 'ajena'
              ? 'Esta pieza pertenece a otra persona'
              : estado() === 'no-encontrada'
                ? 'Esta pieza no está disponible'
                : 'No pudimos cargar la pieza'
          "
          [texto]="
            estado() === 'error'
              ? 'Comprueba tu conexión e inténtalo de nuevo.'
              : 'Revisa el enlace o vuelve a tu colección.'
          "
        >
          @if (estado() === 'error') {
            <button vt-button type="button" (click)="pieza.reload()">Reintentar</button>
          }
          <a vt-button variant="secondary" [routerLink]="coleccion()">Ir a mi colección</a>
        </vt-empty-state>
      </main>
    }
  `,
  styles: `
    .formulario {
      max-width: 560px;
      padding-bottom: var(--space-8);
    }
    /* En el teléfono los campos siguen uno bajo otro y no hay vista previa. */
    .campos {
      display: contents;
    }
    .vista {
      display: none;
    }
    @media (min-width: 1000px) {
      /* La pantalla se reparte en dos tarjetas que llegan hasta abajo: campos a la izquierda, vista previa a la derecha. */
      .formulario {
        max-width: none;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-template-rows: auto 1fr;
        column-gap: var(--space-6);
        row-gap: var(--space-4);
        min-height: 100dvh;
        padding: var(--space-6) var(--space-4);
      }
      .formulario > vt-top-bar {
        grid-column: 1 / -1;
      }
      .campos,
      .vista {
        display: flex;
        flex-direction: column;
        gap: var(--space-5);
        padding: var(--space-7, 28px);
        background: var(--surface);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-card);
      }
      .campos vt-image-drop {
        --drop-alto: 240px;
      }
      .campos .vt-rail {
        flex-wrap: wrap;
        overflow: visible;
        margin: 0;
        padding: 0;
      }
      .acciones {
        flex-direction: row-reverse;
        margin-top: auto;
        padding-top: var(--space-5);
        border-top: 1px solid var(--line);
      }
      .acciones [vt-button][size='lg'] {
        flex: 1;
      }
      .vista-cab {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .escenario {
        display: flex;
        flex: 1;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-3);
        padding: var(--space-6);
        background: var(--surface-sunken);
        border-radius: var(--radius-lg);
      }
      .muestra {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        width: min(300px, 100%);
        padding: 8px 8px var(--space-3);
        background: var(--surface);
        border-radius: var(--radius-lg);
        box-shadow:
          0 0 0 3px var(--brand),
          var(--shadow-pop);
      }
      .muestra-foto {
        position: relative;
        display: grid;
        place-items: center;
        aspect-ratio: 1;
        overflow: hidden;
        border-radius: var(--radius-md);
        background: var(--c-soft);
        color: var(--c-ink);
      }
      .muestra-foto img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .muestra-foto .etiqueta {
        position: absolute;
        top: 10px;
        left: 10px;
      }
      .etiqueta {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 10px;
        border-radius: var(--radius-pill);
        background: var(--glass);
        color: var(--ink);
        font: var(--text-catalog);
        letter-spacing: 0.06em;
        text-transform: uppercase;
        box-shadow: var(--shadow-card);
        white-space: nowrap;
      }
      .etiqueta.plana {
        padding: 0;
        background: transparent;
        box-shadow: none;
      }
      .etiqueta i {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--c);
      }
      .muestra-nombre {
        padding: 0 var(--space-2);
        font: var(--text-piece-name);
        overflow-wrap: anywhere;
      }
      .muestra-meta {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 0 var(--space-2);
      }
      .ahora {
        margin-left: auto;
      }
      .centrado {
        text-align: center;
      }
      .detalle-mini {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        padding: 14px var(--space-4);
        background: var(--surface-sunken);
        border-radius: var(--radius-lg);
      }
      .detalle-mini .marco {
        flex: none;
        width: 84px;
        height: 84px;
        overflow: hidden;
        border: 3px solid var(--on-night);
        border-radius: var(--radius-md);
        background: var(--c-soft);
        box-shadow: var(--shadow-pop);
        transform: rotate(-3deg);
      }
      .detalle-mini .marco img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .detalle-datos {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }
      .cat {
        color: var(--c-ink);
        font-weight: 700;
      }
      .sin-categoria {
        --c: var(--line-strong);
        --c-soft: var(--surface-sunken);
        --c-ink: var(--ink-muted);
      }
    }
    fieldset {
      border: 0;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      min-width: 0;
    }
    legend {
      padding: 0;
      margin-bottom: 6px;
    }
    .acciones {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      margin-top: var(--space-2);
    }
    .error-txt {
      color: var(--danger);
      font: var(--text-label);
    }
  `,
})
export class PieceFormPage {
  private readonly api = inject(CatalogoPublicoService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroy = inject(DestroyRef);
  readonly id = input<string>();
  protected readonly pieza = this.api.detalle(this.id);
  protected readonly categorias = CATEGORIAS;
  protected readonly formulario = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: texto(100) }),
    descripcion: new FormControl('', { nonNullable: true, validators: texto(2000) }),
    categoria: new FormControl<CategoriaSlug | null>(null, { validators: Validators.required }),
    imagen_url: new FormControl('', { nonNullable: true, validators: Validators.required }),
  });
  protected readonly estado = computed(() => {
    if (this.id() === undefined) return 'lista';
    if (this.pieza.isLoading()) return 'cargando';
    if (this.pieza.error())
      return (this.pieza.error() as HttpErrorResponse).status === 404 ? 'no-encontrada' : 'error';
    if (!this.pieza.hasValue()) return 'no-encontrada';
    return this.pieza.value().dueno.id === this.auth.usuario()?.id ? 'lista' : 'ajena';
  });
  protected readonly usuario = computed(() => this.auth.usuario()?.username ?? 'tu_usuario');
  private readonly valores = toSignal(
    this.formulario.valueChanges.pipe(
      startWith(null),
      map(() => this.formulario.getRawValue()),
    ),
    { initialValue: this.formulario.getRawValue() },
  );
  /** Lo que se dibuja en la vista previa de escritorio. */
  protected readonly datosVista = computed(() => {
    const v = this.valores();
    const categoria = v.categoria;
    return {
      nombre: v.nombre.trim() || 'Nombre de tu pieza',
      imagen: v.imagen_url,
      codigo: categoria ? categoriaDe(categoria).codigo : 'CAT',
      categoriaNombre: categoria ? categoriaDe(categoria).nombre : 'Sin categoría',
      numero: this.id() ? numeroCatalogo(Number(this.id())) : '#····',
      clase: categoria ? `vt-c-${categoria}` : 'sin-categoria',
    };
  });
  protected readonly intento = signal(false);
  protected readonly confirmando = signal(false);
  protected readonly ocupado = signal(false);
  protected readonly leyendo = signal(false);
  protected readonly errorAccion = signal('');

  constructor() {
    effect(() => {
      if (!this.pieza.hasValue()) return;
      const { nombre, descripcion, categoria, imagen_url } = this.pieza.value();
      untracked(() => this.formulario.reset({ nombre, descripcion, categoria, imagen_url }));
    });
  }
  protected coleccion(): string[] {
    return ['/coleccionistas', this.auth.usuario()?.username ?? ''];
  }
  protected errorTexto(campo: 'nombre' | 'descripcion', max: number): string {
    const control = this.formulario.controls[campo];
    if (!this.intento() && !control.touched) return '';
    return control.hasError('required')
      ? 'Este campo es obligatorio.'
      : control.hasError('maxlength')
        ? `Usa como máximo ${max} caracteres.`
        : '';
  }
  protected guardar(): void {
    if (this.estado() !== 'lista' || this.ocupado() || this.leyendo()) return;
    this.intento.set(true);
    if (this.formulario.invalid) return;
    const valor = this.formulario.getRawValue();
    if (!valor.categoria) return;
    const datos = {
      ...valor,
      nombre: valor.nombre.trim(),
      descripcion: valor.descripcion.trim(),
      categoria: valor.categoria,
    };
    const id = this.id();
    this.ocupado.set(true);
    this.errorAccion.set('');
    this.formulario.disable();
    (id ? this.api.actualizar(Number(id), datos) : this.api.crear(datos))
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (pieza) => {
          this.ocupado.set(false);
          this.toast.show(id ? 'Cambios guardados' : 'Pieza agregada', 'success');
          void this.router.navigate(['/pieza', pieza.id]);
        },
        error: (e: HttpErrorResponse) => {
          this.ocupado.set(false);
          this.formulario.enable();
          this.errorAccion.set(mensajeError(e));
        },
      });
  }
  protected eliminar(): void {
    const id = this.id();
    if (this.estado() !== 'lista' || !id || this.ocupado()) return;
    this.ocupado.set(true);
    this.errorAccion.set('');
    this.api
      .eliminar(Number(id))
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => {
          this.ocupado.set(false);
          this.confirmando.set(false);
          this.toast.show('Pieza eliminada', 'success');
          void this.router.navigate(this.coleccion());
        },
        error: (e: HttpErrorResponse) => {
          this.ocupado.set(false);
          this.errorAccion.set(mensajeError(e));
        },
      });
  }
}

function mensajeError(e: HttpErrorResponse): string {
  if (e.status === 403) return 'Solo el dueño puede modificar esta pieza.';
  if (e.status === 404) return 'Esta pieza ya no está disponible.';
  if (e.status === 400 && typeof e.error?.detail === 'string') return e.error.detail;
  if (e.status === 422) return 'Revisa los datos de la pieza e inténtalo de nuevo.';
  return 'No pudimos guardar los cambios. Comprueba tu conexión e inténtalo de nuevo.';
}
