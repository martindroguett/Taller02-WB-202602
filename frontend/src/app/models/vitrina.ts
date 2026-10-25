export type CategoriaSlug = 'cartas' | 'videojuegos' | 'juguetes' | 'vinilos';
export type Filtro = CategoriaSlug | 'todas';

export interface Categoria {
  slug: CategoriaSlug;
  nombre: string;
  icono: string;
  codigo: 'CRT' | 'VJG' | 'JGT' | 'VNL';
}

export const CATEGORIAS: Categoria[] = [
  { slug: 'cartas', nombre: 'Cartas', icono: 'style', codigo: 'CRT' },
  { slug: 'videojuegos', nombre: 'Videojuegos', icono: 'sports_esports', codigo: 'VJG' },
  { slug: 'juguetes', nombre: 'Juguetes', icono: 'smart_toy', codigo: 'JGT' },
  { slug: 'vinilos', nombre: 'Vinilos', icono: 'album', codigo: 'VNL' },
];

export const categoriaDe = (slug: CategoriaSlug): Categoria =>
  CATEGORIAS.find((c) => c.slug === slug)!;

export interface Usuario {
  id: number;
  nombre: string;
  /** Sin la @ */
  usuario: string;
  bio: string;
  seguidores: number;
  siguiendo: number;
}

export interface Pieza {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: CategoriaSlug;
  imagen_url: string | null;
  duenoId: number;
  /** Número de catálogo: CRT · #0231 */
  numero: number;
  megusta: number;
  guardados: number;
  /** Minutos desde que se agregó */
  hace: number;
  destacada?: boolean;
}

export type DatosPieza = Pick<Pieza, 'nombre' | 'descripcion' | 'categoria' | 'imagen_url'>;
