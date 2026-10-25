import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { transpileModule, ModuleKind, ScriptTarget } from 'typescript';
import '@angular/compiler';
import { createEnvironmentInjector } from '@angular/core';

// Ejecuta los servicios con Node usando las dependencias existentes, sin instalar un runner.
const cache = new URL('../.angular/checks/', import.meta.url);
await mkdir(cache, { recursive: true });
for (const nombre of ['toast.service', 'catalogo.service']) {
  const source = await readFile(
    new URL(`../src/app/services/${nombre}.ts`, import.meta.url),
    'utf8',
  );
  const { outputText } = transpileModule(source, {
    compilerOptions: {
      module: ModuleKind.ESNext,
      target: ScriptTarget.ES2022,
      experimentalDecorators: true,
    },
  });
  await writeFile(
    new URL(`${nombre}.mjs`, cache),
    outputText.replace("'./toast.service'", "'./toast.service.mjs'"),
  );
}
const { CatalogoService } = await import(new URL('catalogo.service.mjs', cache));
const { ToastService } = await import(new URL('toast.service.mjs', cache));
const injector = createEnvironmentInjector([
  CatalogoService,
  { provide: ToastService, useValue: { show() {} } },
]);
const catalogo = injector.get(CatalogoService);

try {
  assert(catalogo.feed().every((p) => catalogo.siguiendo().has(p.duenoId)));
  const diego = catalogo.usuarios.find((u) => u.usuario === 'diego_8bit');
  assert(!catalogo.feed().some((p) => p.duenoId === diego.id));
  catalogo.toggleSeguir(diego.id);
  assert(
    catalogo.feed().some((p) => p.duenoId === diego.id),
    'Seguir debe actualizar el Feed',
  );
  catalogo.toggleSeguir(diego.id);
  assert(
    !catalogo.feed().some((p) => p.duenoId === diego.id),
    'Dejar de seguir debe actualizar el Feed',
  );
  catalogo.toggleSeguir(catalogo.yo.id);
  assert(!catalogo.siguiendo().has(catalogo.yo.id), 'No puedes seguirte a ti mismo');
  catalogo.siguiendo.set(new Set());
  assert.equal(catalogo.feed().length, 0);
  assert.equal(catalogo.seguidos().length, 0);

  const nueva = catalogo.agregar({
    nombre: 'Pieza de prueba',
    descripcion: 'Prueba del catálogo',
    categoria: 'cartas',
    imagen_url: '/fotos/carta-beisbol.jpg',
  });
  assert.equal(catalogo.recientes()[0].id, nueva.id);
  catalogo.toggleGuardar(nueva.id);
  catalogo.toggleMeGusta(nueva.id);
  assert(catalogo.favoritas().some((p) => p.id === nueva.id));
  assert.equal(catalogo.megusta(catalogo.pieza(nueva.id)), 1);
  catalogo.actualizar(nueva.id, { ...nueva, nombre: 'Pieza editada' });
  assert.equal(catalogo.pieza(nueva.id).nombre, 'Pieza editada');

  const ajena = catalogo.piezas().find((p) => p.duenoId !== catalogo.yo.id);
  catalogo.actualizar(ajena.id, { ...ajena, nombre: 'Cambio no permitido' });
  catalogo.eliminar(ajena.id);
  assert.equal(
    catalogo.pieza(ajena.id).nombre,
    ajena.nombre,
    'Las piezas ajenas deben conservarse',
  );
  catalogo.eliminar(nueva.id);
  assert.equal(catalogo.pieza(nueva.id), undefined);
  assert(!catalogo.guardadas().has(nueva.id));
  assert(!catalogo.gustadas().has(nueva.id));
  assert(!catalogo.favoritas().some((p) => p.id === nueva.id));
  catalogo.piezas.set([]);
  assert.equal(catalogo.agregar(nueva).id, 1, 'Agregar debe funcionar con el catálogo vacío');
  console.log('Catálogo: Feed, seguimiento, favoritos, edición y eliminación verificados.');
} finally {
  injector.destroy();
}
