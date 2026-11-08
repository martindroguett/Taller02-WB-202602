# Vitrina · Frontend

Aplicación Angular con Angular Material. Consume la API de FastAPI (ver el [README principal](../README.md) para levantar el backend).

## Ejecutar

```bash
npm ci
npm start    # http://localhost:4200
npm run build
```

El servidor de desarrollo redirige `/api` a `http://localhost:8000`.

## Organización (`src/app/`)

- `pages/`: las vistas (Explorar, Feed, Favoritos, Perfil, Perfil público, Pieza, Formulario de pieza, Ingreso/Registro).
- `components/`: elementos reutilizables (botones, campos, tarjetas, diálogos).
- `services/`: todo el acceso a la API.
  - `auth.service.ts`: sesión y JWT (se guarda en `localStorage`).
  - `catalogo-publico.service.ts`: listado, detalle y crear/editar/eliminar piezas.
  - `usuarios-publicos.service.ts`: perfiles y seguir.
  - `interacciones.service.ts`: me gusta, guardados, Feed y Favoritos.
  - `comentarios.service.ts`: comentarios.
- `guards/`: `authGuard` protege las rutas privadas e `invitadoGuard` evita volver al ingreso con sesión.
- `interceptors/`: `authInterceptor` agrega el JWT a cada petición a la API y cierra la sesión si responde 401.
- `models/`: tipos de datos.

## Herramientas de Angular usadas

- **Signals** para el estado (sesión, filtros, interfaz).
- **httpResource** para cargar listados y detalles; se recargan solos cuando cambian sus parámetros.
- **Reactive Forms** con validaciones en el ingreso, el registro, las piezas y los comentarios.
- **Angular Material**: toolbar, formularios, diálogos, snackbar, chips y spinner.
