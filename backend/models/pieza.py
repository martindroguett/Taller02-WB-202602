from datetime import datetime

from sqlalchemy import DateTime, String, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Pieza(Base):
    __tablename__ = "piezas"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Mapped[str] sin "| None" crea la columna con NOT NULL.
    nombre: Mapped[str] = mapped_column(String(100))
    descripcion: Mapped[str] = mapped_column(String(300))
    imagen_url: Mapped[str] = mapped_column(String(2000))
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    usuario_id: Mapped[int] = mapped_column(ForeignKey('usuarios.id', ondelete="CASCADE"), index=True)
    usuario: Mapped["Usuario"] = relationship('Usuario', back_populates="piezas")
    categoria_id: Mapped[int] = mapped_column(ForeignKey('categorias.id', ondelete="RESTRICT"), index=True)
    categoria: Mapped["Categoria"] = relationship('Categoria', back_populates="piezas")
