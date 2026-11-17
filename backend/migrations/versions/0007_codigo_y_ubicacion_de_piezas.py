"""codigo escaneado y ubicacion de las piezas (Taller 3)

Revision ID: 0007
Revises: 0006
Create Date: 2026-11-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0007'
down_revision: Union[str, Sequence[str], None] = '0006'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('piezas', sa.Column('codigo', sa.String(length=128), nullable=True))
    op.add_column('piezas', sa.Column('latitud', sa.Float(), nullable=True))
    op.add_column('piezas', sa.Column('longitud', sa.Float(), nullable=True))
    op.create_index(op.f('ix_piezas_codigo'), 'piezas', ['codigo'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_piezas_codigo'), table_name='piezas')
    op.drop_column('piezas', 'longitud')
    op.drop_column('piezas', 'latitud')
    op.drop_column('piezas', 'codigo')
