"""respuestas y me gusta de comentarios

Revision ID: 0006
Revises: 0005
Create Date: 2026-11-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0006'
down_revision: Union[str, Sequence[str], None] = '0005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('comentarios', sa.Column('padre_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_comentarios_padre_id'), 'comentarios', ['padre_id'], unique=False)
    op.create_foreign_key(op.f('fk_comentarios_padre_id_comentarios'), 'comentarios', 'comentarios', ['padre_id'], ['id'], ondelete='CASCADE')
    op.create_table('comentario_megusta',
    sa.Column('usuario_id', sa.Integer(), nullable=False),
    sa.Column('comentario_id', sa.Integer(), nullable=False),
    sa.Column('creado_en', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['comentario_id'], ['comentarios.id'], name=op.f('fk_comentario_megusta_comentario_id_comentarios'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], name=op.f('fk_comentario_megusta_usuario_id_usuarios'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('usuario_id', 'comentario_id', name=op.f('pk_comentario_megusta'))
    )
    op.create_index(op.f('ix_comentario_megusta_comentario_id'), 'comentario_megusta', ['comentario_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_comentario_megusta_comentario_id'), table_name='comentario_megusta')
    op.drop_table('comentario_megusta')
    op.drop_constraint(op.f('fk_comentarios_padre_id_comentarios'), 'comentarios', type_='foreignkey')
    op.drop_index(op.f('ix_comentarios_padre_id'), table_name='comentarios')
    op.drop_column('comentarios', 'padre_id')
