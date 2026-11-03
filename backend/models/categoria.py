from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Categoria(Base):
    __tablename__ = "categorias"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Mapped[str] sin "| None" crea la columna con NOT NULL.
    slug: Mapped[str] = mapped_column(String(30), unique=True)
    nombre: Mapped[str] = mapped_column(String(30), unique=True)

    piezas: Mapped[list["Pieza"]] = relationship('Pieza', back_populates="categoria", passive_deletes="all")
