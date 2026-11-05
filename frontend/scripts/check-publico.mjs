import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { transpileModule, ModuleKind, ScriptTarget } from 'typescript';
import '@angular/compiler';
import {
  createEnvironmentInjector,
  PendingTasks,
  signal,
  ErrorHandler,
  ɵEffectScheduler,
  ɵChangeDetectionScheduler,
  ɵSIGNAL,
} from '@angular/core';
import { provideHttpClient, withNoXsrfProtection } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

// Importa las clases reales en Node con las dependencias Angular existentes.
const src = new URL('../src/app/', import.meta.url);
const dest = new URL('../.angular/checks-publico/', import.meta.url);
async function preparar(path = '') {
  await mkdir(new URL(path, dest), { recursive: true });
  for (const entry of await readdir(new URL(path, src), { withFileTypes: true })) {
    if (entry.isDirectory()) {
      await preparar(`${path}${entry.name}/`);
      continue;
    }
    if (!entry.name.endsWith('.ts')) continue;
    const source = await readFile(new URL(`${path}${entry.name}`, src), 'utf8');
    const { outputText } = transpileModule(source, {
      compilerOptions: {
        module: ModuleKind.ESNext,
        target: ScriptTarget.ES2022,
        experimentalDecorators: true,
      },
    });
    await writeFile(
      new URL(`${path}${entry.name.replace(/\.ts$/, '.mjs')}`, dest),
      outputText.replace(/(from\s+['"])(\.{1,2}\/[^'"]+)(['"])/g, '$1$2.mjs$3'),
    );
  }
}
await preparar();
const environmentSource = await readFile(
  new URL('../src/environments/environment.ts', import.meta.url),
  'utf8',
);
const environmentDest = new URL('../.angular/environments/', import.meta.url);
await mkdir(environmentDest, { recursive: true });
await writeFile(
  new URL('environment.mjs', environmentDest),
  transpileModule(environmentSource, {
    compilerOptions: { module: ModuleKind.ESNext, target: ScriptTarget.ES2022 },
  }).outputText,
);
const { environment } = await import(new URL('environment.mjs', environmentDest));
const { ExplorePage } = await import(new URL('pages/explore.mjs', dest));
const { PiecePage } = await import(new URL('pages/piece.mjs', dest));
const { PublicProfilePage } = await import(new URL('pages/public-profile.mjs', dest));
const { AuthService } = await import(new URL('services/auth.service.mjs', dest));
const { PieceCard } = await import(new URL('components/piece-card.mjs', dest));
const { LikeButton } = await import(new URL('components/like-button.mjs', dest));
const { FollowButton } = await import(new URL('components/follow-button.mjs', dest));
const { CatalogoService } = await import(new URL('services/catalogo.service.mjs', dest));
const { CatalogoPublicoService } = await import(
  new URL('services/catalogo-publico.service.mjs', dest)
);
const { ToastService } = await import(new URL('services/toast.service.mjs', dest));
const { UsuariosPublicosService } = await import(
  new URL('services/usuarios-publicos.service.mjs', dest)
);
const { Location } = await import('@angular/common');
const query = new BehaviorSubject(convertToParamMap({}));
const params = new BehaviorSubject(convertToParamMap({ id: '7' }));
const route = { queryParamMap: query, paramMap: params, snapshot: { queryParamMap: query.value } };
const router = {
  navigate: async (_, options) => {
    const values = Object.fromEntries(
      Object.entries(options.queryParams).filter(([, v]) => v != null),
    );
    route.snapshot.queryParamMap = convertToParamMap(values);
    query.next(route.snapshot.queryParamMap);
    return true;
  },
  navigateByUrl: async () => true,
};
const injector = createEnvironmentInjector([
  provideHttpClient(withNoXsrfProtection()),
  provideHttpClientTesting(),
  CatalogoPublicoService,
  UsuariosPublicosService,
  CatalogoService,
  PieceCard,
  LikeButton,
  FollowButton,
  ExplorePage,
  PiecePage,
  { provide: PendingTasks, useValue: { add: () => () => {} } },
  { provide: ActivatedRoute, useValue: route },
  { provide: Router, useValue: router },
  { provide: Location, useValue: { back() {} } },
  { provide: ToastService, useValue: { show() {} } },
]);
const http = injector.get(HttpTestingController);
const fixture = (id) => ({
  id,
  nombre: `Pieza ${id}`,
  descripcion: 'Descripción',
  categoria: 'cartas',
  imagen_url: '',
  dueno: { id: 1, username: 'ana' },
  megusta: 0,
  guardados: 0,
  gustada: false,
  guardada: false,
  creado_en: '2026-01-01T00:00:00Z',
  actualizado_en: '2026-01-01T00:00:00Z',
});
const page = (items, total, desplazamiento = 0) => ({ items, total, limite: 20, desplazamiento });
const request = (offset, q = null, categoria = null) =>
  http.expectOne(
    (r) =>
      r.url === `${environment.apiUrl}/piezas` &&
      r.params.get('desplazamiento') === String(offset) &&
      r.params.get('q') === q &&
      r.params.get('categoria') === categoria &&
      r.params.get('orden') === 'recientes',
  );
