# Cada modelo nuevo se importa aquí, para que Alembic lo encuentre al generar migraciones.
from .seguimiento import Seguimiento
from .usuario import Usuario

__all__ = ["Seguimiento", "Usuario"]
