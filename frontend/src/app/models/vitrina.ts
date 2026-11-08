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

export interface DatosPieza {
  nombre: string;
  descripcion: string;
  categoria: CategoriaSlug;
  imagen_url: string;
}
