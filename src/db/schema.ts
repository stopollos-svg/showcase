/**
 * PostgreSQL Database Schema Types: Amapati Transaction Ledger & Administrative Profile
 * Defines the exact relational schema, column constraints, and foreign key relationships.
 */

export interface PostgresColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey?: boolean;
  isUnique?: boolean;
  references?: string;
  defaultValue?: string;
  check?: string;
}

export interface PostgresTableDefinition {
  name: string;
  description: string;
  columns: PostgresColumnDefinition[];
  indexes: string[];
}

export const POSTGRES_TABLES: Record<string, PostgresTableDefinition> = {
  profiles: {
    name: 'profiles',
    description: 'Registered artisan businesses, studio creators, and customers',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', nullable: false, isPrimaryKey: true },
      { name: 'business_name', type: 'VARCHAR(255)', nullable: false },
      { name: 'bio', type: 'TEXT', nullable: true },
      { name: 'category', type: 'VARCHAR(100)', nullable: false },
      { name: 'contact', type: 'VARCHAR(100)', nullable: true },
      { name: 'avatar_url', type: 'TEXT', nullable: true },
      { name: 'is_private', type: 'BOOLEAN', nullable: false, defaultValue: 'false' },
      { name: 'is_verified', type: 'BOOLEAN', nullable: false, defaultValue: 'false' },
      { name: 'location', type: 'VARCHAR(255)', nullable: true },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
    ],
    indexes: ['idx_profiles_category ON profiles(category)'],
  },

  staff_roles: {
    name: 'staff_roles',
    description: 'Administrative permissions and elevated clearance roles',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPrimaryKey: true, defaultValue: 'gen_random_uuid()' },
      { name: 'user_id', type: 'VARCHAR(64)', nullable: false, references: 'profiles(id)' },
      { name: 'role', type: 'VARCHAR(32)', nullable: false, defaultValue: "'admin'" },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
    ],
    indexes: ['unique_user_staff_role UNIQUE (user_id, role)'],
  },

  transactions: {
    name: 'transactions',
    description: 'Relational financial ledger recording orders, commissions, tips, and fees',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', nullable: false, isPrimaryKey: true },
      { name: 'reference_id', type: 'VARCHAR(32)', nullable: false, isUnique: true },
      { name: 'buyer_id', type: 'VARCHAR(64)', nullable: false, references: 'profiles(id)' },
      { name: 'seller_id', type: 'VARCHAR(64)', nullable: false, references: 'profiles(id)' },
      { name: 'item_type', type: 'VARCHAR(32)', nullable: false, defaultValue: "'craft_order'" },
      { name: 'item_title', type: 'VARCHAR(255)', nullable: false },
      { name: 'post_id', type: 'VARCHAR(64)', nullable: true, references: 'posts(id)' },
      { name: 'amount_cents', type: 'BIGINT', nullable: false, check: 'amount_cents >= 0' },
      { name: 'fee_cents', type: 'BIGINT', nullable: false, defaultValue: '0', check: 'fee_cents >= 0' },
      { name: 'payout_cents', type: 'BIGINT', nullable: false, check: 'payout_cents >= 0' },
      { name: 'currency', type: 'VARCHAR(3)', nullable: false, defaultValue: "'USD'" },
      { name: 'status', type: 'VARCHAR(32)', nullable: false, defaultValue: "'pending'" },
      { name: 'payment_method', type: 'VARCHAR(32)', nullable: false, defaultValue: "'credit_card'" },
      { name: 'notes', type: 'TEXT', nullable: true },
      { name: 'shipping_address', type: 'TEXT', nullable: true },
      { name: 'customer_email', type: 'VARCHAR(255)', nullable: true },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
      { name: 'settled_at', type: 'TIMESTAMPTZ', nullable: true },
      { name: 'refunded_at', type: 'TIMESTAMPTZ', nullable: true },
      { name: 'disputed_at', type: 'TIMESTAMPTZ', nullable: true },
      { name: 'dispute_reason', type: 'TEXT', nullable: true },
    ],
    indexes: [
      'idx_transactions_seller ON transactions(seller_id)',
      'idx_transactions_buyer ON transactions(buyer_id)',
      'idx_transactions_status ON transactions(status)',
      'idx_transactions_created_at ON transactions(created_at DESC)',
    ],
  },

  transaction_audit_logs: {
    name: 'transaction_audit_logs',
    description: 'Immutable append-only audit trail recording every administrative modification',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPrimaryKey: true, defaultValue: 'gen_random_uuid()' },
      { name: 'transaction_id', type: 'VARCHAR(64)', nullable: false, references: 'transactions(id)' },
      { name: 'reference_id', type: 'VARCHAR(32)', nullable: false },
      { name: 'admin_id', type: 'VARCHAR(64)', nullable: false, references: 'profiles(id)' },
      { name: 'admin_name', type: 'VARCHAR(255)', nullable: false },
      { name: 'action', type: 'VARCHAR(64)', nullable: false },
      { name: 'previous_status', type: 'VARCHAR(32)', nullable: true },
      { name: 'new_status', type: 'VARCHAR(32)', nullable: false },
      { name: 'amount_affected_cents', type: 'BIGINT', nullable: true },
      { name: 'reason', type: 'TEXT', nullable: false },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
    ],
    indexes: ['idx_audit_transaction_id ON transaction_audit_logs(transaction_id)'],
  },
};
