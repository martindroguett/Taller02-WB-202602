# Vitrina · Taller 2 Web / Móvil

Plataforma para organizar y mostrar coleccionables, descubrir piezas de otros usuarios y conectarse con personas con intereses similares. Las categorías iniciales son cartas, videojuegos, juguetes y discos/vinilos, con una interfaz adaptable a computador y celular.

## Cómo ejecutar

### Backend y base de datos

Se necesita **Docker Desktop** abierto. Desde la raíz del repositorio, la primera vez se crea el archivo de variables a partir del ejemplo:

```bash
cp .env.example .env
```

Luego se cambia `JWT_SECRET` en `.env` por un texto largo y aleatorio. Se puede generar con `python -c "import secrets; print(secrets.token_urlsafe(48))"`. El archivo `.env` no se sube al repositorio.

```bash
docker compose up --build
```

Esto levanta PostgreSQL y la API, aplica las migraciones de Alembic y deja la API en **http://localhost:8000**. La documentación interactiva de los endpoints está en **http://localhost:8000/docs**. Los cambios en `backend/` se recargan solos. Para detener todo, usar `Ctrl+C`, y para borrar también los datos, `docker compose down -v`.

Después de cambiar un modelo, se genera y aplica una migración nueva:

```bash
docker compose exec api alembic revision --autogenerate -m "describe el cambio"
docker compose exec api alembic upgrade head
```

### Datos de prueba

Con la API en marcha, se cargan 5 usuarios (`camila`, `diego`, `sofia`, `mateo` y `valentina`) con piezas, seguimientos, me gusta y comentarios. Se puede repetir sin duplicar datos:

```bash
docker compose exec api python seed.py
```

Se ingresa con `camila@vitrina.app` y la clave `demo12345` (también `diego@…`, `sofia@…`, etc.). Es solo para desarrollo.

### Frontend

Se necesita **Node.js 24 LTS** con npm. Desde la raíz del repositorio:

```bash
cd frontend
npm ci
npm start
```

Abrir **http://localhost:4200/** en el navegador. Para probar desde el celular, conectado a la misma red Wi-Fi, abrir `http://<IP-del-computador>:4200` (en Mac, la IP sale con `ipconfig getifaddr en0`). El servidor ya escucha en toda la red y redirige `/api` al backend, así que no hay nada más que configurar. Para detener el servidor, usar `Ctrl+C` en la terminal.

Explorar, el detalle de piezas, los perfiles públicos, el ingreso y el registro consultan la API; requieren el backend y la base de datos en ejecución. El servidor de desarrollo redirige `/api` a `http://localhost:8000`. Desde el propietario de una pieza se abre su perfil en `/coleccionistas/:usuario`, con su colección y seguimientos persistentes. Feed, favoritos, me gusta y guardados de piezas reales también usan la API. El perfil propio en `/perfil` muestra la cuenta y la colección real.

## Funciones

- Explorar piezas reales, buscar, filtrar por categoría y cargar más resultados. El detalle consulta la API por ID.
- Consultar perfiles públicos y su colección paginada; seguir y dejar de seguir con la sesión real.
- Ver el perfil propio con los datos de la cuenta, sus contadores y su colección paginada.
- Ver el Feed, perfiles y colecciones.
- Dar likes, seguir coleccionistas y guardar favoritos.
- Agregar, editar y eliminar piezas propias.
- Comentar las piezas desde una hoja inferior en el detalle, responder (un solo nivel) y dar me gusta a los comentarios; el autor y el dueño de la pieza pueden eliminarlos.
- Crear una cuenta, ingresar y cerrar sesión. La sesión se mantiene al recargar la página.

El perfil propio en `/perfil` usa datos reales de la API. Los perfiles de otros coleccionistas y los seguimientos están en `/coleccionistas/:usuario`; las direcciones antiguas `/perfil/:usuario` redirigen ahí. El Feed y Favoritos muestran datos reales y las interacciones persisten en la API.

## Tecnologías

El frontend usa **Angular**, con Angular Material para iconos, campos de formulario, selector de secciones, barra superior, avisos, la confirmación de eliminar, la hoja de comentarios y el botón y la carga del perfil público (con la paleta de Vitrina en `styles.css`). Sus lecturas usan `httpResource`, con Signals y el interceptor de autenticación. El backend usa **FastAPI** con una API REST en JSON, **PostgreSQL** como base de datos, **SQLAlchemy** como ORM, **Alembic** para las migraciones y autenticación con **JWT**. Las contraseñas se guardan como hash con bcrypt.

## Comprobaciones

Desde la carpeta `frontend`:

```bash
npm run build  # Genera la versión de producción en dist/frontend/browser
```

Los detalles técnicos del frontend están en [frontend/README.md](frontend/README.md).

Para comprobar el CRUD, la autenticación, los permisos y los comentarios contra PostgreSQL, ejecutar lo siguiente desde la raíz, con una API migrada conectada a una **base desechable de pruebas**. Las pruebas crean cuentas y piezas; no usar la base personal.

```bash
TEST_API_URL=http://127.0.0.1:8000/api python3 backend/tests/test_piezas_http.py
TEST_API_URL=http://127.0.0.1:8000/api python3 backend/tests/test_comentarios_http.py
```
