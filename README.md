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

Explorar y el detalle de piezas consultan la API; requieren el backend y la base de datos en ejecución. El servidor de desarrollo redirige `/api` a `http://localhost:8000`. Los paneles de comunidad y las otras pantallas usan datos de demostración. Los controles sociales del detalle público están pendientes de conexión y la gestión de piezas requiere integrar sesión.

## Funciones

- Explorar piezas reales, buscar, filtrar por categoría y cargar más resultados. El detalle consulta la API por ID.
- Ver el Feed, perfiles y colecciones.
- Dar likes, seguir coleccionistas y guardar favoritos.
- Agregar, editar y eliminar piezas propias.
- Revisar los formularios de ingreso y registro.

Feed, perfiles, favoritos, formularios e interacciones sociales usan datos de muestra y sus cambios se pierden al recargar la página. Las piezas de muestra no se enlazan al detalle real. Los nombres de propietarios reales se muestran sin enlace hasta conectar los perfiles. Se utiliza un usuario de demostración fijo: `tomas_retro`. El ingreso y registro solo muestran el flujo y validan campos; todavía no crean cuentas ni autentican. El cierre de sesión también está pendiente.

## Tecnologías

El frontend usa **Angular**, con Angular Material para los iconos. El backend usa **FastAPI** con una API REST en JSON, **PostgreSQL** como base de datos, **SQLAlchemy** como ORM, **Alembic** para las migraciones y autenticación con **JWT**. Las contraseñas se guardan como hash con bcrypt. El catálogo público y el detalle ya consultan la API; el resto de los flujos del frontend aún no está conectado.

## Comprobaciones

Desde la carpeta `frontend`:

```bash
npm test        # Comprueba el catálogo de demostración y el catálogo público
npm run build  # Genera la versión de producción en dist/frontend/browser
```

Los detalles técnicos del frontend están en [frontend/README.md](frontend/README.md).
