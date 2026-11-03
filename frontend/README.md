# Vitrina · Frontend del taller

Prototipo Angular con componentes standalone, señales y estilos propios. Angular Material se utiliza para los iconos.
Explorar y el detalle consultan la API pública. Las demás pantallas usan datos de muestra en memoria y se reinician al recargar la página.

## Ejecutar y comprobar

Usar Node.js 24 LTS y las dependencias del archivo de bloqueo:

```bash
npm ci
npm start       # http://localhost:4200
npm test        # comprobaciones de catálogo público y de muestra, sin backend
npm run build
```

Para Explorar y el detalle, iniciar también la API en `http://localhost:8000` (ver el README raíz). El servidor de desarrollo redirige `/api` a esa dirección. Para desplegar el frontend, el servidor debe redirigir `/api` a la API.

La caché de disco está desactivada porque su módulo nativo LMDB aborta en el entorno local. Las fuentes se cargan en el navegador; el build no necesita descargarlas.

## Cómo está organizado

- `src/app/pages/`: las siete pantallas: Explorar, Feed, Favoritos, Perfil, detalle de pieza, formulario e ingreso/registro.
- `src/app/components/`: controles y bloques visuales compartidos. La tarjeta tiene dos presentaciones: grilla y fila.
- `src/app/services/catalogo-publico.service.ts`: consultas HTTP públicas a la lista y el detalle de piezas.
- `src/app/services/catalogo.service.ts`: piezas, usuarios e interacciones de muestra. Feed y Favoritos se calculan a partir de las mismas piezas; no mantienen copias.
- `src/app/services/toast.service.ts`: avisos breves y la acción de deshacer un favorito.
- `src/app/models/`: tipos de datos y formatos de presentación.
- `src/styles/tokens.css`: colores, espaciado y tipografía. `src/styles.css` define la base y la distribución adaptable.

Explorar conserva búsqueda y categoría en la URL. La confirmación de borrado utiliza un `<dialog>` nativo para gestionar el foco del teclado y bloquear el fondo.
No se incluyen chat, sets ni cargas simuladas.

## Qué funciona y qué queda pendiente

Explorar consulta piezas reales, permite buscar y filtrar por categoría, y carga páginas de 20 resultados. La URL conserva los filtros al volver desde el detalle. La pantalla informa carga, ausencia de resultados y errores con reintento; el detalle permite copiar su enlace. Los paneles laterales de perfil y coleccionistas son de demostración. Los nombres de propietarios reales se muestran sin enlace hasta conectar los perfiles; las acciones sociales están pendientes de conexión y la gestión está deshabilitada hasta integrar sesión.

Feed, perfiles, favoritos, interacciones sociales y formularios siguen siendo una demostración en memoria, con `tomas_retro` como usuario fijo. El ingreso y registro no autentican. Las piezas de muestra no tienen enlace al detalle real; sus cambios no se guardan en el backend y se pierden al recargar.

## Comprobación manual antes de presentar

1. Buscar y filtrar una categoría; abrir una pieza y volver. La búsqueda y categoría deben conservarse.
2. Seguir a alguien desde su perfil y revisar que sus piezas aparezcan en el Feed. Al dejar de seguir a todos debe aparecer el estado vacío.
3. Guardar una pieza, verla en Favoritos y quitarla. Comprobar también la acción Deshacer.
4. Agregar una pieza con foto; editarla; cancelar y confirmar el borrado. Solo deben modificarse las piezas propias.
5. Quitar una foto y cerrar el formulario: ninguno de esos botones debe guardar automáticamente.
6. Abrir la confirmación, recorrer sus botones con Tab y Shift+Tab, y cerrarla con Escape. El foco debe permanecer dentro y volver al control de origen.
7. Revisar móvil (320 y 390 px), tableta y escritorio: sin desplazamiento horizontal ni controles superpuestos.

`npm test` verifica el catálogo de muestra y utiliza `HttpTestingController` para comprobar filtros, cancelación, paginación, errores, reintentos, detalle público y aislamiento de las acciones públicas respecto de los datos de muestra.

## Fotos de muestra

Las ocho fotos de `public/fotos/` proceden del grupo Fotos del diseño de referencia. Queda pendiente registrar sus autores y licencias antes de publicar.
