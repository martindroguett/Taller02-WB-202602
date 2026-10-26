from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base

class Seguimiento(Base):
    """Tabla de unión usuario → usuario: «seguidor_id sigue a seguido_id»."""

    __tablename__ = "seguimientos"
    __table_args__ = (CheckConstraint("seguidor_id <> seguido_id", name="no_seguirse"),)

    #las dos claves foráneas forman juntas la clave primaria: no se puede seguir dos veces a alguien.
    seguidor_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True
    )
    # Índice propio: el Feed y el contador de seguidores buscan por esta columna.
    seguido_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True, index=True
    )
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
