from logging.config import fileConfig

from alembic import context

import models  # noqa: F401  registra todos los modelos en Base.metadata
from database import Base, engine

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Alembic compara estas tablas (los modelos) con la base para generar migraciones con --autogenerate.
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Escribe el SQL de las migraciones sin conectarse (alembic upgrade head --sql)."""
    context.configure(
        url=engine.url.render_as_string(hide_password=False),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Aplica las migraciones usando la misma conexión que la API (config.py)."""
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