try {
  const explore = injector.get(ExplorePage);
  const first = request(0);
  first.flush(
    page(
      Array.from({ length: 20 }, (_, i) => fixture(i + 1)),
      22,
    ),
  );
  assert.equal(explore.total(), 22);
  explore.cargar();
  explore.cargar();
  const more = request(20);
  more.flush('error', { status: 500, statusText: 'Error' });
  assert.equal(explore.resultados().length, 20);
  assert.equal(explore.error(), true);
  explore.cargar();
  request(20).flush(page([fixture(20), fixture(21)], 22, 20));
  assert.equal(explore.resultados().length, 21, 'No debe repetir piezas');
  assert.equal(explore.total(), 22);
  explore.buscar('vinilo');
  assert.equal(explore.resultados().length, 0);
  await new Promise((resolve) => setTimeout(resolve, 320));
  const old = request(0, 'vinilo');
  explore.buscar('cartas');
  assert.equal(old.cancelled, true);
  explore.elegirCategoria('cartas');
  request(0, 'cartas', 'cartas').flush(page([fixture(30)], 1));
  assert.equal(explore.resultados()[0].id, 30);
  explore.limpiar();
  request(0).flush(page([], 0));
  assert.equal(explore.total(), 0);
  assert.equal(explore.resultados().length, 0);
  // Los identificadores públicos pueden coincidir con los del mock: nunca deben modificarlo.
  const mock = injector.get(CatalogoService);
  const publicPiece = { ...fixture(1), guardada: false, gustada: false, megusta: 8 };
  const setInput = (input, value) => input[ɵSIGNAL].applyValueToInputSignal(input[ɵSIGNAL], value);
  const saved = [...mock.guardadas()];
  const likes = [...mock.gustadas()];
  const follows = [...mock.siguiendo()];
  const card = injector.get(PieceCard);
  setInput(card.pieza, publicPiece);
  assert.equal(card.esPublica(), true);
  assert.deepEqual(card.detalleLink(), ['/pieza', 1]);
  assert.equal(card.guardada(), false);
  assert.equal(card.megusta(), '8');
  card.alternarGuardar();
  const like = injector.get(LikeButton);
  setInput(like.pieza, publicPiece);
  like.alternar();
  const follow = injector.get(FollowButton);
  setInput(follow.usuarioId, 2);
  setInput(follow.pendiente, true);
  follow.alternar();
  assert.deepEqual([...mock.guardadas()], saved);
  assert.deepEqual([...mock.gustadas()], likes);
  assert.deepEqual([...mock.siguiendo()], follows);
  setInput(card.pieza, mock.pieza(1));
  assert.equal(card.detalleLink(), null, 'Una pieza de muestra no debe abrir el detalle público');
  const detail = injector.get(PiecePage);
  http
    .expectOne(`${environment.apiUrl}/piezas/7`)
    .flush('error', { status: 500, statusText: 'Error' });
  assert.equal(detail.estado(), 'error');
  detail.reintentar.next();
  http.expectOne(`${environment.apiUrl}/piezas/7`).flush(fixture(7));
  assert.equal(detail.pieza().id, 7);
  detail.fallo.set(true);
  params.next(convertToParamMap({ id: '8' }));
  assert.equal(detail.fallo(), false);
  http
    .expectOne(`${environment.apiUrl}/piezas/8`)
    .flush('no', { status: 404, statusText: 'Not Found' });
  assert.equal(detail.estado(), 'no-encontrada');
  params.next(convertToParamMap({ id: 'abc' }));
  assert.equal(detail.estado(), 'no-encontrada');
  const usuarios = injector.get(UsuariosPublicosService);
  let resultado;
  usuarios.seguir('ana', false).subscribe((value) => (resultado = value));
  const followRequest = http.expectOne(`${environment.apiUrl}/usuarios/ana/seguir`);
  assert.equal(followRequest.request.method, 'POST');
  followRequest.flush({ lo_sigo: true, seguidores: 4 });
  assert.deepEqual(resultado, { lo_sigo: true, seguidores: 4 });
  usuarios.seguir('ana', true).subscribe();
  const unfollowRequest = http.expectOne(`${environment.apiUrl}/usuarios/ana/seguir`);
  assert.equal(unfollowRequest.request.method, 'DELETE');
  unfollowRequest.flush({ lo_sigo: false, seguidores: 3 });
  http.verify();
  console.log('Catálogo público: filtros, cancelación, paginación, errores y detalle verificados.');
} finally {
  injector.destroy();
}

