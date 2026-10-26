import {
  Component,
  OnChanges,
  computed,
  inject,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Button } from '../components/button';
import { CategoryChip } from '../components/category-chip';
import { ConfirmSheet } from '../components/confirm-sheet';
import { ImageDrop } from '../components/image-drop';
import { TextField } from '../components/text-field';
import { TopBar } from '../components/top-bar';
import { CatalogoService } from '../services/catalogo.service';
import { ToastService } from '../services/toast.service';
import { CATEGORIAS, CategoriaSlug } from '../models/vitrina';

@Component({
  selector: 'vt-piece-form-page',
  imports: [Button, CategoryChip, ConfirmSheet, ImageDrop, TextField, TopBar],
  template: `
    <form class="vt-screen formulario" (submit)="guardar($event)" novalidate>
      <vt-top-bar
        [titulo]="editando() ? 'Editar pieza' : 'Agregar pieza'"
        [small]="true"
        icono="close"
      />

      <vt-image-drop [(imagen)]="imagen" />
      @if (intento() && errores().imagen) {
        <p class="error-txt" role="alert">{{ errores().imagen }}</p>
      }

      <vt-text-field
        label="Nombre de la pieza"
        [(valor)]="nombre"
        placeholder="Ej. Carta holo 1ª edición"
        [error]="intento() ? errores().nombre : ''"
        [maxLength]="100"
      />
      <vt-text-field
        label="Descripción"
        [(valor)]="descripcion"
        [multilinea]="true"
        placeholder="Estado, edición, de dónde viene"
        ayuda="Cuéntale a otros coleccionistas qué la hace especial."
        [error]="intento() ? errores().descripcion : ''"
      />

      <fieldset>
        <legend class="label">Categoría</legend>
        <div class="vt-rail" role="group" aria-label="Categoría de la pieza">
          @for (c of categorias; track c.slug) {
            <button
              type="button"
              vt-category-chip
              [slug]="c.slug"
              [active]="categoria() === c.slug"
              (click)="categoria.set(c.slug)"
            ></button>
          }
        </div>
        @if (intento() && errores().categoria) {
          <p class="error-txt">{{ errores().categoria }}</p>
        }
      </fieldset>

      <div class="acciones">
        @if (editando()) {
          <button
            type="button"
            vt-button
            variant="danger"
            icon="delete"
            (click)="confirmando.set(true)"
          >
            Eliminar pieza
          </button>
        }
        <button type="submit" vt-button variant="primary" size="lg" [block]="true">
          {{ editando() ? 'Guardar cambios' : 'Agregar pieza' }}
        </button>
      </div>
    </form>

    <vt-confirm-sheet
      [categoria]="categoria() ?? 'cartas'"
      [abierto]="confirmando()"
      titulo="¿Eliminar esta pieza?"
      [texto]="'Vas a quitar «' + nombre() + '» de tu colección. No se puede deshacer.'"
      (cancelado)="confirmando.set(false)"
      (confirmado)="eliminar()"
    />
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
export class PieceFormPage implements OnChanges {
  private readonly catalogo = inject(CatalogoService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** Parámetro de ruta :id (solo al editar) */
  readonly id = input<number | undefined, string | undefined>(undefined, {
    transform: (v) => (v ? numberAttribute(v) : undefined),
  });

  protected readonly categorias = CATEGORIAS;
  protected readonly nombre = signal('');
  protected readonly descripcion = signal('');
  protected readonly categoria = signal<CategoriaSlug | null>(null);
  protected readonly imagen = signal<string | null>(null);
  protected readonly confirmando = signal(false);
  protected readonly intento = signal(false);

  protected readonly editando = computed(() => this.id() !== undefined);
  protected readonly errores = computed(() => ({
    nombre: !this.nombre().trim()
      ? 'Escribe un nombre para tu pieza.'
      : this.nombre().trim().length > 100
        ? 'Usa como máximo 100 caracteres.'
        : '',
    descripcion: this.descripcion().trim() ? '' : 'Describe tu pieza.',
    categoria: this.categoria() ? '' : 'Elige la categoría de tu pieza.',
    imagen: this.imagen() ? '' : 'Agrega una foto de tu pieza.',
  }));

  ngOnChanges(): void {
    const id = this.id();
    if (id === undefined) return;
    const p = this.catalogo.pieza(id);
    if (!p || p.duenoId !== this.catalogo.yo.id) {
      this.router.navigateByUrl(p ? `/pieza/${p.id}` : '/');
      return;
    }
    this.nombre.set(p.nombre);
    this.descripcion.set(p.descripcion);
    this.categoria.set(p.categoria);
    this.imagen.set(p.imagen_url);
    this.intento.set(false);
  }

  protected guardar(ev: Event): void {
    ev.preventDefault();
    this.intento.set(true);
    const categoria = this.categoria();
    const imagen = this.imagen();
    if (Object.values(this.errores()).some(Boolean) || !imagen) {
      this.toast.show('Revisa el formulario: faltan datos de tu pieza.', 'danger');
      return;
    }
    const datos = {
      nombre: this.nombre().trim(),
      descripcion: this.descripcion().trim(),
      categoria: categoria!,
      imagen_url: imagen,
    };
    const id = this.id();
    if (id !== undefined) {
      this.catalogo.actualizar(id, datos);
      this.toast.show('Cambios guardados', 'success');
      this.router.navigate(['/pieza', id]);
    } else {
      const nueva = this.catalogo.agregar(datos);
      this.toast.show('Pieza agregada a tu colección', 'success');
      this.router.navigate(['/pieza', nueva.id]);
    }
  }

  protected eliminar(): void {
    const id = this.id();
    if (id === undefined) return;
    this.catalogo.eliminar(id);
    this.confirmando.set(false);
    this.toast.show('Pieza eliminada', 'success');
    this.router.navigateByUrl('/perfil');
  }
}
