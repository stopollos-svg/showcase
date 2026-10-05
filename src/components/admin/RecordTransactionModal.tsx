import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Building2,
  User,
  ShoppingBag,
  FileText,
  CheckCircle2,
  AlertCircle,
  Coins,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../lib/mockEngine';
import { TransactionType, PaymentMethod, TransactionStatus } from '../../types';

interface RecordTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSellerId?: string;
}

export const RecordTransactionModal: React.FC<RecordTransactionModalProps> = ({
  isOpen,
  onClose,
  defaultSellerId,
}) => {
  const { recordTransaction } = useApp();
  const allProfiles = db.getAllProfiles();

  const [sellerId, setSellerId] = useState(defaultSellerId || 'user_coffee');
  const [buyerId, setBuyerId] = useState('user_bakery');
  const [itemType, setItemType] = useState<TransactionType>('craft_order');
  const [itemTitle, setItemTitle] = useState('');
  const [amountStr, setAmountStr] = useState('45.00');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [status, setStatus] = useState<TransactionStatus>('settled');
  const [notes, setNotes] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amountStr) || 0;
  const amountCents = Math.round(parsedAmount * 100);
  const feeCents = Math.round(amountCents * 0.05);
  const payoutCents = amountCents - feeCents;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) {
      setErrorMsg('Please enter an item or commission title.');
      return;
    }
    if (parsedAmount <= 0) {
      setErrorMsg('Please specify a positive transaction amount.');
      return;
    }
    if (sellerId === buyerId) {
      setErrorMsg('Seller and buyer must be distinct entities.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await recordTransaction({
        seller_id: sellerId,
        buyer_id: buyerId,
        item_type: itemType,
        item_title: itemTitle.trim(),
        amount_cents: amountCents,
        payment_method: paymentMethod,
        status: status,
        notes: notes.trim() || undefined,
        customer_email: customerEmail.trim() || undefined,
        shipping_address: shippingAddress.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0 shadow-2xs">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-stone-900 tracking-tight flex items-center gap-1.5">
                <span>Record New Transaction</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 font-semibold">
                  PostgreSQL Ledger
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                Log a market sale, custom invoice, or artisan commission with audit trail
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Seller & Buyer Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-orange-600" />
                <span>Artisan Seller (Recipient)</span>
              </label>
              <select
                value={sellerId}
                onChange={(e) => setSellerId(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                {allProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.business_name} ({p.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-stone-600" />
                <span>Customer / Buyer</span>
              </label>
              <select
                value={buyerId}
                onChange={(e) => setBuyerId(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                {allProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.business_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Item Title & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5 text-orange-600" />
                <span>Item Title / Craft Service</span>
              </label>
              <input
                type="text"
                required
                value={itemTitle}
                onChange={(e) => setItemTitle(e.target.value)}
                placeholder="e.g. Hand-thrown Stoneware Teapot"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Transaction Type</label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value as TransactionType)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="craft_order">Craft Order</option>
                <option value="custom_commission">Custom Commission</option>
                <option value="workshop_ticket">Workshop Ticket</option>
                <option value="patronage_tip">Patronage Tip</option>
                <option value="booth_sale">Market Booth Sale</option>
              </select>
            </div>
          </div>

          {/* Amount & Financial Breakdown Box */}
          <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-200/80 space-y-2.5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <label className="block font-bold text-stone-800 mb-1">
                  Gross Transaction Amount ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.50"
                    required
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-stone-300 rounded-xl font-mono text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>
              </div>

              <div className="flex-1">
                <label className="block font-bold text-stone-800 mb-1">Initial Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-semibold"
                >
                  <option value="settled">Settled (Released to Artisan)</option>
                  <option value="pending">Pending (Awaiting fulfillment)</option>
                </select>
              </div>
            </div>

            {/* Calculations breakdown */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-orange-200/60 text-[11px] font-mono">
              <div>
                <span className="text-stone-500 block">Gross Amount</span>
                <span className="font-bold text-stone-900">${(amountCents / 100).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-stone-500 block">Platform Fee (5%)</span>
                <span className="font-bold text-orange-700">${(feeCents / 100).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-stone-500 block">Net Artisan Payout</span>
                <span className="font-bold text-emerald-700">${(payoutCents / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method & Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-stone-600" />
                <span>Payment Method</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="credit_card">Credit Card (Stripe / Square)</option>
                <option value="apple_pay">Apple Pay / Contactless</option>
                <option value="market_cash">Market Booth Cash</option>
                <option value="direct_transfer">Direct ACH / Wire Transfer</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Customer Receipt Email (Optional)</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@domain.com"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-stone-600" />
              <span>Administrative Notes / Special Instructions</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Custom glaze recipe, in-person pickup at Saturday market booth #4..."
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold shadow-sm transition active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : 'Commit to Ledger'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