// Ejecuta los recursos y la página reales con el backend HTTP de pruebas.
const effects = {
  queue: new Set(),
  add(e) {
    this.queue.add(e);
  },
  schedule(e) {
    this.queue.add(e);
  },
  remove(e) {
    this.queue.delete(e);
  },
  flush() {
    while ([...this.queue].some((e) => e.dirty)) for (const e of this.queue) if (e.dirty) e.run();
  },
};
const profileParams = new BehaviorSubject(convertToParamMap({ usuario: 'ana' }));
const token = signal(null);
const user = signal(null);
const auth = { token, usuario: user, autenticado: () => user() !== null };
const navigations = [];
const notifications = [];
const profileInjector = createEnvironmentInjector([
  provideHttpClient(withNoXsrfProtection()),
  provideHttpClientTesting(),
  UsuariosPublicosService,
  PublicProfilePage,
  { provide: PendingTasks, useValue: { add: () => () => {} } },
  { provide: ɵEffectScheduler, useValue: effects },
  { provide: ɵChangeDetectionScheduler, useValue: { notify() {} } },
  {
    provide: ErrorHandler,
    useValue: {
      handleError(e) {
        throw e;
      },
    },
  },
  { provide: ActivatedRoute, useValue: { paramMap: profileParams } },
  {
    provide: Router,
    useValue: {
      url: '/coleccionistas/ana',
      navigate: (...args) => {
        navigations.push(args);
        return Promise.resolve(true);
      },
    },
  },
  { provide: AuthService, useValue: auth },
  { provide: ToastService, useValue: { show: (...args) => notifications.push(args) } },
]);
const profileHttp = profileInjector.get(HttpTestingController);
const profileFixture = (username, id = 1) => ({
  id,
  username,
  bio: '',
  seguidores: 3,
  siguiendo: 2,
  lo_sigo: false,
});
const getProfile = (name) => profileHttp.expectOne(`${environment.apiUrl}/usuarios/${name}`);
const getPieces = (name, offset = 0) =>
  profileHttp.expectOne(
    (r) =>
      r.url === `${environment.apiUrl}/usuarios/${name}/piezas` &&
      r.params.get('limite') === '20' &&
      r.params.get('desplazamiento') === String(offset),
  );
