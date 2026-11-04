from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class MeGusta(Base):
    """Tabla de unión usuario → pieza: «usuario_id le dio me gusta a pieza_id»."""

    __tablename__ = "megusta"

    # Las dos claves foráneas forman juntas la clave primaria: un usuario da un solo me gusta por pieza.
    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True
    )
    # Índice propio: el contador de cada pieza y el orden «populares» buscan por esta columna.
    pieza_id: Mapped[int] = mapped_column(
        ForeignKey("piezas.id", ondelete="CASCADE"), primary_key=True, index=True
    )
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
