# Vitrina · Taller 2 Web / Móvil

Plataforma para organizar y mostrar coleccionables, descubrir piezas de otros usuarios y conectarse con personas con intereses similares. Las categorías iniciales son cartas, videojuegos, juguetes y discos/vinilos, con una interfaz adaptable a computador y celular.

## Cómo ejecutar

Se necesita **Node.js 24 LTS** con npm. Desde la raíz del repositorio:

```bash
cd frontend
npm ci
npm start
```

Abrir **http://localhost:4200/** en el navegador. Para detener el servidor, usar `Ctrl+C` en la terminal.

El mockup funciona sin backend, base de datos ni Docker.

## Funciones

- Explorar piezas, buscar y filtrar por categoría.
- Ver el Feed, perfiles y colecciones.
- Dar likes, seguir coleccionistas y guardar favoritos.
- Agregar, editar y eliminar piezas propias.
- Revisar los formularios de ingreso y registro.

Los datos son de muestra y los cambios se pierden al recargar la página. Se utiliza un usuario de demostración fijo: `tomas_retro`. El ingreso y registro solo muestran el flujo y validan campos; todavía no crean cuentas ni autentican. El cierre de sesión también está pendiente.

## Tecnologías

El frontend usa **Angular**, con Angular Material para los iconos. La idea del proyecto contempla un backend con **FastAPI**, una API REST, **PostgreSQL**, SQLAlchemy, Alembic y autenticación JWT. Esa integración queda para las siguientes etapas.

## Comprobaciones

Desde la carpeta `frontend`:

```bash
npm test        # Comprueba la lógica del catálogo de demostración
npm run build  # Genera la versión de producción en dist/frontend/browser
```

Los detalles técnicos del frontend están en [frontend/README.md](frontend/README.md).
