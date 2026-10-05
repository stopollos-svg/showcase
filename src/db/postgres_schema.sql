-- =========================================================================
-- PostgreSQL Database Schema: Amapati Administrative Financial & Transaction Ledger
-- Database: PostgreSQL 15+ / Cloud SQL Compatible
-- =========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
CREATE TYPE transaction_status_enum AS ENUM (
    'pending',
    'settled',
    'refunded',
    'disputed',
    'cancelled'
);

CREATE TYPE transaction_type_enum AS ENUM (
    'craft_order',
    'custom_commission',
    'workshop_ticket',
    'patronage_tip',
    'booth_sale'
);

CREATE TYPE payment_method_enum AS ENUM (
    'credit_card',
    'apple_pay',
    'market_cash',
    'direct_transfer'
);

CREATE TYPE staff_role_enum AS ENUM (
    'admin',
    'financial_controller',
    'moderator',
    'auditor'
);

-- 3. PROFILES TABLE (Artisans & Buyers)
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(64) PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    bio TEXT,
    category VARCHAR(100) NOT NULL,
    contact VARCHAR(100),
    avatar_url TEXT,
    is_private BOOLEAN DEFAULT FALSE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    verified_at TIMESTAMPTZ,
    verified_by VARCHAR(64),
    location VARCHAR(255),
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. STAFF ROLES TABLE (Administrative Profiles)
CREATE TABLE IF NOT EXISTS staff_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(64) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role staff_role_enum NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by VARCHAR(64) REFERENCES profiles(id),
    CONSTRAINT unique_user_staff_role UNIQUE (user_id, role)
);

-- 5. TRANSACTIONS TABLE (Relational Financial Ledger)
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(64) PRIMARY KEY,
    reference_id VARCHAR(32) NOT NULL UNIQUE,
    buyer_id VARCHAR(64) NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    seller_id VARCHAR(64) NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    item_type transaction_type_enum NOT NULL DEFAULT 'craft_order',
    item_title VARCHAR(255) NOT NULL,
    post_id VARCHAR(64),
    amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
    fee_cents BIGINT NOT NULL DEFAULT 0 CHECK (fee_cents >= 0),
    payout_cents BIGINT NOT NULL CHECK (payout_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status transaction_status_enum NOT NULL DEFAULT 'pending',
    payment_method payment_method_enum NOT NULL DEFAULT 'credit_card',
    notes TEXT,
    shipping_address TEXT,
    customer_email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    settled_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    disputed_at TIMESTAMPTZ,
    dispute_reason TEXT,
    CONSTRAINT check_amount_breakdown CHECK (amount_cents = fee_cents + payout_cents)
);

-- 6. TRANSACTION AUDIT LOGS (Immutable Append-Only Audit Trail)
CREATE TABLE IF NOT EXISTS transaction_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id VARCHAR(64) NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    reference_id VARCHAR(32) NOT NULL,
    admin_id VARCHAR(64) NOT NULL REFERENCES profiles(id),
    admin_name VARCHAR(255) NOT NULL,
    action VARCHAR(64) NOT NULL,
    previous_status transaction_status_enum,
    new_status transaction_status_enum NOT NULL,
    amount_affected_cents BIGINT,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_transactions_seller ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_audit_transaction_id ON transaction_audit_logs(transaction_id);

-- 8. TRIGGER: Automatic Timestamp & Immutability Protection
CREATE OR REPLACE FUNCTION audit_transaction_status_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO transaction_audit_logs (
            transaction_id,
            reference_id,
            admin_id,
            admin_name,
            action,
            previous_status,
            new_status,
            amount_affected_cents,
            reason,
            created_at
        ) VALUES (
            NEW.id,
            NEW.reference_id,
            COALESCE(current_setting('app.current_admin_id', true), 'user_admin'),
            'Administrative Controller',
            'status_changed',
            OLD.status,
            NEW.status,
            NEW.amount_cents,
            CONCAT('Automatic status transition from ', OLD.status, ' to ', NEW.status),
            CURRENT_TIMESTAMP
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_audit_transaction_status
AFTER UPDATE OF status ON transactions
FOR EACH ROW
EXECUTE FUNCTION audit_transaction_status_trigger();
