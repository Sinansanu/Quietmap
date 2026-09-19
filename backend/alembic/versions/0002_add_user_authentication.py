"""Add user authentication and tenant isolation

Revision ID: 0002_add_user_authentication
Revises: 0001_initial_schema
Create Date: 2026-09-19 17:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0002_add_user_authentication'
down_revision: Union[str, None] = '0001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=128), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # 2. Add user_id to locations
    op.add_column('locations', sa.Column('user_id', sa.String(length=36), nullable=True))
    op.create_foreign_key(
        'fk_locations_user_id',
        'locations', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )
    op.create_index('ix_locations_user_id', 'locations', ['user_id'])
    
    # Replace global unique constraint on location name with user-scoped unique constraint
    try:
        op.drop_constraint('locations_name_key', 'locations', type_='unique')
    except Exception:
        pass
    try:
        op.drop_index('ix_locations_name', table_name='locations')
    except Exception:
        pass
    op.create_index('ix_locations_name', 'locations', ['name'], unique=False)
    op.create_unique_constraint('uq_locations_user_name', 'locations', ['user_id', 'name'])

    # 3. Add user_id to focus_sessions
    op.add_column('focus_sessions', sa.Column('user_id', sa.String(length=36), nullable=True))
    op.create_foreign_key(
        'fk_focus_sessions_user_id',
        'focus_sessions', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )
    op.create_index('ix_focus_sessions_user_id', 'focus_sessions', ['user_id'])

    # 4. Add user_id to noise_samples
    op.add_column('noise_samples', sa.Column('user_id', sa.String(length=36), nullable=True))
    op.create_foreign_key(
        'fk_noise_samples_user_id',
        'noise_samples', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )
    op.create_index('ix_noise_samples_user_id', 'noise_samples', ['user_id'])
    op.create_index('ix_noise_samples_user_time', 'noise_samples', ['user_id', 'recorded_at'])

    # 5. Modify settings table to support per-user settings
    op.add_column('settings', sa.Column('id', sa.String(length=36), nullable=True))
    op.execute("UPDATE settings SET id = gen_random_uuid()::text WHERE id IS NULL")
    op.alter_column('settings', 'id', nullable=False)
    
    try:
        op.drop_constraint('settings_pkey', 'settings', type_='primary')
    except Exception:
        pass
    op.create_primary_key('settings_pkey', 'settings', ['id'])

    op.add_column('settings', sa.Column('user_id', sa.String(length=36), nullable=True))
    op.create_foreign_key(
        'fk_settings_user_id',
        'settings', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )
    op.create_index('ix_settings_user_id', 'settings', ['user_id'])
    op.create_index('ix_settings_key', 'settings', ['key'])
    op.create_unique_constraint('uq_settings_user_key', 'settings', ['user_id', 'key'])


def downgrade() -> None:
    # Reverse settings
    try:
        op.drop_constraint('uq_settings_user_key', 'settings', type_='unique')
        op.drop_index('ix_settings_key', table_name='settings')
        op.drop_index('ix_settings_user_id', table_name='settings')
        op.drop_constraint('fk_settings_user_id', 'settings', type_='foreignkey')
        op.drop_column('settings', 'user_id')
        op.drop_constraint('settings_pkey', 'settings', type_='primary')
        op.drop_column('settings', 'id')
        op.create_primary_key('settings_pkey', 'settings', ['key'])
    except Exception:
        pass

    # Reverse noise_samples
    try:
        op.drop_index('ix_noise_samples_user_time', table_name='noise_samples')
        op.drop_index('ix_noise_samples_user_id', table_name='noise_samples')
        op.drop_constraint('fk_noise_samples_user_id', 'noise_samples', type_='foreignkey')
        op.drop_column('noise_samples', 'user_id')
    except Exception:
        pass

    # Reverse focus_sessions
    try:
        op.drop_index('ix_focus_sessions_user_id', table_name='focus_sessions')
        op.drop_constraint('fk_focus_sessions_user_id', 'focus_sessions', type_='foreignkey')
        op.drop_column('focus_sessions', 'user_id')
    except Exception:
        pass

    # Reverse locations
    try:
        op.drop_constraint('uq_locations_user_name', 'locations', type_='unique')
        op.drop_index('ix_locations_user_id', table_name='locations')
        op.drop_constraint('fk_locations_user_id', 'locations', type_='foreignkey')
        op.drop_column('locations', 'user_id')
        op.create_unique_constraint('locations_name_key', 'locations', ['name'])
    except Exception:
        pass

    # Drop users table
    op.drop_table('users')
