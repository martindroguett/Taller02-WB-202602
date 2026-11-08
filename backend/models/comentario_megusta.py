from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class ComentarioMeGusta(Base):
    """Tabla de unión usuario → comentario: «usuario_id le dio me gusta a comentario_id»."""

    __tablename__ = "comentario_megusta"

    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True
    )
    comentario_id: Mapped[int] = mapped_column(
        ForeignKey("comentarios.id", ondelete="CASCADE"), primary_key=True, index=True
    )
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
