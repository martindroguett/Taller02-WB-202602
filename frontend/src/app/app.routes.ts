import { Routes } from '@angular/router';
import { authGuard, invitadoGuard } from './guards/auth.guard';

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
    canActivate: [authGuard],
  },
  {
    path: 'favoritos',
    title: 'Favoritos · Vitrina',
    loadComponent: () => import('./pages/favorites').then((m) => m.FavoritesPage),
    canActivate: [authGuard],
  },
  {
    path: 'perfil',
    title: 'Perfil · Vitrina',
    loadComponent: () => import('./pages/profile').then((m) => m.ProfilePage),
    canActivate: [authGuard],
  },
  {
    path: 'perfil/:usuario',
    title: 'Perfil · Vitrina',
    loadComponent: () => import('./pages/profile').then((m) => m.ProfilePage),
  },
  {
    path: 'coleccionistas/:usuario',
    title: 'Coleccionista · Vitrina',
    loadComponent: () => import('./pages/public-profile').then((m) => m.PublicProfilePage),
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
    canActivate: [authGuard],
  },
  {
    path: 'coleccion/:id/editar',
    title: 'Editar pieza · Vitrina',
    loadComponent: () => import('./pages/piece-form').then((m) => m.PieceFormPage),
    canActivate: [authGuard],
  },
  {
    path: 'ingresar',
    title: 'Ingresar · Vitrina',
    loadComponent: () => import('./pages/login').then((m) => m.LoginPage),
    canActivate: [invitadoGuard],
  },
  { path: '**', redirectTo: '' },
];
