# Vitrina · Talleres 2 y 3 Web Móvil

Aplicación web y Android (Capacitor) para organizar y mostrar colecciones (cartas, videojuegos, juguetes y discos), descubrir piezas de otros usuarios y seguirlos.

| Parte | Tecnología |
| --- | --- |
| Frontend | Angular + Angular Material |
| App móvil | Capacitor 8 (Android) con ML Kit, Geolocation y Motion |
| Backend | FastAPI (API REST con JSON) |
| Base de datos | PostgreSQL con SQLAlchemy y Alembic |
| Autenticación | JWT, contraseñas con hash bcrypt |

**Web:** https://taller02-wb-202602-production.up.railway.app · **APK Android:** pestaña [Releases](../../releases/latest) del repositorio.

## Integrantes

- Gael Ortega
- Martín Droguett
- Catalina Galleguillos

## Requisitos

- Docker Desktop (abierto)
- Node.js 24 con npm
- Para la app Android: JDK 21 y Android Studio (Android SDK 36)

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

Crea 18 usuarios con más de 80 piezas, seguidores, me gusta, guardados y comentarios con respuestas. Cerca del 80 % de las piezas tienen ubicación (Santiago, Valparaíso, Concepción y La Serena) para probar «Cerca de mí», y cinco tienen código de barras para probar el escáner (`7801610001234` está en dos colecciones de vinilos; también `5099902988818`, `4902370536485` y `0045496590086`). Se puede repetir: vuelve a crear los datos de prueba desde cero. Se ingresa con `camila@vitrina.app` (o `diego@`, `sofia@`, `mateo@`, etc.) y la clave `demo12345`.

Para cargar los mismos datos en una base remota (por ejemplo la de Railway), con las dependencias del backend instaladas:

```bash
cd backend
python3 cargar_demo.py "postgresql://usuario:clave@host:puerto/base"
```

La dirección es la URL pública de la base (en Railway: servicio de PostgreSQL › Variables › `DATABASE_PUBLIC_URL`). Solo reemplaza a los usuarios de demo; las cuentas reales no se tocan.

### 3. Frontend

En otra terminal:

```bash
cd frontend
npm ci
npm start
```

Abrir http://localhost:4200.

## App Android (Taller 3)

