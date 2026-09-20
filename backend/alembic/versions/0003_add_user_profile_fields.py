"""Add user profile fields (timezone, timezone_mode, theme_preference, updated_at) and enforce NOT NULL on full_name

Revision ID: 0003_add_user_profile_fields
Revises: 0002_add_user_authentication
Create Date: 2026-09-19 22:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '0003_add_user_profile_fields'
down_revision: Union[str, None] = '0002_add_user_authentication'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enforce NOT NULL on users.full_name (verified 0 NULL full_name in audit)
    op.alter_column(
        'users',
        'full_name',
        existing_type=sa.String(length=128),
        nullable=False
    )

    # 2. Add timezone column (nullable=True, e.g. 'America/New_York')
    op.add_column(
        'users',
        sa.Column('timezone', sa.String(length=64), nullable=True)
    )

    # 3. Add timezone_mode column (nullable=False, server_default='auto')
    op.add_column(
        'users',
        sa.Column('timezone_mode', sa.String(length=16), nullable=False, server_default='auto')
    )

    # 4. Add theme_preference column (nullable=False, server_default='system')
    op.add_column(
        'users',
        sa.Column('theme_preference', sa.String(length=16), nullable=False, server_default='system')
    )

    # 5. Add updated_at column (nullable=True, server_default=sa.func.now())
    op.add_column(
        'users',
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now())
    )


def downgrade() -> None:
    op.drop_column('users', 'updated_at')
    op.drop_column('users', 'theme_preference')
    op.drop_column('users', 'timezone_mode')
    op.drop_column('users', 'timezone')
    op.alter_column(
        'users',
        'full_name',
        existing_type=sa.String(length=128),
        nullable=True
    )
