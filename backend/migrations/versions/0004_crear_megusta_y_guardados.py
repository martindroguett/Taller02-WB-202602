"""crear megusta y guardados

Revision ID: 0004
Revises: 0003
Create Date: 2026-11-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0004'
down_revision: Union[str, Sequence[str], None] = '0003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # megusta y guardados tienen la misma forma: usuario + pieza como clave primaria compuesta.
    for tabla in ("megusta", "guardados"):
        op.create_table(tabla,
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('pieza_id', sa.Integer(), nullable=False),
        sa.Column('creado_en', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['pieza_id'], ['piezas.id'], name=op.f(f'fk_{tabla}_pieza_id_piezas'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], name=op.f(f'fk_{tabla}_usuario_id_usuarios'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('usuario_id', 'pieza_id', name=op.f(f'pk_{tabla}'))
        )
        op.create_index(op.f(f'ix_{tabla}_pieza_id'), tabla, ['pieza_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    for tabla in ("guardados", "megusta"):
        op.drop_index(op.f(f'ix_{tabla}_pieza_id'), table_name=tabla)
        op.drop_table(tabla)
