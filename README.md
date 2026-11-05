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

### Frontend

Se necesita **Node.js 24 LTS** con npm. Desde la raíz del repositorio:

```bash
cd frontend
npm ci
npm start
```

Abrir **http://localhost:4200/** en el navegador. Para detener el servidor, usar `Ctrl+C` en la terminal.

Explorar, el detalle de piezas, los perfiles públicos, el ingreso y el registro consultan la API; requieren el backend y la base de datos en ejecución. El servidor de desarrollo redirige `/api` a `http://localhost:8000`. Desde el propietario de una pieza se abre su perfil en `/coleccionistas/:usuario`, con su colección y seguimientos persistentes. Los paneles de comunidad y las otras pantallas usan datos de demostración. Los me gusta, favoritos y la gestión de piezas reales todavía no están conectados.

## Funciones

- Explorar piezas reales, buscar, filtrar por categoría y cargar más resultados. El detalle consulta la API por ID.
- Consultar perfiles públicos y su colección paginada; seguir y dejar de seguir con la sesión real.
- Ver el Feed, perfiles y colecciones.
- Dar likes, seguir coleccionistas y guardar favoritos.
- Agregar, editar y eliminar piezas propias.
- Crear una cuenta, ingresar y cerrar sesión. La sesión se mantiene al recargar la página.

Feed, perfil propio y perfiles en `/perfil`, favoritos, formularios de piezas y sus interacciones sociales usan datos de muestra y sus cambios se pierden al recargar la página. Las piezas de muestra no se enlazan al detalle real. Esas pantallas usan un usuario de demostración fijo, `tomas_retro`, aunque se ingrese con otra cuenta. Los seguimientos reales se realizan desde `/coleccionistas/:usuario`; el Feed de demostración todavía no los refleja.

## Tecnologías

El frontend usa **Angular**, con Angular Material para iconos, botones y estados de carga del perfil público. Sus lecturas usan `httpResource`, con Signals y el interceptor de autenticación. El backend usa **FastAPI** con una API REST en JSON, **PostgreSQL** como base de datos, **SQLAlchemy** como ORM, **Alembic** para las migraciones y autenticación con **JWT**. Las contraseñas se guardan como hash con bcrypt.

## Comprobaciones

Desde la carpeta `frontend`:

```bash
npm test        # Comprueba los catálogos y el perfil público, sin backend
npm run build  # Genera la versión de producción en dist/frontend/browser
```

Los detalles técnicos del frontend están en [frontend/README.md](frontend/README.md).

Para comprobar perfiles y seguimientos contra PostgreSQL, ejecutar lo siguiente desde la raíz, con una API migrada conectada a una **base desechable de pruebas**. La comprobación crea cuentas y piezas; no usar la base personal ni una de producción.

```bash
TEST_API_URL=http://127.0.0.1:8000/api python3 backend/tests/test_perfiles_http.py
```
