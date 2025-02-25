"""solana plays

Revision ID: b7185f6920d3
Revises: af43df9fbde0
Create Date: 2021-04-12 15:40:15.563165

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b7185f6920d3'
down_revision = 'af43df9fbde0'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('plays', sa.Column('slot', sa.Integer(), nullable=True))
    op.add_column('plays', sa.Column('signature', sa.String(), nullable=True))
    # Add an index on signature, this field is queried in each indexing task
    op.create_index(op.f('ix_plays_sol_signature'), 'plays', ['signature'], unique=False)

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_plays_sol_signature'), table_name='plays')
    op.drop_column('plays', 'slot')
    op.drop_column('plays', 'signature')
    # ### end Alembic commands ###
