# Vitrina · Taller 2 Web Móvil

Aplicación web para organizar y mostrar colecciones (cartas, videojuegos, juguetes y discos), descubrir piezas de otros usuarios y seguirlos.

| Parte | Tecnología |
| --- | --- |
| Frontend | Angular + Angular Material |
| Backend | FastAPI (API REST con JSON) |
| Base de datos | PostgreSQL con SQLAlchemy y Alembic |
| Autenticación | JWT, contraseñas con hash bcrypt |

## Requisitos

- Docker Desktop (abierto)
- Node.js 24 con npm

## Cómo ejecutar

### 1. Backend y base de datos

Desde la raíz del repositorio:

```bash
cp .env.example .env
```

Abrir `.env` y cambiar `JWT_SECRET` por un texto largo y aleatorio. Se puede generar con:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

Luego:

```bash
docker compose up --build
```

Esto levanta PostgreSQL, aplica las migraciones y deja la API en http://localhost:8000. La documentación de los endpoints está en http://localhost:8000/docs.

### 2. Datos de prueba (opcional)

Las fotos vienen de Wikimedia Commons y Flickr con licencia libre (dominio público, CC0 o CC BY) y no se suben al repositorio; los autores están en `backend/fotos_demo.json`. Con la API en marcha, desde la raíz:

```bash
python3 backend/descargar_fotos_demo.py
docker compose exec api python seed.py
```

Crea 18 usuarios con más de 80 piezas, seguidores, me gusta, guardados y comentarios con respuestas. Se puede repetir: vuelve a crear los datos de prueba desde cero. Se ingresa con `camila@vitrina.app` (o `diego@`, `sofia@`, `mateo@`, etc.) y la clave `demo12345`.

### 3. Frontend

En otra terminal:

```bash
cd frontend
npm ci
npm start
```

Abrir http://localhost:4200.

## Qué incluye

- Registro, inicio y cierre de sesión con JWT.
- CRUD de piezas: crear, listar, ver, editar y eliminar (solo el dueño puede modificar).
- Explorar con búsqueda y filtro por categoría, Feed, Favoritos y perfiles.
- Me gusta, guardados, comentarios y seguir usuarios.
- Diseño adaptable a computador y celular.

## Estructura

```
backend/    API FastAPI (routers, models, schemas, database, migrations)
frontend/   Aplicación Angular (pages, components, services, guards, interceptors)
docs/       Contrato de la API
```

## Pruebas del backend

Con la API en marcha y una base de datos de prueba (las pruebas crean usuarios y piezas):

```bash
TEST_API_URL=http://127.0.0.1:8000/api python3 backend/tests/test_piezas_http.py
TEST_API_URL=http://127.0.0.1:8000/api python3 backend/tests/test_comentarios_http.py
```

## Detener

`Ctrl+C` en cada terminal. Para borrar también los datos: `docker compose down -v`.
