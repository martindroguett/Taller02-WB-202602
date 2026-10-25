# Vitrina · Frontend del taller

Prototipo Angular con componentes standalone, señales y estilos propios. Angular Material se utiliza para los iconos.
Los datos son de muestra, viven en memoria y se reinician al recargar la página.

## Ejecutar y comprobar

Usar Node.js 24 LTS y las dependencias del archivo de bloqueo:

```bash
npm ci
npm start       # http://localhost:4200
npm test        # comprobación del catálogo, sin backend
npm run build
```

La caché de disco está desactivada porque su módulo nativo LMDB aborta en el entorno local. Las fuentes se cargan en el navegador; el build no necesita descargarlas.

## Cómo está organizado

- `src/app/pages/`: las siete pantallas: Explorar, Feed, Favoritos, Perfil, detalle de pieza, formulario e ingreso/registro.
- `src/app/components/`: controles y bloques visuales compartidos. La tarjeta tiene dos presentaciones: grilla y fila.
- `src/app/services/catalogo.service.ts`: piezas, usuarios e interacciones de muestra. Feed y Favoritos se calculan a partir de las mismas piezas; no mantienen copias.
- `src/app/services/toast.service.ts`: avisos breves y la acción de deshacer un favorito.
- `src/app/models/`: tipos de datos y formatos de presentación.
- `src/styles/tokens.css`: colores, espaciado y tipografía. `src/styles.css` define la base y la distribución adaptable.

Explorar conserva búsqueda y categoría en la URL. La confirmación de borrado utiliza un `<dialog>` nativo para gestionar el foco del teclado y bloquear el fondo.
No se incluyen chat, sets ni cargas simuladas.

## Qué funciona y qué queda pendiente

Se puede buscar y filtrar, abrir perfiles y piezas, seguir y dejar de seguir, dar likes, guardar favoritos, copiar enlaces y agregar, editar o eliminar piezas propias.
El formulario pide nombre (máximo 100 caracteres), descripción, categoría y foto JPG, PNG o WebP de hasta 5 MB.

Ingreso y registro son una vista previa con validación: no crean cuentas ni autentican. La demostración utiliza siempre a Tomás Araya.
La edición de perfil, la sesión real, el cierre de sesión y la persistencia se implementarán al integrar el backend.
Las comprobaciones de propietario del frontend ayudan a la demostración; la API deberá autorizar cada modificación.

## Conectar el backend

Reemplazar las operaciones locales del catálogo por llamadas HTTP cuando estén definidos los endpoints de FastAPI.
Los métodos CRUD actuales son síncronos; sus pantallas deberán esperar las respuestas y mostrar carga y errores reales.
Adaptar los datos recibidos a `Usuario` y `Pieza`: `hace` representa minutos de muestra y deberá calcularse desde la fecha del backend.
La foto actualmente se lee para previsualizarla en memoria; con la API deberá enviarse el archivo y conservarse la URL que responda el servidor.
El número de catálogo es decorativo y no reemplaza al `id` de la base de datos.

Acordar con el equipo la autenticación JWT, los nombres de los campos y el tratamiento de errores antes de conectar los formularios.

## Comprobación manual antes de presentar

1. Buscar y filtrar una categoría; abrir una pieza y volver. La búsqueda y categoría deben conservarse.
2. Seguir a alguien desde su perfil y revisar que sus piezas aparezcan en el Feed. Al dejar de seguir a todos debe aparecer el estado vacío.
3. Guardar una pieza, verla en Favoritos y quitarla. Comprobar también la acción Deshacer.
4. Agregar una pieza con foto; editarla; cancelar y confirmar el borrado. Solo deben modificarse las piezas propias.
5. Quitar una foto y cerrar el formulario: ninguno de esos botones debe guardar automáticamente.
6. Abrir la confirmación, recorrer sus botones con Tab y Shift+Tab, y cerrarla con Escape. El foco debe permanecer dentro y volver al control de origen.
7. Revisar móvil (320 y 390 px), tableta y escritorio: sin desplazamiento horizontal ni controles superpuestos.

`npm test` verifica seguimiento y Feed, favoritos, CRUD, limpieza de referencias y protección de piezas ajenas usando los servicios reales.

## Fotos de muestra

Las ocho fotos de `public/fotos/` proceden del grupo Fotos del diseño de referencia. Queda pendiente registrar sus autores y licencias antes de publicar.
