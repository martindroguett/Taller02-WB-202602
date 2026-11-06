import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { Button } from '../components/button';
import { CategoryChip } from '../components/category-chip';
import { ConfirmSheet } from '../components/confirm-sheet';
import { EmptyState } from '../components/empty-state';
import { ImageDrop } from '../components/image-drop';
import { TextField } from '../components/text-field';
import { TopBar } from '../components/top-bar';
import { CATEGORIAS, CategoriaSlug } from '../models/vitrina';
import { AuthService } from '../services/auth.service';
import { CatalogoPublicoService } from '../services/catalogo-publico.service';
import { ToastService } from '../services/toast.service';

// Pydantic cuenta puntos Unicode después de quitar espacios, no unidades UTF-16.
const texto: (max: number) => ValidatorFn = (max) => (control) => {
  const valor = (control.value as string).trim();
  return !valor ? { required: true } : Array.from(valor).length > max ? { maxlength: true } : null;
};
const categoria: ValidatorFn = (control) =>
  CATEGORIAS.some((c) => c.slug === control.value) ? null : { required: true };

@Component({
  selector: 'vt-piece-form-page',
  imports: [
    ReactiveFormsModule,
    Button,
    CategoryChip,
    ConfirmSheet,
    EmptyState,
    ImageDrop,
    TextField,
    TopBar,
    RouterLink,
  ],
  template: `
    @if (estado() === 'lista' && (!id() || duenoId() === auth.usuario()?.id)) {
      <form class="vt-screen formulario" [formGroup]="formulario" (ngSubmit)="guardar()" novalidate>
        <vt-top-bar
          [titulo]="id() ? 'Editar pieza' : 'Agregar pieza'"
          [small]="true"
          icono="close"
        />
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
          <div class="vt-rail" role="group" aria-label="Categoría de la pieza">
            @for (c of categorias; track c.slug) {
              <button
                type="button"
                vt-category-chip
                [slug]="c.slug"
                [active]="formulario.controls.categoria.value === c.slug"
                [disabled]="ocupado()"
                (click)="formulario.controls.categoria.setValue(c.slug)"
              ></button>
            }
          </div>
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
            estado() === 'ajena' || estado() === 'lista'
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
            <button vt-button type="button" (click)="reintentar.next()">Reintentar</button>
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
  protected readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroy = inject(DestroyRef);
  protected readonly categorias = CATEGORIAS;
  protected readonly formulario = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: texto(100) }),
    descripcion: new FormControl('', { nonNullable: true, validators: texto(2000) }),
    categoria: new FormControl<CategoriaSlug | null>(null, { validators: categoria }),
    imagen_url: new FormControl('', { nonNullable: true, validators: Validators.required }),
  });
  protected readonly id = signal<number | null>(null);
  protected readonly duenoId = signal<number | null>(null);
  protected readonly estado = signal<'lista' | 'cargando' | 'ajena' | 'no-encontrada' | 'error'>(
    'cargando',
  );
  protected readonly intento = signal(false);
  protected readonly confirmando = signal(false);
  protected readonly ocupado = signal(false);
  protected readonly leyendo = signal(false);
  protected readonly errorAccion = signal('');
  protected readonly reintentar = new Subject<void>();
  private versionRuta = 0;

  constructor() {
    this.route.paramMap
      .pipe(
        tap(() => {
          this.versionRuta++;
          this.ocupado.set(false);
          this.leyendo.set(false);
        }),
        switchMap((params) =>
          this.reintentar.pipe(
            startWith(undefined),
            switchMap(() => {
              this.estado.set('cargando');
              this.id.set(null);
              this.duenoId.set(null);
              this.confirmando.set(false);
              this.formulario.enable();
              this.intento.set(false);
              this.errorAccion.set('');
              const valor = params.get('id');
              if (valor === null) return of({ tipo: 'nueva' as const });
              if (!/^[1-9]\d*$/.test(valor) || !Number.isSafeInteger(Number(valor)))
                return of({ tipo: 'no-encontrada' as const });
              return this.api.obtener(Number(valor)).pipe(
                map((pieza) => ({ tipo: 'pieza' as const, pieza })),
                catchError((e: HttpErrorResponse) =>
                  of({ tipo: e.status === 404 ? ('no-encontrada' as const) : ('error' as const) }),
                ),
              );
            }),
          ),
        ),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe((resultado) => {
        if (resultado.tipo === 'nueva') {
          this.id.set(null);
          this.duenoId.set(null);
          this.formulario.reset({ nombre: '', descripcion: '', categoria: null, imagen_url: '' });
          this.estado.set('lista');
        } else if (resultado.tipo === 'pieza') {
          if (resultado.pieza.dueno.id !== this.auth.usuario()?.id) {
            this.estado.set('ajena');
            return;
          }
          this.id.set(resultado.pieza.id);
          this.duenoId.set(resultado.pieza.dueno.id);
          this.formulario.reset({
            nombre: resultado.pieza.nombre,
            descripcion: resultado.pieza.descripcion,
            categoria: resultado.pieza.categoria,
            imagen_url: resultado.pieza.imagen_url,
          });
          this.estado.set('lista');
        } else this.estado.set(resultado.tipo);
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
    if (
      this.estado() !== 'lista' ||
      this.ocupado() ||
      this.leyendo() ||
      (this.id() && this.duenoId() !== this.auth.usuario()?.id)
    )
      return;
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
    const version = this.versionRuta;
    this.ocupado.set(true);
    this.errorAccion.set('');
    this.formulario.disable();
    (id ? this.api.actualizar(id, datos) : this.api.crear(datos))
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (pieza) => {
          if (version !== this.versionRuta) return;
          this.ocupado.set(false);
          this.toast.show(id ? 'Cambios guardados' : 'Pieza agregada', 'success');
          void this.router.navigate(['/pieza', pieza.id]);
        },
        error: (e: HttpErrorResponse) => {
          if (version !== this.versionRuta) return;
          this.ocupado.set(false);
          this.formulario.enable();
          this.errorAccion.set(mensajeError(e));
        },
      });
  }
  protected eliminar(): void {
    const id = this.id();
    if (
      this.estado() !== 'lista' ||
      !id ||
      this.ocupado() ||
      this.duenoId() !== this.auth.usuario()?.id
    )
      return;
    const version = this.versionRuta;
    this.ocupado.set(true);
    this.errorAccion.set('');
    this.api
      .eliminar(id)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => {
          if (version !== this.versionRuta) return;
          this.ocupado.set(false);
          this.confirmando.set(false);
          this.toast.show('Pieza eliminada', 'success');
          void this.router.navigate(this.coleccion());
        },
        error: (e: HttpErrorResponse) => {
          if (version !== this.versionRuta) return;
          this.ocupado.set(false);
          this.errorAccion.set(mensajeError(e));
        },
      });
  }
}

export function mensajeError(e: HttpErrorResponse): string {
  if (e.status === 403) return 'Solo el dueño puede modificar esta pieza.';
  if (e.status === 404) return 'Esta pieza ya no está disponible.';
  if (e.status === 400 && typeof e.error?.detail === 'string') return e.error.detail;
  if (e.status === 422) return 'Revisa los datos de la pieza e inténtalo de nuevo.';
  return 'No pudimos guardar los cambios. Comprueba tu conexión e inténtalo de nuevo.';
}
