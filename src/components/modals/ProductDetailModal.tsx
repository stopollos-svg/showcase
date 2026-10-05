import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  MessageCircle,
  Phone,
  Tag,
  CheckCircle2,
  XCircle,
  Sparkles,
  Edit2,
  Trash2,
  Share2,
  Check,
  Coins,
} from 'lucide-react';
import { Product, Profile } from '../../types';
import { useApp } from '../../context/AppContext';
import { db } from '../../lib/mockEngine';

interface ProductDetailModalProps {
  product: Product;
  business: Profile;
  isOpen: boolean;
  onClose: () => void;
  isOwner: boolean;
  onEdit: (product: Product) => void;
  onDeleted: (productId: string) => void;
  onStockToggled: (updated: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  business,
  isOpen,
  onClose,
  isOwner,
  onEdit,
  onDeleted,
  onStockToggled,
}) => {
  const { openChatWithUser, showToast, recordTransaction } = useApp();
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleInquireViaChat = () => {
    onClose();
    openChatWithUser(
      business.id,
      `Hello! I'm interested in ordering "${product.title}" (${product.currency || '$'}${product.price.toFixed(2)}). Could you tell me more about availability and pickup/delivery?`
    );
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `Check out "${product.title}" by ${business.business_name}: ${window.location.href}`
      );
      setCopied(true);
      showToast('Product link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to remove "${product.title}" from your catalog?`)) {
      setIsDeleting(true);
      try {
        db.deleteProduct(product.id, business.id);
        showToast('Product deleted from catalog', 'info');
        onDeleted(product.id);
        onClose();
      } catch (err: any) {
        showToast(err.message || 'Failed to delete product', 'error');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleStockToggle = () => {
    try {
      const updated = db.toggleProductStock(product.id, business.id);
      showToast(
        updated.in_stock ? 'Product marked In Stock' : 'Product marked Out of Stock',
        'success'
      );
      onStockToggled(updated);
    } catch (err: any) {
      showToast(err.message || 'Failed to update stock', 'error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-200 text-stone-900 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black text-white transition shadow-md"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Product Media Cover */}
        <div className="relative aspect-4/3 sm:aspect-16/10 bg-stone-900 overflow-hidden">
          <img
            src={product.image_url}
            alt={product.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Badges on media */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 flex-wrap">
            {product.in_stock ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600/90 text-white shadow-sm backdrop-blur-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>In Stock</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600/90 text-white shadow-sm backdrop-blur-xs">
                <XCircle className="w-3.5 h-3.5" />
                <span>Out of Stock</span>
              </span>
            )}

            {product.featured && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/90 text-white shadow-sm backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Featured</span>
              </span>
            )}
          </div>

          {/* Category Tag on bottom left of image */}
          {product.category && (
            <div className="absolute bottom-3 left-4">
              <span className="px-2.5 py-0.8 rounded-lg text-[11px] font-semibold bg-white/90 text-stone-900 backdrop-blur-xs shadow-xs">
                {product.category}
              </span>
            </div>
          )}
        </div>

        {/* Body content */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Header Row: Title & Price */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-stone-900 leading-snug">
                {product.title}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Sold by <span className="font-semibold text-stone-800">{business.business_name}</span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono text-2xl font-black text-orange-600 tracking-tight">
                {product.currency || '$'}{product.price.toFixed(2)}
              </div>
              <span className="text-[10px] text-stone-400 block">Artisan direct</span>
            </div>
          </div>

          {/* Tags list */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {product.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200"
                >
                  <Tag className="w-3 h-3 text-stone-400" />
                  <span>{t}</span>
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100">
              <h4 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                Craft Notes & Description
              </h4>
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Owner Management Controls */}
          {isOwner && (
            <div className="p-3 rounded-2xl bg-orange-50/80 border border-orange-200/80 flex items-center justify-between gap-2">
              <div className="text-xs">
                <span className="font-bold text-orange-950 block">Product Controls</span>
                <span className="text-[10px] text-orange-700">Manage visibility and pricing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleStockToggle}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 flex items-center gap-1 ${
                    product.in_stock
                      ? 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {product.in_stock ? 'Mark Out of Stock' : 'Mark In Stock'}
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onEdit(product);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 text-xs font-semibold flex items-center gap-1 transition active:scale-95"
                >
                  <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-1.5 rounded-xl bg-white border border-stone-200 hover:bg-rose-50 text-rose-600 transition active:scale-95"
                  title="Delete product"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons for Patrons / Visitors */}
          <div className="pt-2 flex items-center gap-2">
            {!isOwner && (
              <button
                onClick={handleInquireViaChat}
                className="flex-1 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm transition active:scale-95 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Inquire / Message to Order</span>
              </button>
            )}

            {business.contact && (
              <a
                href={
                  business.contact.startsWith('http')
                    ? business.contact
                    : business.contact.includes('@')
                    ? `mailto:${business.contact}?subject=Inquiry about ${encodeURIComponent(product.title)}`
                    : `tel:${business.contact}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1.5 ${
                  isOwner
                    ? 'flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                }`}
              >
                <Phone className="w-4 h-4 text-orange-600" />
                <span>Call Store</span>
              </a>
            )}

            <button
              onClick={handleShare}
              className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition active:scale-95"
              title="Share product link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
