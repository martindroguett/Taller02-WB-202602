# Contrato de la API: Vitrina

Este documento es el acuerdo entre el frontend (Angular) y el backend (FastAPI): qué rutas existen, qué reciben y qué responden. Si un cambio en el código modifica algo de aquí, se actualiza este archivo en el mismo Pull Request.

Los nombres de los campos siguen el modelo del frontend (`frontend/src/app/models/vitrina.ts`). La documentación interactiva que genera FastAPI está en http://localhost:8000/docs y muestra solo lo que ya está programado.

## Estado

| Parte | Estado |
| --- | --- |
| Autenticación: registro, login y usuario actual | Listo |
| Usuarios: perfil, editar perfil, seguir y dejar de seguir | Pendiente (la tabla `seguimientos` ya existe) |
| Categorías | Pendiente |
| Piezas: CRUD, Explorar e imágenes | Pendiente |
| Me gusta, guardados (favoritos) y feed | Pendiente |

## Convenciones

- **URL base:** `http://localhost:8000/api` en desarrollo.
- **Formato:** JSON en ambos sentidos, con los campos en `snake_case` y en español. Las fechas van en ISO 8601 con zona horaria, por ejemplo `2026-10-26T15:30:00Z`.
- **Autenticación:** el registro y el login entregan un JWT. Las rutas protegidas lo reciben en el encabezado `Authorization: Bearer <token>`, que agrega el Interceptor de Angular. El token dura 24 horas. Cerrar sesión no tiene endpoint: Angular borra el token.
- **Paginación:** los listados reciben `limite` (1 a 50, por defecto 20) y `desplazamiento` (desde 0), y responden con este sobre:

  ```json
  { "items": [], "total": 134, "limite": 20, "desplazamiento": 0 }
  ```

- **Errores:** se usa el formato de FastAPI, `{"detail": "mensaje"}`. En el `422` de validación, `detail` es una lista con el campo y el problema.

| Código | Cuándo |
| --- | --- |
| `400` | La solicitud no tiene sentido: seguirse a uno mismo, una categoría que no existe, una imagen inválida. |
| `401` | Falta el token, está vencido o el email y la contraseña no coinciden. |
| `403` | El token es válido, pero la pieza es de otro usuario. |
| `404` | La pieza o el usuario no existe. |
| `409` | El username o el email ya están registrados. |
| `422` | Un campo no cumple las reglas de validación. |

**Columna «Acceso» en las tablas de rutas:**

| Acceso | Significa |
| --- | --- |
| Pública | Funciona sin token. |
| Token | Sin token responde `401`. |
| Dueño | Pide token y que la pieza sea del usuario; si no, `403`. |
| Opcional | Funciona sin token. Con token, la respuesta trae los campos personales (`gustada`, `guardada`, `lo_sigo`) con su valor real; sin token vienen en `false`. |

## Datos

### Usuario

Lo que muestra un perfil. Coincide con la interfaz `Usuario` del frontend, más `lo_sigo`.

```json
{
  "id": 1,
  "username": "tomas_retro",
  "bio": "Cartuchos, vinilos de primera prensa y mucho polvo. Santiago.",
  "seguidores": 1284,
  "siguiendo": 48,
  "lo_sigo": false
}
```

- `bio` siempre es texto: `""` si el usuario no escribió nada.
- `seguidores` y `siguiendo` se calculan al consultar; no se envían al crear ni al editar.

### UsuarioPrivado

Lo que recibe el propio usuario al registrarse, ingresar o pedir `/auth/yo`. Agrega su email y los campos opcionales del perfil (el frontend todavía no usa `nombre_visible` ni `avatar_url`).

```json
{
  "id": 1,
  "username": "tomas_retro",
  "email": "tomas@ejemplo.com",
  "nombre_visible": null,
  "bio": "",
  "avatar_url": null,
  "seguidores": 0,
  "siguiendo": 0,
  "creado_en": "2026-10-26T13:48:00Z"
}
```

### Pieza

