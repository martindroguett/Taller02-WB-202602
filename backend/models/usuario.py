from datetime import datetime

from sqlalchemy import DateTime, String, func, select
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship

from database import Base

from .seguimiento import Seguimiento


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Mapped[str] sin "| None" crea la columna con NOT NULL.
    username: Mapped[str] = mapped_column(String(30), unique=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    nombre_visible: Mapped[str | None] = mapped_column(String(60))
    bio: Mapped[str | None] = mapped_column(String(300))
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Contadores calculados con COUNT al leer el usuario: no se guardan, así nunca quedan desfasados.
    seguidores: Mapped[int] = column_property(
        select(func.count())
        .where(Seguimiento.seguido_id == id)
        .correlate_except(Seguimiento)
        .scalar_subquery()
    )
    siguiendo: Mapped[int] = column_property(
        select(func.count())
        .where(Seguimiento.seguidor_id == id)
        .correlate_except(Seguimiento)
        .scalar_subquery()
    )

    piezas: Mapped[list["Pieza"]] = relationship('Pieza', back_populates="usuario", cascade="all, delete-orphan", passive_deletes=True)
