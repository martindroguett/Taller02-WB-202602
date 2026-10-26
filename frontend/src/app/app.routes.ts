import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Explorar · Vitrina',
    loadComponent: () => import('./pages/explore').then((m) => m.ExplorePage),
  },
  {
    path: 'feed',
    title: 'Feed · Vitrina',
    loadComponent: () => import('./pages/feed').then((m) => m.FeedPage),
  },
  {
    path: 'favoritos',
    title: 'Favoritos · Vitrina',
    loadComponent: () => import('./pages/favorites').then((m) => m.FavoritesPage),
  },
  {
    path: 'perfil',
    title: 'Perfil · Vitrina',
    loadComponent: () => import('./pages/profile').then((m) => m.ProfilePage),
  },
  {
    path: 'perfil/:usuario',
    title: 'Perfil · Vitrina',
    loadComponent: () => import('./pages/profile').then((m) => m.ProfilePage),
  },
  {
    path: 'pieza/:id',
    title: 'Pieza · Vitrina',
    loadComponent: () => import('./pages/piece').then((m) => m.PiecePage),
  },
  {
    path: 'coleccion/nueva',
    title: 'Agregar pieza · Vitrina',
    loadComponent: () => import('./pages/piece-form').then((m) => m.PieceFormPage),
  },
  {
    path: 'coleccion/:id/editar',
    title: 'Editar pieza · Vitrina',
    loadComponent: () => import('./pages/piece-form').then((m) => m.PieceFormPage),
  },
  {
    path: 'ingresar',
    title: 'Ingresar · Vitrina',
    loadComponent: () => import('./pages/login').then((m) => m.LoginPage),
  },
  { path: '**', redirectTo: '' },
];
