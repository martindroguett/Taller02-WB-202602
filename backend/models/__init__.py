# Cada modelo nuevo se importa aquí, para que Alembic lo encuentre al generar migraciones.
from .seguimiento import Seguimiento
from .usuario import Usuario
from .pieza import Pieza
from .categoria import Categoria

__all__ = ["Seguimiento", "Usuario", "Pieza", "Categoria"]
