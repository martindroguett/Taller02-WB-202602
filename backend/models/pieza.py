from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, String, func, ForeignKey, LargeBinary
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Pieza(Base):
    __tablename__ = "piezas"

    __table_args__ = (
        CheckConstraint(
            "(imagen_url IS NULL) <> (imagen_datos IS NULL)"
            " AND (imagen_datos IS NULL) = (imagen_tipo IS NULL)",
            name="una_imagen",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    descripcion: Mapped[str] = mapped_column(String(2000))
    imagen_url: Mapped[str | None] = mapped_column(String(2000))
    imagen_datos: Mapped[bytes | None] = mapped_column(LargeBinary, deferred=True)
    imagen_tipo: Mapped[str | None] = mapped_column(String(20))

    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    usuario_id: Mapped[int] = mapped_column(ForeignKey('usuarios.id', ondelete="CASCADE"), index=True)
    usuario: Mapped["Usuario"] = relationship('Usuario', back_populates="piezas")
    categoria_id: Mapped[int] = mapped_column(ForeignKey('categorias.id', ondelete="RESTRICT"), index=True)
    categoria: Mapped["Categoria"] = relationship('Categoria', back_populates="piezas")
