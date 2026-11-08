from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Comentario(Base):
    """Un comentario de un usuario en una pieza. Puede responder a otro comentario (un solo nivel)."""

    __tablename__ = "comentarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    texto: Mapped[str] = mapped_column(String(300))
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Índice propio: cada pieza lista sus comentarios buscando por esta columna.
    pieza_id: Mapped[int] = mapped_column(ForeignKey("piezas.id", ondelete="CASCADE"), index=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"))
    usuario: Mapped["Usuario"] = relationship("Usuario")
    # Si es una respuesta, el comentario al que responde. Al borrar el original se borran sus respuestas.
    padre_id: Mapped[int | None] = mapped_column(ForeignKey("comentarios.id", ondelete="CASCADE"), index=True)
