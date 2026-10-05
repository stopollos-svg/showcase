import React, { useState, useMemo } from 'react';
import {
  Coins,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Search,
  Filter,
  ArrowUpRight,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Plus,
  Download,
  Database,
  Eye,
  FileText,
  User,
  Building2,
  Calendar,
  X,
  ExternalLink,
  ChevronRight,
  Receipt,
  Scale,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
  TransactionAuditLog,
} from '../../types';
import { RecordTransactionModal } from './RecordTransactionModal';

export const AdminTransactionLedger: React.FC = () => {
  const {
    currentUser,
    switchAccount,
    transactions,
    getTransactions,
    updateTransactionStatus,
    refundTransaction,
    resolveDispute,
    getFinancialSummary,
    getTransactionAuditLogs,
    refreshTransactions,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'transactions' | 'schema' | 'audits'>('transactions');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isRecordModalOpen, setRecordModalOpen] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [activeActionModal, setActiveActionModal] = useState<{
    type: 'refund' | 'dispute' | 'settle';
    tx: Transaction;
  } | null>(null);

  const isAdminUser = currentUser?.id === 'user_admin';

  // Compute live financial summary
  const summary = useMemo(() => getFinancialSummary(), [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return getTransactions({
      status: statusFilter,
      type: typeFilter,
      search: searchQuery,
    });
  }, [transactions, statusFilter, typeFilter, searchQuery]);

  // Selected transaction audit logs
  const selectedAuditLogs = useMemo(() => {
    if (!selectedTx) return [];
    return getTransactionAuditLogs(selectedTx.id);
  }, [selectedTx, transactions]);

  const handleSettle = async (tx: Transaction) => {
    try {
      await updateTransactionStatus(
        tx.id,
        'settled',
        'Administrative manual settlement and artisan payout release.'
      );
      if (selectedTx?.id === tx.id) {
        setSelectedTx(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Settlement failed', 'error');
    }
  };

  const handleConfirmAction = async () => {
    if (!activeActionModal) return;
    const { type, tx } = activeActionModal;
    const reason = actionReason.trim() || 'Administrative manual intervention';

    try {
      if (type === 'refund') {
        await refundTransaction(tx.id, reason);
      } else if (type === 'dispute') {
        await updateTransactionStatus(tx.id, 'disputed', reason);
      } else if (type === 'settle') {
        await updateTransactionStatus(tx.id, 'settled', reason);
      }
      setActiveActionModal(null);
      setActionReason('');
      if (selectedTx?.id === tx.id) {
        setSelectedTx(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Reference ID',
      'Created At',
      'Item Title',
      'Type',
      'Buyer ID',
      'Artisan Seller ID',
      'Gross Amount ($)',
      'Platform Fee ($)',
      'Artisan Payout ($)',
      'Status',
      'Payment Method',
    ];
    const rows = filteredTransactions.map((t) => [
      t.reference_id,
      t.created_at,
      `"${t.item_title.replace(/"/g, '""')}"`,
      t.item_type,
      t.buyer_id,
      t.seller_id,
      (t.amount_cents / 100).toFixed(2),
      (t.fee_cents / 100).toFixed(2),
      (t.payout_cents / 100).toFixed(2),
      t.status,
      t.payment_method,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `amapati_transactions_ledger_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Transaction ledger exported to CSV!', 'success');
  };

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'settled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span className="capitalize">Settled</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <RotateCcw className="w-3 h-3 text-amber-600 animate-spin-slow" />
            <span className="capitalize">Pending Escrow</span>
          </span>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span className="capitalize">Disputed</span>
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <RotateCcw className="w-3 h-3 text-purple-600" />
            <span className="capitalize">Refunded</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
            <span className="capitalize">{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Administrative Profile Header Card */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-stone-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-lg ring-2 ring-orange-400/30">
              <Coins className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-lg sm:text-xl font-black tracking-tight text-white">
                  Administrative Financial Ledger
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  PostgreSQL Relational Ledger
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1 max-w-xl">
                Maintain and record all artisan marketplace transactions, oversee 5% platform commissions, resolve disputes, and audit financial settlement batches.
              </p>
            </div>
          </div>

          {/* Admin Identity Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {!isAdminUser ? (
              <button
                onClick={() => switchAccount('user_admin')}
                className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition active:scale-95 flex items-center gap-1.5"
                title="Log in as the seeded platform administrator profile"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Switch to Master Admin</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 text-emerald-400 text-xs font-semibold border border-stone-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Master Admin Session</span>
              </span>
            )}

            <button
              onClick={() => setRecordModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white text-stone-900 hover:bg-stone-100 text-xs font-semibold shadow-sm transition active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5] text-orange-600" />
              <span>Record Transaction</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs inside Admin Ledger */}
        <div className="flex items-center gap-1 mt-6 pt-4 border-t border-stone-800/80 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              activeTab === 'transactions'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Transaction Register ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'schema'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>PostgreSQL Schema (DDL)</span>
          </button>
          <button
            onClick={() => setActiveTab('audits')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'audits'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Audit Trail ({getTransactionAuditLogs().length})</span>
          </button>
        </div>
      </div>

      {/* 2. Financial Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: Gross Merchandise Volume */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs hover:border-orange-300 transition">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
            Gross Volume (GMV)
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-stone-900">
              ${(summary.totalGmvCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Across all artisan craft sales</p>
        </div>

        {/* Card 2: Platform Revenue (5% Fee) */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs hover:border-orange-300 transition">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
            Platform Net Fees (5%)
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-orange-600">
              ${(summary.platformRevenueCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Direct marketplace treasury</p>
        </div>

        {/* Card 3: Settled to Artisans */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs hover:border-orange-300 transition">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
            Settled Volume
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-emerald-700">
              ${(summary.settledVolumeCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            {summary.settledCount} orders settled
          </p>
        </div>

        {/* Card 4: Pending & Disputed */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs hover:border-orange-300 transition">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
            Pending Escrow
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-amber-700">
              ${(summary.pendingPayoutsCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-amber-700 font-semibold mt-1">
            {summary.pendingCount} pending · {summary.disputedCount} disputed
          </p>
        </div>
      </div>

      {/* 3. Main Content Views */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 border-b border-stone-200 bg-stone-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by TXN ID, item, artisan, or buyer..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            {/* Filter Pills & Export */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <div className="flex items-center bg-white p-0.5 rounded-xl border border-stone-200 text-xs">
                {['all', 'settled', 'pending', 'disputed', 'refunded'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition ${
                      statusFilter === st
                        ? 'bg-stone-900 text-white shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="craft_order">Craft Order</option>
                <option value="custom_commission">Commission</option>
                <option value="workshop_ticket">Workshop</option>
                <option value="patronage_tip">Patronage Tip</option>
                <option value="booth_sale">Market Booth</option>
              </select>

              {/* Export Button */}
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 active:scale-95"
                title="Download CSV ledger"
              >
                <Download className="w-3.5 h-3.5 text-stone-600" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100/80 text-stone-600 uppercase font-mono text-[10px] tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">TXN Reference</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Item / Service</th>
                  <th className="py-3 px-3">Artisan Seller</th>
                  <th className="py-3 px-3">Customer Buyer</th>
                  <th className="py-3 px-3 text-right">Gross Amount</th>
                  <th className="py-3 px-3 text-right">Fee (5%)</th>
                  <th className="py-3 px-3 text-right">Artisan Payout</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-stone-400">
                      No transactions found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-orange-50/30 transition group cursor-pointer"
                      onClick={() => setSelectedTx(tx)}
                    >
                      {/* Reference ID */}
                      <td className="py-3 px-4 font-mono font-bold text-orange-700 whitespace-nowrap">
                        {tx.reference_id}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-stone-500 whitespace-nowrap font-mono text-[11px]">
                        {new Date(tx.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Item */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-stone-900 line-clamp-1 max-w-[180px]">
                          {tx.item_title}
                        </div>
                        <span className="text-[10px] text-stone-400 capitalize">
                          {tx.item_type.replace('_', ' ')} · {tx.payment_method.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Seller */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-stone-800 line-clamp-1">
                          {tx.seller?.business_name || tx.seller_id}
                        </div>
                        <span className="text-[10px] text-stone-500">{tx.seller?.category}</span>
                      </td>

                      {/* Buyer */}
                      <td className="py-3 px-3">
                        <div className="text-stone-700 line-clamp-1">
                          {tx.buyer?.business_name || tx.customer_email || tx.buyer_id}
                        </div>
                      </td>

                      {/* Gross Amount */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-stone-900 whitespace-nowrap">
                        ${(tx.amount_cents / 100).toFixed(2)}
                      </td>

                      {/* Fee */}
                      <td className="py-3 px-3 text-right font-mono text-orange-700 whitespace-nowrap">
                        ${(tx.fee_cents / 100).toFixed(2)}
                      </td>

                      {/* Payout */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        ${(tx.payout_cents / 100).toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {getStatusBadge(tx.status)}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {tx.status === 'pending' && (
                            <button
                              onClick={() => handleSettle(tx)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition shadow-2xs active:scale-95"
                              title="Release payout to artisan"
                            >
                              Settle
                            </button>
                          )}

                          {tx.status === 'disputed' && (
                            <button
                              onClick={() =>
                                setActiveActionModal({
                                  type: 'settle',
                                  tx,
                                })
                              }
                              className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-bold transition shadow-2xs active:scale-95"
                              title="Resolve dispute"
                            >
                              Resolve
                            </button>
                          )}

                          {tx.status === 'settled' && (
                            <button
                              onClick={() =>
                                setActiveActionModal({
                                  type: 'refund',
                                  tx,
                                })
                              }
                              className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold transition"
                              title="Issue refund"
                            >
                              Refund
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedTx(tx)}
                            className="p-1 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition"
                            title="View receipt and audit history"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. PostgreSQL Relational Schema Tab */}
      {activeTab === 'schema' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-4">
            <div>
              <h3 className="font-display text-base font-bold text-stone-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-orange-600" />
                <span>PostgreSQL Relational Schema Definition</span>
              </h3>
              <p className="text-xs text-stone-500">
                Live relational architecture with check constraints, foreign keys, triggers, and indices.
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`-- PostgreSQL Schema: Amapati Transaction Ledger\nCREATE TABLE transactions (...);`);
                showToast('SQL DDL copied to clipboard!', 'success');
              }}
              className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700 transition"
            >
              Copy Schema SQL
            </button>
          </div>

          {/* DDL Code Box */}
          <div className="p-4 rounded-2xl bg-stone-950 text-stone-200 font-mono text-xs overflow-x-auto max-h-[460px] leading-relaxed select-text">
            <pre>
{`-- PostgreSQL 15+ Relational Ledger Architecture

CREATE TYPE transaction_status_enum AS ENUM (
    'pending', 'settled', 'refunded', 'disputed', 'cancelled'
);

CREATE TYPE transaction_type_enum AS ENUM (
    'craft_order', 'custom_commission', 'workshop_ticket', 'patronage_tip', 'booth_sale'
);

CREATE TABLE transactions (
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
    payment_method VARCHAR(32) NOT NULL DEFAULT 'credit_card',
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

CREATE TABLE transaction_audit_logs (
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

CREATE INDEX idx_transactions_seller ON transactions(seller_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);`}
            </pre>
          </div>
        </div>
      )}

      {/* 5. Complete Audit Logs Tab */}
      {activeTab === 'audits' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
          <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-stone-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-orange-600" />
                <span>Immutable Transaction Audit Trail</span>
              </h3>
              <p className="text-xs text-stone-500">
                Append-only log of every administrative settlement, status transition, and refund.
              </p>
            </div>
            <button
              onClick={refreshTransactions}
              className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 transition"
              title="Refresh audits"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {getTransactionAuditLogs().map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-orange-700 bg-orange-100/70 px-2 py-0.5 rounded-md">
                      {log.reference_id}
                    </span>
                    <span className="font-semibold text-stone-900 uppercase text-[10px] tracking-wider px-2 py-0.5 rounded bg-stone-200/80">
                      {log.action}
                    </span>
                    <span className="text-stone-400">by</span>
                    <span className="font-semibold text-stone-800">{log.admin_name}</span>
                  </div>
                  <p className="text-stone-700">{log.reason}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-[11px] text-stone-400 block">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                  {log.amount_affected_cents && (
                    <span className="font-mono font-bold text-stone-900 text-xs">
                      ${(log.amount_affected_cents / 100).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Selected Transaction Detail Drawer / Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[95vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-stone-900">
                      {selectedTx.reference_id}
                    </span>
                    {getStatusBadge(selectedTx.status)}
                  </div>
                  <p className="text-xs text-stone-500">
                    {new Date(selectedTx.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto text-xs">
              {/* Item Summary */}
              <div className="p-4 rounded-2xl bg-orange-50/40 border border-orange-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 font-semibold uppercase text-[10px] tracking-wider">
                    Purchased Item
                  </span>
                  <span className="font-mono font-bold text-stone-900 text-sm">
                    ${(selectedTx.amount_cents / 100).toFixed(2)}
                  </span>
                </div>
                <h4 className="font-display text-sm font-bold text-stone-900">
                  {selectedTx.item_title}
                </h4>
                <p className="text-[11px] text-stone-600">
                  Type: <span className="font-semibold capitalize">{selectedTx.item_type.replace('_', ' ')}</span> · Payment: <span className="font-semibold capitalize">{selectedTx.payment_method.replace('_', ' ')}</span>
                </p>
              </div>

              {/* Financial Breakdown */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-stone-50 rounded-2xl border border-stone-200 font-mono text-center">
                <div>
                  <span className="text-stone-500 block text-[10px]">Gross Total</span>
                  <span className="font-bold text-stone-900 text-xs">
                    ${(selectedTx.amount_cents / 100).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px]">Platform Fee (5%)</span>
                  <span className="font-bold text-orange-700 text-xs">
                    ${(selectedTx.fee_cents / 100).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px]">Net Payout</span>
                  <span className="font-bold text-emerald-700 text-xs">
                    ${(selectedTx.payout_cents / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-semibold block uppercase">Artisan Seller</span>
                  <p className="font-bold text-stone-900 mt-0.5">{selectedTx.seller?.business_name}</p>
                  <p className="text-[11px] text-stone-500">{selectedTx.seller?.category}</p>
                </div>
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-semibold block uppercase">Customer Buyer</span>
                  <p className="font-bold text-stone-900 mt-0.5">
                    {selectedTx.buyer?.business_name || selectedTx.customer_email || 'Direct Buyer'}
                  </p>
                  {selectedTx.customer_email && (
                    <p className="text-[11px] text-stone-500 truncate">{selectedTx.customer_email}</p>
                  )}
                </div>
              </div>

              {/* Notes & Shipping */}
              {selectedTx.notes && (
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-semibold block uppercase">Transaction Notes</span>
                  <p className="text-xs text-stone-700 mt-1">{selectedTx.notes}</p>
                </div>
              )}

              {/* Audit History for this transaction */}
              <div>
                <h5 className="font-bold text-stone-900 mb-2 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-orange-600" />
                  <span>Audit History</span>
                </h5>
                <div className="space-y-2">
                  {selectedAuditLogs.map((log) => (
                    <div key={log.id} className="p-2.5 rounded-xl bg-stone-100/70 border border-stone-200 text-[11px]">
                      <div className="flex items-center justify-between text-stone-500 mb-1">
                        <span className="font-semibold text-stone-800">{log.admin_name}</span>
                        <span className="font-mono text-[10px]">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-stone-700">{log.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-2">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-200/60 font-semibold transition"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {selectedTx.status === 'pending' && (
                  <button
                    onClick={() => handleSettle(selectedTx)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition active:scale-95"
                  >
                    Mark Settled & Disburse
                  </button>
                )}

                {selectedTx.status === 'settled' && (
                  <button
                    onClick={() =>
                      setActiveActionModal({
                        type: 'refund',
                        tx: selectedTx,
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-semibold transition"
                  >
                    Issue Refund
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Action Confirm Modal (Refund / Dispute Resolution) */}
      {activeActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-stone-900">
                {activeActionModal.type === 'refund'
                  ? 'Issue Transaction Refund'
                  : 'Resolve Dispute'}
              </h4>
              <button
                onClick={() => setActiveActionModal(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Transaction: <span className="font-mono font-bold text-orange-700">{activeActionModal.tx.reference_id}</span> (${(activeActionModal.tx.amount_cents / 100).toFixed(2)})
            </p>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Audit Reason / Justification
              </label>
              <textarea
                rows={3}
                required
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Reason for this administrative ledger update..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveActionModal(null)}
                className="px-3 py-1.5 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
              >
                Confirm & Write to Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record New Transaction Modal */}
      <RecordTransactionModal
        isOpen={isRecordModalOpen}
        onClose={() => setRecordModalOpen(false)}
      />
    </div>
  );
};
