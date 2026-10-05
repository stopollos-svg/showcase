import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  DollarSign,
  Tag,
  Image as ImageIcon,
  Sparkles,
  Check,
  Plus,
  Trash2,
  Layers,
} from 'lucide-react';
import { Product } from '../../types';
import { db } from '../../lib/mockEngine';

interface ProductFormModalProps {
  businessId: string;
  product?: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (product: Product) => void;
}

const SAMPLE_PRODUCT_IMAGES = [
  { label: 'Coffee Roastery', url: '/src/assets/images/coffee_roaster_1790587302699.jpg' },
  { label: 'Ceramic Studio', url: '/src/assets/images/ceramic_studio_1790587319737.jpg' },
  { label: 'Bakery & Pastry', url: '/src/assets/images/bakery_pastry_1790587333429.jpg' },
  { label: 'Leather Workshop', url: '/src/assets/images/leather_tailor_1790587348791.jpg' },
  { label: 'Fresh Coffee Pour', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80' },
  { label: 'Artisan Workshop', url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80' },
];

const PRESET_TAG_SUGGESTIONS = [
  'Handmade',
  'Single-Origin',
  'Organic',
  'Limited Edition',
  'Best Seller',
  'Daily Bake',
  'Heirloom',
  'Eco-Friendly',
  'Bespoke',
  'Made to Order',
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  businessId,
  product,
  isOpen,
  onClose,
  onSaved,
}) => {
  const isEditing = Boolean(product);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('15.00');
  const [currency, setCurrency] = useState('$');
  const [imageUrl, setImageUrl] = useState('/src/assets/images/coffee_roaster_1790587302699.jpg');
  const [category, setCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [inStock, setInStock] = useState(true);
  const [stockQuantity, setStockQuantity] = useState('10');
  const [featured, setFeatured] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setTitle(product.title);
      setDescription(product.description);
      setPrice(product.price.toString());
      setCurrency(product.currency || '$');
      setImageUrl(product.image_url);
      setCategory(product.category || '');
      setTags(product.tags || []);
      setInStock(product.in_stock);
      setStockQuantity(product.stock_quantity?.toString() || '10');
      setFeatured(product.featured || false);
    } else {
      setTitle('');
      setDescription('');
      setPrice('18.00');
      setCurrency('$');
      setImageUrl('/src/assets/images/coffee_roaster_1790587302699.jpg');
      setCategory('');
      setTags(['Handmade', 'In Stock']);
      setInStock(true);
      setStockQuantity('15');
      setFeatured(false);
    }
    setError('');
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = (tagToAdd?: string) => {
    const val = (tagToAdd || tagInput).trim();
    if (!val) return;
    if (!tags.includes(val)) {
      setTags([...tags, val]);
    }
    if (!tagToAdd) {
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a product title');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError('Please enter a valid price amount');
      return;
    }

    try {
      if (isEditing && product) {
        const updated = db.updateProduct(product.id, businessId, {
          title: title.trim(),
          description: description.trim(),
          price: numPrice,
          currency,
          image_url: imageUrl.trim() || '/src/assets/images/coffee_roaster_1790587302699.jpg',
          category: category.trim() || 'General',
          tags,
          in_stock: inStock,
          stock_quantity: parseInt(stockQuantity, 10) || 0,
          featured,
        });
        onSaved(updated);
      } else {
        const created = db.createProduct({
          business_id: businessId,
          title: title.trim(),
          description: description.trim(),
          price: numPrice,
          currency,
          image_url: imageUrl.trim() || '/src/assets/images/coffee_roaster_1790587302699.jpg',
          category: category.trim() || 'General',
          tags,
          in_stock: inStock,
          stock_quantity: parseInt(stockQuantity, 10) || 0,
          featured,
        });
        onSaved(created);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 text-stone-900 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-stone-900 leading-tight">
              {isEditing ? 'Edit Catalog Product' : 'Add Product to Catalog'}
            </h3>
            <p className="text-xs text-stone-500">
              List specific craft goods with transparent pricing and tags for patrons
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              Product Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Single-Origin Mount Elgon Bourbon (340g)"
              required
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
            />
          </div>

          {/* Price & Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="$">USD ($)</option>
                <option value="UGX">UGX (USh)</option>
                <option value="€">EUR (€)</option>
                <option value="£">GBP (£)</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Price *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-mono font-bold">
                  {currency}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full pl-8 pr-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              Category / Collection
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Whole Bean, Stoneware, Viennoiserie, Leather"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              Craft Narrative & Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe materials, tasting notes, dimensions, or how it is made..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 leading-relaxed"
            />
          </div>

          {/* Image Selection */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              Product Photo URL
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... or /src/assets/..."
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-9 h-9 rounded-lg object-cover border border-stone-200 shrink-0"
                />
              )}
            </div>

            {/* Quick preset thumbnail selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-[10px] text-stone-400 font-medium shrink-0">Presets:</span>
              {SAMPLE_PRODUCT_IMAGES.map((img) => (
                <button
                  key={img.label}
                  type="button"
                  onClick={() => setImageUrl(img.url)}
                  className={`px-2 py-0.8 rounded-md text-[10px] font-medium border shrink-0 transition ${
                    imageUrl === img.url
                      ? 'bg-orange-100 text-orange-800 border-orange-300 font-bold'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {img.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Tags */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              Product Tags & Badges
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag (e.g. Handmade, Single-Origin)"
                className="flex-1 px-3.5 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => handleAddTag()}
                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Selected Tags list */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full bg-orange-50 text-orange-900 border border-orange-200 text-[11px] font-medium"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-red-600 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1 pt-1">
              {PRESET_TAG_SUGGESTIONS.filter((s) => !tags.includes(s)).slice(0, 5).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleAddTag(s)}
                  className="px-2 py-0.5 rounded-md bg-stone-50 hover:bg-orange-50 text-stone-500 hover:text-orange-700 text-[10px] border border-stone-200 transition"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          {/* Stock & Featured Toggles */}
          <div className="pt-2 border-t border-stone-100 grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
              />
              <div>
                <p className="text-xs font-bold text-stone-900">In Stock</p>
                <p className="text-[10px] text-stone-500">Available to order</p>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
              />
              <div>
                <p className="text-xs font-bold text-stone-900">Featured</p>
                <p className="text-[10px] text-stone-500">Pinned to top</p>
              </div>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-stone-600 hover:bg-stone-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Save Changes' : 'Publish Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