La misma aplicación Angular se empaqueta como app Android con [Capacitor](https://capacitorjs.com). La configuración está en `frontend/capacitor.config.ts` (id `cl.vitrina.app`, nombre **Vitrina**) y el proyecto nativo en `frontend/android/`.

### Funciones del celular

| Capacidad | Plugin | Dónde se usa |
| --- | --- | --- |
| Cámara + QR / código de barras | `@capacitor-mlkit/barcode-scanning` | **Explorar › Escanear** (solo en la app, porque el navegador no tiene lector): un QR de Vitrina abre la pieza o el perfil; un código de barras (EAN/UPC) muestra quién tiene ese producto, o permite agregarlo con el código ya puesto. **Agregar pieza › Escanear** guarda el código en la pieza. Cada pieza tiene **Mostrar QR** para compartirla. |
| Ubicación (GPS) | `@capacitor/geolocation` | **Agregar pieza › Usar mi ubicación actual** guarda dónde se consiguió. **Explorar › Cerca de mí** lista las piezas conseguidas cerca, de la más cercana a la más lejana, con la distancia en cada tarjeta y un radio a elegir (2, 10, 50 o 200 km). Si el GPS tarda (por ejemplo bajo techo) usa la ubicación aproximada de la red. |
| Acelerómetro | `@capacitor/motion` | En **Explorar**, sacudir el celular (basta un movimiento suave de muñeca) saca una pieza sorpresa en una hoja «Te tocó…»: se puede abrir o volver a sacudir para otra. No tiene botón: la app avisa una vez por sesión que hay que agitar. La sensibilidad se ajusta en `frontend/src/app/services/sacudida.ts`. |

Los datos se guardan con la API del Taller 2: las piezas tienen `codigo`, `latitud` y `longitud` (migración `0007`), y `GET /api/piezas` acepta `codigo`, `orden=cercanas&lat&lng&radio_km`. `GET /api/piezas/aleatoria` entrega la pieza al azar.

Los permisos se piden al usar cada función (`frontend/src/app/services/dispositivo.service.ts`). Si se rechazan, o si el sensor o el GPS no están disponibles, la app avisa qué pasó y cómo activarlo.

### Conexión con el backend

Dentro de la app, Angular corre en `https://localhost`, así que la ruta relativa `/api` no llega al servidor. Por eso `src/environments/environment.ts` usa la dirección completa de Railway cuando corre en Android. El backend debe aceptar ese origen en CORS:

```
CORS_ORIGENES=["http://localhost:4200","https://localhost","capacitor://localhost"]
```

En Railway hay que agregar estos orígenes a la variable `CORS_ORIGENES` del servicio de la API.

### Instalar el APK

El APK de la última versión está en la pestaña [Releases](../../releases/latest) del repositorio (archivo `vitrina.apk`). Se descarga desde el celular, se abre y se permite instalar apps de origen desconocido. Esa app usa la API desplegada en Railway.

### Construir y ejecutar

```bash
cd frontend
npm ci
npm run build:movil      # build de producción de Angular + npx cap sync android
npm run android:abrir    # abre Android Studio; ahí ▶ Run sobre el celular conectado por USB
```

Para generar el APK desde la terminal (con el Android SDK instalado):

```bash
cd frontend
npm run android:apk
# APK: frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

Para probar en el celular con el backend de tu computador (Docker en marcha, celular por USB), sin depender de Railway:

```bash
# En .env agregar "http://localhost" a CORS_ORIGENES y reiniciar: docker compose up -d api
cd frontend
npm run android:local    # build "local" + adb reverse del puerto 8000 + instala el APK debug
```

Esto deja el proyecto Android apuntando al backend local; para volver a producción se corre `npm run build:movil`. El APK de GitHub Actions y el build de producción no cambian.

También se puede instalar con `adb install -r app-debug.apk`.

El ícono y la pantalla de inicio salen de `frontend/resources/`. Para regenerarlos: `npm run assets:movil`.

### CI/CD con GitHub Actions

`.github/workflows/android.yml` corre con cada push a `main`: instala dependencias, hace el build de producción de Angular, sincroniza con Capacitor, compila con Gradle y publica `app-debug.apk` como artefacto **vitrina-debug-apk**. Para descargarlo, abre la pestaña **Actions** del repositorio, entra a la última ejecución y busca la sección *Artifacts*.

## Qué incluye

- Registro, inicio y cierre de sesión con JWT.
- CRUD de piezas: crear, listar, ver, editar y eliminar (solo el dueño puede modificar).
- Explorar con búsqueda y filtro por categoría, Feed, Favoritos y perfiles.
- Me gusta, guardados, comentarios y seguir usuarios.
- Diseño adaptable a computador y celular.
- App Android con escáner de QR y códigos de barras, ubicación y acelerómetro (Taller 3).

## Estructura

```
backend/    API FastAPI (routers, models, schemas, database, migrations)
frontend/   Aplicación Angular (pages, components, services, guards, interceptors)
frontend/android/   Proyecto Android generado por Capacitor
.github/workflows/  Construcción automática del APK
docs/       Contrato de la API
```

## Pruebas del backend

Con la API en marcha y una base de datos de prueba (las pruebas crean usuarios y piezas):

```bash
TEST_API_URL=http://127.0.0.1:8000/api python3 backend/tests/test_piezas_http.py
TEST_API_URL=http://127.0.0.1:8000/api python3 backend/tests/test_comentarios_http.py
TEST_API_URL=http://127.0.0.1:8000/api python3 backend/tests/test_movil_http.py
```

## Detener

`Ctrl+C` en cada terminal. Para borrar también los datos: `docker compose down -v`.