Coincide con la interfaz `Pieza` del frontend, con estos cambios:

| En el mockup | En la API | Por qué |
| --- | --- | --- |
| `duenoId` | `dueno: {id, username}` | La tarjeta necesita el nombre del dueño sin pedir otro dato. |
| `hace` (minutos) | `creado_en` | Los minutos cambian con el tiempo; Angular los calcula desde la fecha. |
| `numero` | No se envía | El frontend muestra el `id` (CRT · #0003). |
| `destacada` | No se envía | Los destacados de Explorar son las piezas con más me gusta (ver `GET /piezas`). |

```json
{
  "id": 3,
  "nombre": "Game Boy DMG-01 con Tetris",
  "descripcion": "Pantalla con marcas de uso, funciona perfecto. Incluye el cartucho de Tetris.",
  "categoria": "videojuegos",
  "imagen_url": "http://localhost:8000/api/piezas/3/imagen",
  "dueno": { "id": 5, "username": "diego_8bit" },
  "megusta": 942,
  "guardados": 301,
  "gustada": true,
  "guardada": false,
  "creado_en": "2026-10-26T13:03:00Z",
  "actualizado_en": "2026-10-26T13:03:00Z"
}
```

- `megusta` y `guardados` son los totales de todos los usuarios. `gustada` y `guardada` dicen si el usuario del token le dio me gusta o la guardó.
- `categoria` es el slug: `cartas`, `videojuegos`, `juguetes` o `vinilos`. El nombre, el ícono y el código (CRT, VJG…) los pone el frontend con `CATEGORIAS`.

### DatosPieza

El cuerpo para crear y para editar. Es la misma interfaz `DatosPieza` del frontend.

```json
{
  "nombre": "Game Boy DMG-01 con Tetris",
  "descripcion": "Pantalla con marcas de uso, funciona perfecto.",
  "categoria": "videojuegos",
  "imagen_url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
}
```

### Imágenes

El formulario lee la foto con `FileReader.readAsDataURL`, así que `imagen_url` llega como texto `data:image/...;base64,...`.

1. El backend acepta JPEG, PNG o WebP de hasta **2 MB**. Si el tipo no corresponde o pesa más, responde `400`.
2. Guarda la imagen en PostgreSQL, no en el disco del servidor, porque el disco del plan gratuito de Render se borra al reiniciar.
3. Las respuestas no traen la imagen completa: `imagen_url` es una dirección corta, `GET /api/piezas/{id}/imagen`, que el `<img>` del frontend usa directamente y el navegador guarda en caché.
4. Al editar sin cambiar la foto, el frontend envía el mismo `imagen_url` que recibió y la imagen se mantiene.

`imagen_url` también acepta una dirección `http://` o `https://`, o una ruta que empiece con `/` (como `/fotos/robot.jpg`, que usan los datos de ejemplo). En esos casos se guarda la dirección tal cual.

## Rutas

### Autenticación

Router `routers/auth.py`, prefijo `/api/auth`.

| Método y ruta | Acceso | Envía | Responde | Errores | Estado |
| --- | --- | --- | --- | --- | --- |
| `POST /auth/registro` | Pública | `{username, email, password}` | `201` + `{access_token, token_type, usuario: UsuarioPrivado}` | `409`, `422` | Listo |
| `POST /auth/login` | Pública | `{email, password}` | `200` + `{access_token, token_type, usuario: UsuarioPrivado}` | `401` | Listo |
| `GET /auth/yo` | Token | — | `200` + `UsuarioPrivado` | `401` | Listo |

- El registro entrega el token de inmediato: la persona queda con la sesión iniciada.
- El login responde el mismo `401` si el email no existe o si la contraseña es incorrecta, para no revelar qué emails tienen cuenta.
- Angular llama a `/auth/yo` al abrir la app, para recuperar la sesión desde el token guardado.

### Usuarios y seguimientos

Router `routers/usuarios.py`, prefijo `/api/usuarios`.

| Método y ruta | Acceso | Envía | Responde | Errores | Estado |
| --- | --- | --- | --- | --- | --- |
| `GET /usuarios/{username}` | Opcional | — | `200` + `Usuario` | `404` | Pendiente |
| `PATCH /usuarios/yo` | Token | `{bio?, nombre_visible?, avatar_url?}` | `200` + `UsuarioPrivado` | `401`, `422` | Pendiente |
| `GET /usuarios/{username}/piezas` | Opcional | `?limite&desplazamiento` | `200` + página de `Pieza` | `404` | Pendiente |
| `POST /usuarios/{username}/seguir` | Token | — | `200` + `{lo_sigo: true, seguidores}` | `400` si es uno mismo, `401`, `404` | Pendiente |
| `DELETE /usuarios/{username}/seguir` | Token | — | `200` + `{lo_sigo: false, seguidores}` | `401`, `404` | Pendiente |

- `GET /usuarios/{username}/piezas` sirve para el perfil propio (Mi colección) y para el de otros. En el propio, Angular muestra los botones de editar y eliminar.
- Seguir dos veces, o dejar de seguir a quien no sigues, no es error: responde el estado actual.
- Seguir responde el total actualizado de seguidores, para que el botón y el contador cambien sin otra consulta.

### Categorías

Router `routers/categorias.py`.

| Método y ruta | Acceso | Envía | Responde | Errores | Estado |
| --- | --- | --- | --- | --- | --- |
| `GET /categorias` | Pública | — | `200` + `[{id, slug, nombre}]` | — | Pendiente |

Las cuatro categorías (`cartas`, `videojuegos`, `juguetes`, `vinilos`) se cargan en una migración. No hay rutas para crearlas ni borrarlas.

### Piezas

Router `routers/piezas.py`, prefijo `/api/piezas`.

| Método y ruta | Acceso | Envía | Responde | Errores | Estado |
| --- | --- | --- | --- | --- | --- |
| `GET /piezas` | Opcional | `?q&categoria&orden&limite&desplazamiento` | `200` + página de `Pieza` | `422` | Pendiente |
| `GET /piezas/{id}` | Opcional | — | `200` + `Pieza` | `404` | Pendiente |
| `GET /piezas/{id}/imagen` | Pública | — | `200` + la imagen (`image/jpeg`, `image/png` o `image/webp`) | `404` | Pendiente |
| `POST /piezas` | Token | `DatosPieza` | `201` + `Pieza` | `400`, `401`, `422` | Pendiente |
| `PUT /piezas/{id}` | Dueño | `DatosPieza` | `200` + `Pieza` | `400`, `401`, `403`, `404`, `422` | Pendiente |
| `DELETE /piezas/{id}` | Dueño | — | `204` | `401`, `403`, `404` | Pendiente |

**Filtros de `GET /piezas` (Explorar):**

| Parámetro | Valores | Por defecto |
| --- | --- | --- |
| `q` | Texto que se busca en el nombre y la descripción, sin distinguir mayúsculas | Sin filtro |
| `categoria` | Un slug: `cartas`, `videojuegos`, `juguetes` o `vinilos`. Para «Todas», no se envía | Todas |
| `orden` | `recientes` (por fecha) o `populares` (por me gusta) | `recientes` |
| `limite`, `desplazamiento` | Ver paginación | `20`, `0` |

- Los destacados de Explorar son `GET /piezas?orden=populares&limite=8`; no hay una ruta aparte.
- En Angular, el `httpResource` de Explorar arma la URL con los signals de búsqueda, categoría y orden, y se recarga solo cuando cambia uno.
- Editar usa `PUT` con el formulario completo. El backend vuelve a comprobar que el usuario sea el dueño, aunque Angular ya oculte el botón.
- Al eliminar una pieza se borran también sus me gusta y guardados.

### Me gusta, guardados y feed

| Método y ruta | Acceso | Envía | Responde | Errores | Estado |
| --- | --- | --- | --- | --- | --- |
| `POST /piezas/{id}/megusta` | Token | — | `200` + `{gustada: true, megusta}` | `401`, `404` | Pendiente |
| `DELETE /piezas/{id}/megusta` | Token | — | `200` + `{gustada: false, megusta}` | `401`, `404` | Pendiente |
| `POST /piezas/{id}/guardar` | Token | — | `200` + `{guardada: true, guardados}` | `401`, `404` | Pendiente |
| `DELETE /piezas/{id}/guardar` | Token | — | `200` + `{guardada: false, guardados}` | `401`, `404` | Pendiente |
| `GET /favoritos` | Token | `?limite&desplazamiento` | `200` + página de `Pieza` | `401` | Pendiente |
| `GET /feed` | Token | `?limite&desplazamiento` | `200` + página de `Pieza` | `401` | Pendiente |

- Igual que seguir: repetir la acción no es error, y la respuesta trae el total actualizado para el contador.
- Se puede dar me gusta y guardar las piezas propias.
- `GET /favoritos` ordena por la fecha en que se guardó cada pieza, la más reciente primero.
- `GET /feed` trae las piezas de las personas que sigue el usuario, de la más nueva a la más antigua. Si no sigue a nadie, `items` viene vacío y Angular muestra el estado vacío.

## Reglas de validación

La regla del backend es la que manda; la del formulario de Angular evita enviar datos que la API va a rechazar.

| Campo | Regla |
| --- | --- |
| `username` | 3 a 30 caracteres: letras, números, `_` y `.` (igual que `/^[\w.]{3,30}$/` en Angular). Se guarda en minúsculas. |
| `email` | Formato de email. Se guarda en minúsculas. |
| `password` | 8 a 72 caracteres y **como máximo 72 bytes**: bcrypt no acepta más, y una letra con tilde ocupa 2 bytes. En Angular: `new TextEncoder().encode(clave).length <= 72`. |
| `nombre` (pieza) | 1 a 100 caracteres, sin contar los espacios de los extremos (igual que el formulario). |
| `descripcion` | 1 a 2.000 caracteres, sin contar los espacios de los extremos. Al formulario le falta el máximo de 2.000. |
| `categoria` | Uno de los cuatro slugs. Obligatoria. |
| `imagen_url` | Obligatoria. Imagen `data:` JPEG, PNG o WebP de hasta 2 MB, o una dirección `http(s)://` o que empiece con `/`. |
| `bio` | Hasta 300 caracteres. |
| `nombre_visible` | Hasta 60 caracteres. |
| `avatar_url` | Dirección `http(s)://`, hasta 500 caracteres. |

## Modelo de datos

Seis tablas en PostgreSQL, creadas con migraciones de Alembic (`backend/migrations/versions/`).

| Tabla | Columnas principales | Estado |
| --- | --- | --- |
| `usuarios` | `id`, `username` y `email` (únicos), `password_hash`, `nombre_visible`, `bio`, `avatar_url`, `creado_en` | Lista (migración `0001`) |
| `seguimientos` | `seguidor_id` y `seguido_id` (juntos forman la clave primaria), `creado_en`. `CHECK` para no seguirse a uno mismo | Lista (migración `0002`) |
| `categorias` | `id`, `slug` y `nombre` (únicos) | Pendiente |
| `piezas` | `id`, `usuario_id`, `categoria_id`, `nombre`, `descripcion`, `imagen_url` o la imagen guardada (`imagen_datos`, `imagen_tipo`), `creado_en`, `actualizado_en` | Pendiente |
| `megusta` | `usuario_id` y `pieza_id` (juntos forman la clave primaria), `creado_en` | Pendiente |
| `guardados` | `usuario_id` y `pieza_id` (juntos forman la clave primaria), `creado_en` | Pendiente |

- Los totales (`seguidores`, `siguiendo`, `megusta`, `guardados`) se calculan con `COUNT` al consultar; no se guardan en columnas, así nunca quedan desfasados.
- Al borrar un usuario o una pieza, sus filas en las tablas de unión se borran solas (`ON DELETE CASCADE`).
