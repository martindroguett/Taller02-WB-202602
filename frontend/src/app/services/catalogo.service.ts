import { Injectable, computed, inject, signal } from '@angular/core';
import { DatosPieza, Pieza, Usuario } from '../models/vitrina';
import { ToastService } from './toast.service';

// Datos de demostración: se reinician al recargar. La API reemplazará estas operaciones locales.
const USUARIOS: Usuario[] = [
  {
    id: 1,
    username: 'tomas_retro',
    bio: 'Cartuchos, vinilos de primera prensa y mucho polvo. Santiago.',
    seguidores: 1284,
    siguiendo: 48,
  },
  {
    id: 2,
    username: 'rocio_cartas',
    bio: 'Cartas desde 1999. Cambio repetidas por holos.',
    seguidores: 862,
    siguiendo: 120,
  },
  {
    id: 3,
    username: 'mati_vinilos',
    bio: 'Prensas en color y ediciones limitadas.',
    seguidores: 2410,
    siguiendo: 76,
  },
  {
    id: 4,
    username: 'fer_juguetes',
    bio: 'Juguetes de hojalata y figuras de los 80.',
    seguidores: 540,
    siguiendo: 64,
  },
  {
    id: 5,
    username: 'diego_8bit',
    bio: 'Consolas portátiles, de la Game Boy en adelante.',
    seguidores: 395,
    siguiendo: 88,
  },
];

