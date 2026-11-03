import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { transpileModule, ModuleKind, ScriptTarget } from 'typescript';
import '@angular/compiler';
import { createEnvironmentInjector, PendingTasks } from '@angular/core';
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
const { ExplorePage } = await import(new URL('pages/explore.mjs', dest));
const { PiecePage } = await import(new URL('pages/piece.mjs', dest));
const { CatalogoPublicoService } = await import(
  new URL('services/catalogo-publico.service.mjs', dest)
);
const { ToastService } = await import(new URL('services/toast.service.mjs', dest));
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
      r.url === '/api/piezas' &&
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
  const detail = injector.get(PiecePage);
  http.expectOne('/api/piezas/7').flush('error', { status: 500, statusText: 'Error' });
  assert.equal(detail.estado(), 'error');
  detail.reintentar.next();
  http.expectOne('/api/piezas/7').flush(fixture(7));
  assert.equal(detail.pieza().id, 7);
  detail.fallo.set(true);
  params.next(convertToParamMap({ id: '8' }));
  assert.equal(detail.fallo(), false);
  http.expectOne('/api/piezas/8').flush('no', { status: 404, statusText: 'Not Found' });
  assert.equal(detail.estado(), 'no-encontrada');
  params.next(convertToParamMap({ id: 'abc' }));
  assert.equal(detail.estado(), 'no-encontrada');
  http.verify();
  console.log('Catálogo público: filtros, cancelación, paginación, errores y detalle verificados.');
} finally {
  injector.destroy();
}
