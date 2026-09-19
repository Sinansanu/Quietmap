"""Initial schema with PostgreSQL tables and indexes

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-09-19 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Locations
    op.create_table(
        'locations',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index('ix_locations_name', 'locations', ['name'], unique=True)

    # 2. Focus Sessions
    op.create_table(
        'focus_sessions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('location_id', sa.String(length=36), nullable=True),
        sa.Column('activity', sa.String(length=64), nullable=True),
        sa.Column('focus_score', sa.Integer(), nullable=True),
        sa.Column('average_noise', sa.Float(), nullable=True),
        sa.Column('stability_score', sa.Float(), nullable=True),
        sa.Column('interruption_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint('(focus_score IS NULL) OR (focus_score >= 0 AND focus_score <= 100)', name='check_focus_score_range'),
        sa.ForeignKeyConstraint(['location_id'], ['locations.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_focus_sessions_started_at', 'focus_sessions', ['started_at'])
    op.create_index('ix_focus_sessions_ended_at', 'focus_sessions', ['ended_at'])
    op.create_index('ix_focus_sessions_location_id', 'focus_sessions', ['location_id'])

    # 3. Noise Samples
    op.create_table(
        'noise_samples',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('recorded_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('noise_level', sa.Float(), nullable=False),
        sa.Column('location_id', sa.String(length=36), nullable=True),
        sa.Column('focus_session_id', sa.String(length=36), nullable=True),
        sa.CheckConstraint('noise_level >= 0.0 AND noise_level <= 100.0', name='check_noise_level_range'),
        sa.ForeignKeyConstraint(['focus_session_id'], ['focus_sessions.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['location_id'], ['locations.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_noise_samples_recorded_at', 'noise_samples', ['recorded_at'])
    op.create_index('ix_noise_samples_location_id', 'noise_samples', ['location_id'])
    op.create_index('ix_noise_samples_focus_session_id', 'noise_samples', ['focus_session_id'])
    op.create_index('ix_noise_samples_location_time', 'noise_samples', ['location_id', 'recorded_at'])
    op.create_index('ix_noise_samples_session_time', 'noise_samples', ['focus_session_id', 'recorded_at'])

    # 4. Interruptions
    op.create_table(
        'interruptions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('focus_session_id', sa.String(length=36), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('duration_seconds', sa.Float(), nullable=False),
        sa.Column('intensity', sa.Float(), nullable=False),
        sa.Column('peak_level', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['focus_session_id'], ['focus_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_interruptions_focus_session_id', 'interruptions', ['focus_session_id'])
    op.create_index('ix_interruptions_started_at', 'interruptions', ['started_at'])

    # 5. Daily Statistics
    op.create_table(
        'daily_statistics',
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('average_noise', sa.Float(), nullable=True),
        sa.Column('quietest_hour', sa.Integer(), nullable=True),
        sa.Column('quietest_period_label', sa.String(length=32), nullable=True),
        sa.Column('interruption_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('average_focus_score', sa.Float(), nullable=True),
        sa.Column('total_focus_minutes', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('sample_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('date')
    )

    # 6. Settings
    op.create_table(
        'settings',
        sa.Column('key', sa.String(length=64), nullable=False),
        sa.Column('value', sa.String(length=256), nullable=False),
        sa.PrimaryKeyConstraint('key')
    )


def downgrade() -> None:
    op.drop_table('settings')
    op.drop_table('daily_statistics')
    op.drop_table('interruptions')
    op.drop_table('noise_samples')
    op.drop_table('focus_sessions')
    op.drop_table('locations')