const settle = async () => {
  effects.flush();
  await Promise.resolve();
  await Promise.resolve();
};
try {
  const profile = profileInjector.get(PublicProfilePage);
  await settle();
  getProfile('ana').flush(profileFixture('ana'));
  getPieces('ana').flush(page([fixture(1)], 21));
  await settle();
  assert.equal(profile.perfil.value().username, 'ana');
  profile.alternar();
  assert.equal(navigations[0][1].queryParams.returnUrl, '/coleccionistas/ana');
  token.set('token');
  user.set({ id: 2, username: 'beto' });
  await settle();
  getProfile('ana').flush(profileFixture('ana'));
  getPieces('ana').flush(page([fixture(1)], 21));
  await settle();
  profile.alternar();
  profile.alternar();
  const follow = profileHttp.expectOne(`${environment.apiUrl}/usuarios/ana/seguir`);
  follow.flush({ lo_sigo: true, seguidores: 4 });
  assert.equal(profile.perfil.value().seguidores, 4);
  profile.alternar();
  profileHttp
    .expectOne(`${environment.apiUrl}/usuarios/ana/seguir`)
    .flush('error', { status: 500, statusText: 'Error' });
  assert.equal(profile.perfil.value().seguidores, 4);
  profile.desplazamiento.set(20);
  await settle();
  getPieces('ana', 20).flush(page([fixture(21)], 21, 20));
  await settle();
  assert.equal(profile.piezas.value().desplazamiento, 20);
  profile.alternar();
  const stale = profileHttp.expectOne(`${environment.apiUrl}/usuarios/ana/seguir`);
  profileParams.next(convertToParamMap({ usuario: 'carla' }));
  profileParams.next(convertToParamMap({ usuario: 'ana' }));
  stale.flush({ lo_sigo: false, seguidores: 99 });
  await settle();
  assert.equal(profile.perfil.value().seguidores, 4);
  profileParams.next(convertToParamMap({ usuario: 'carla' }));
  await settle();
  assert.equal(profile.desplazamiento(), 0);
  getProfile('carla').flush(profileFixture('carla', 3));
  getPieces('carla').flush(page([], 0));
  await settle();
  assert.equal(profile.perfil.value().username, 'carla');
  assert.equal(profile.perfil.value().seguidores, 3);
  profile.alternar();
  const oldSession = profileHttp.expectOne(`${environment.apiUrl}/usuarios/carla/seguir`);
  token.set('otro-token');
  user.set({ id: 4, username: 'dani' });
  oldSession.flush({ lo_sigo: true, seguidores: 99 });
  await settle();
  getProfile('carla').flush(profileFixture('carla', 3));
  getPieces('carla').flush(page([], 0));
  await settle();
  assert.equal(profile.perfil.value().seguidores, 3);
  profileParams.next(convertToParamMap({ usuario: 'desconocida' }));
  await settle();
  getProfile('desconocida').flush('no', { status: 404, statusText: 'Not Found' });
  getPieces('desconocida').flush('no', { status: 404, statusText: 'Not Found' });
  await settle();
  assert.equal(profile.noEncontrado(), true);
  profile.perfil.reload();
  profile.piezas.reload();
  await settle();
  getProfile('desconocida').flush(profileFixture('desconocida', 5));
  getPieces('desconocida').flush(page([], 0));
  await settle();
  assert.equal(profile.perfil.value().username, 'desconocida');
  profileHttp.verify();
  console.log('Perfil público: sesión, seguimiento, navegación y paginación verificados.');
} finally {
  profileInjector.destroy();
}
