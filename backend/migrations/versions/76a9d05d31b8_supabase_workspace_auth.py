"""Add Supabase identity, workspace scopes, and attachment object metadata.

Revision ID: 76a9d05d31b8
Revises: 01c4a3d3e8d4
"""
from alembic import op
import sqlalchemy as sa


revision = '76a9d05d31b8'
down_revision = '01c4a3d3e8d4'
branch_labels = None
depends_on = None


def _column_exists(table, column):
    return column in {
        item['name'] for item in sa.inspect(op.get_bind()).get_columns(table)
    }


def _table_exists(table):
    return table in sa.inspect(op.get_bind()).get_table_names()


def _add_workspace_column(table):
    if _column_exists(table, 'workspace_id'):
        return
    with op.batch_alter_table(table) as batch:
        batch.add_column(sa.Column('workspace_id', sa.Integer(), nullable=True))
        batch.create_foreign_key(
            f'fk_{table}_workspace_id_workspaces',
            'workspaces',
            ['workspace_id'],
            ['id'],
        )
    op.create_index(f'ix_{table}_workspace_id', table, ['workspace_id'])


def upgrade():
    if not _column_exists('users', 'supabase_user_id'):
        with op.batch_alter_table('users') as batch:
            batch.add_column(sa.Column('supabase_user_id', sa.String(36), nullable=True))
            batch.create_index(
                'ix_users_supabase_user_id',
                ['supabase_user_id'],
                unique=True,
            )

    for table in ('attendance', 'equipment_breakdowns', 'maintenance', 'attachments'):
        _add_workspace_column(table)

    if not _column_exists('attachments', 'uploader_id'):
        op.add_column('attachments', sa.Column('uploader_id', sa.String(36), nullable=True))
    if not _column_exists('attachments', 'storage_path'):
        with op.batch_alter_table('attachments') as batch:
            batch.add_column(sa.Column('storage_path', sa.String(1024), nullable=True))
            batch.create_unique_constraint('uq_attachments_storage_path', ['storage_path'])

    if not _table_exists('workspace_memberships'):
        op.create_table(
            'workspace_memberships',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('workspace_id', sa.Integer(), nullable=False),
            sa.Column('role', sa.String(50), nullable=False, server_default='operator'),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('user_id', 'workspace_id', name='uq_workspace_membership'),
        )
    inspector = sa.inspect(op.get_bind())
    indexes = {
        item['name'] for item in inspector.get_indexes('workspace_memberships')
    }
    if 'ix_workspace_memberships_user_id' not in indexes:
        op.create_index('ix_workspace_memberships_user_id', 'workspace_memberships', ['user_id'])
    if 'ix_workspace_memberships_workspace_id' not in indexes:
        op.create_index('ix_workspace_memberships_workspace_id', 'workspace_memberships', ['workspace_id'])

    # Backfill ownership through the existing report/equipment relationships.
    connection = op.get_bind()
    connection.execute(sa.text(
        'UPDATE attendance SET workspace_id = '
        '(SELECT workspace_id FROM shift_reports WHERE shift_reports.id = attendance.report_id) '
        'WHERE workspace_id IS NULL AND report_id IS NOT NULL'
    ))
    connection.execute(sa.text(
        'UPDATE equipment_breakdowns SET workspace_id = COALESCE('
        '(SELECT workspace_id FROM shift_reports WHERE shift_reports.id = equipment_breakdowns.report_id), '
        '(SELECT workspace_id FROM equipment WHERE equipment.id = equipment_breakdowns.equipment_id)) '
        'WHERE workspace_id IS NULL'
    ))
    connection.execute(sa.text(
        'UPDATE maintenance SET workspace_id = COALESCE('
        '(SELECT workspace_id FROM shift_reports WHERE shift_reports.id = maintenance.report_id), '
        '(SELECT workspace_id FROM equipment WHERE equipment.id = maintenance.equipment_id)) '
        'WHERE workspace_id IS NULL'
    ))
    connection.execute(sa.text(
        'UPDATE attachments SET workspace_id = '
        '(SELECT workspace_id FROM shift_reports WHERE shift_reports.id = attachments.report_id) '
        'WHERE workspace_id IS NULL AND report_id IS NOT NULL'
    ))
    connection.execute(sa.text(
        'INSERT INTO workspace_memberships (user_id, workspace_id, role, created_at) '
        'SELECT users.id, users.workspace_id, users.role, CURRENT_TIMESTAMP '
        'FROM users WHERE users.workspace_id IS NOT NULL '
        'AND NOT EXISTS (SELECT 1 FROM workspace_memberships m '
        'WHERE m.user_id = users.id AND m.workspace_id = users.workspace_id)'
    ))


def downgrade():
    raise RuntimeError(
        'Downgrade is disabled because it would remove Supabase identity and '
        'attachment metadata. Back up and plan a data-preserving rollback first.'
    )