const PIEZAS: Pieza[] = [
  {
    id: 1,
    nombre: 'Carta T206 de béisbol, 1909',
    descripcion:
      'Réplica fiel de la carta de tabaco más famosa del béisbol. Marco de papel con desgaste, retrato a color.',
    categoria: 'cartas',
    imagen_url: '/fotos/carta-beisbol.jpg',
    duenoId: 2,
    numero: 231,
    megusta: 1284,
    guardados: 410,
    hace: 190,
    destacada: true,
  },
  {
    id: 2,
    nombre: 'Binders de intercambio',
    descripcion: 'Dos binders con ediciones del 2004 al 2010. Sin pliegues y con fundas nuevas.',
    categoria: 'cartas',
    imagen_url: '/fotos/mesa-cartas.jpg',
    duenoId: 2,
    numero: 232,
    megusta: 318,
    guardados: 96,
    hace: 60 * 26,
  },
  {
    id: 3,
    nombre: 'Game Boy DMG-01 con Tetris',
    descripcion: 'Pantalla con marcas de uso, funciona perfecto. Incluye el cartucho de Tetris.',
    categoria: 'videojuegos',
    imagen_url: '/fotos/gameboy.jpg',
    duenoId: 5,
    numero: 87,
    megusta: 942,
    guardados: 301,
    hace: 45,
  },
  {
    id: 4,
    nombre: 'Carcasa de cartucho NES',
    descripcion: 'Carcasa gris original, sin etiqueta. La uso para proyectos de reparación.',
    categoria: 'videojuegos',
    imagen_url: '/fotos/cartucho-nes.jpg',
    duenoId: 1,
    numero: 102,
    megusta: 127,
    guardados: 31,
    hace: 60 * 30,
  },
  {
    id: 5,
    nombre: 'Robot de hojalata a cuerda',
    descripcion: 'Años 60, con la pintura original. Camina derecho y mueve los brazos.',
    categoria: 'juguetes',
    imagen_url: '/fotos/robot.jpg',
    duenoId: 4,
    numero: 40,
    megusta: 755,
    guardados: 208,
    hace: 60 * 5,
  },
  {
    id: 6,
    nombre: 'Soldado de plástico, serie selva',
    descripcion:
      'Figura de los 80 con el casco original. La fotografié al sol, en la tierra del patio.',
    categoria: 'juguetes',
    imagen_url: '/fotos/soldado.jpg',
    duenoId: 4,
    numero: 41,
    megusta: 264,
    guardados: 58,
    hace: 60 * 24 * 4,
  },
  {
    id: 7,
    nombre: 'Vinilo turquesa, prensa limitada',
    descripcion: 'Prensa en color de 180 g. Suena limpio de principio a fin.',
    categoria: 'vinilos',
    imagen_url: '/fotos/vinilo-turquesa.jpg',
    duenoId: 3,
    numero: 155,
    megusta: 1090,
    guardados: 372,
    hace: 60 * 2,
  },
  {
    id: 8,
    nombre: 'Primera prensa, inserto intacto',
    descripcion: 'Disco negro de primera prensa, lo escuché una vez para limpiarlo. Aguja nueva.',
    categoria: 'vinilos',
    imagen_url: '/fotos/vinilo-negro.jpg',
    duenoId: 1,
    numero: 156,
    megusta: 412,
    guardados: 120,
    hace: 60 * 50,
  },
];

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly toast = inject(ToastService);

  readonly yo = USUARIOS[0];
  readonly usuarios = USUARIOS;
  readonly piezas = signal<Pieza[]>(PIEZAS);

  readonly guardadas = signal<ReadonlySet<number>>(new Set([1, 3, 5, 7]));
  readonly gustadas = signal<ReadonlySet<number>>(new Set([3]));
  readonly siguiendo = signal<ReadonlySet<number>>(new Set([2, 3]));

  readonly recientes = computed(() => [...this.piezas()].sort((a, b) => a.hace - b.hace));
  readonly feed = computed(() => this.recientes().filter((p) => this.siguiendo().has(p.duenoId)));
  readonly seguidos = computed(() => this.usuarios.filter((u) => this.siguiendo().has(u.id)));
  readonly favoritas = computed(() => this.recientes().filter((p) => this.guardadas().has(p.id)));

  pieza(id: number): Pieza | undefined {
    return this.piezas().find((p) => p.id === id);
  }

  usuario(id: number): Usuario {
    return this.usuarios.find((u) => u.id === id)!;
  }

  usuarioPorHandle(handle: string): Usuario | undefined {
    return this.usuarios.find((u) => u.username === handle);
  }

  piezasDe(usuarioId: number): Pieza[] {
    return this.piezas().filter((p) => p.duenoId === usuarioId);
  }

  megusta(p: Pieza): number {
    return p.megusta + (this.gustadas().has(p.id) ? 1 : 0);
  }

  seguidores(u: Usuario): number {
    return u.seguidores + (u.id !== this.yo.id && this.siguiendo().has(u.id) ? 1 : 0);
  }

  toggleGuardar(id: number): void {
    if (!this.pieza(id)) return;
    const eraGuardada = this.guardadas().has(id);
    this.guardadas.update((s) => alternar(s, id));
    this.toast.show(eraGuardada ? 'Quitada de favoritos' : 'Guardada en favoritos', 'success', {
      texto: 'Deshacer',
      fn: () => this.guardadas.update((s) => alternar(s, id)),
    });
  }

  toggleMeGusta(id: number): void {
    if (!this.pieza(id)) return;
    this.gustadas.update((s) => alternar(s, id));
  }

  toggleSeguir(id: number): void {
    if (id === this.yo.id || !this.usuarios.some((u) => u.id === id)) return;
    const seguia = this.siguiendo().has(id);
    this.siguiendo.update((s) => alternar(s, id));
    this.toast.show(
      seguia ? 'Dejaste de seguir' : `Sigues a @${this.usuario(id).username}`,
      'success',
    );
  }

  agregar(datos: DatosPieza): Pieza {
    const sig = Math.max(0, ...this.piezas().map((p) => p.id)) + 1;
    const nueva: Pieza = {
      ...datos,
      id: sig,
      duenoId: this.yo.id,
      numero: 200 + sig,
      megusta: 0,
      guardados: 0,
      hace: 0,
    };
    this.piezas.update((ps) => [nueva, ...ps]);
    return nueva;
  }

  actualizar(id: number, datos: DatosPieza): void {
    if (this.pieza(id)?.duenoId !== this.yo.id) return;
    this.piezas.update((ps) => ps.map((p) => (p.id === id ? { ...p, ...datos } : p)));
  }

  eliminar(id: number): void {
    if (this.pieza(id)?.duenoId !== this.yo.id) return;
    this.piezas.update((ps) => ps.filter((p) => p.id !== id));
    this.guardadas.update((s) => new Set([...s].filter((piezaId) => piezaId !== id)));
    this.gustadas.update((s) => new Set([...s].filter((piezaId) => piezaId !== id)));
  }

  async compartir(id: number): Promise<void> {
    try {
      await navigator.clipboard.writeText(`${location.origin}/pieza/${id}`);
      this.toast.show('Enlace copiado', 'success');
    } catch {
      this.toast.show(
        'No pudimos copiar el enlace: cópialo desde la barra del navegador.',
        'danger',
      );
    }
  }
}

function alternar(set: ReadonlySet<number>, id: number): ReadonlySet<number> {
  const copia = new Set(set);
  if (!copia.delete(id)) copia.add(id);
  return copia;
}
