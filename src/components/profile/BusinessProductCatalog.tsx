import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Tag,
  Sparkles,
  CheckCircle2,
  XCircle,
  Eye,
  MessageCircle,
  Edit2,
  Trash2,
  Filter,
  Check,
  ShoppingBag,
} from 'lucide-react';
import { Product, Profile } from '../../types';
import { db } from '../../lib/mockEngine';
import { useApp } from '../../context/AppContext';
import { ProductFormModal } from '../modals/ProductFormModal';
import { ProductDetailModal } from '../modals/ProductDetailModal';

interface BusinessProductCatalogProps {
  business: Profile;
  isOwner: boolean;
}

export const BusinessProductCatalog: React.FC<BusinessProductCatalogProps> = ({
  business,
  isOwner,
}) => {
  const { openChatWithUser, showToast } = useApp();

  const [products, setProducts] = useState<Product[]>(() => db.getProducts(business.id));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  // Refresh products list from db
  const reloadProducts = () => {
    setProducts(db.getProducts(business.id));
  };

  // Collect all unique tags across this business's products
  const allTags = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      p.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Stock filter
      if (inStockOnly && !p.in_stock) return false;

      // Tag filter
      if (selectedTag === 'featured' && !p.featured) return false;
      if (selectedTag !== 'all' && selectedTag !== 'featured') {
        if (!p.tags || !p.tags.includes(selectedTag)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesDesc = p.description?.toLowerCase().includes(q);
        const matchesCat = p.category?.toLowerCase().includes(q);
        const matchesTags = p.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesCat && !matchesTags) return false;
      }

      return true;
    });
  }, [products, inStockOnly, selectedTag, searchQuery]);

  const handleStockToggle = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    try {
      const updated = db.toggleProductStock(product.id, business.id);
      showToast(
        updated.in_stock ? `"${product.title}" is now In Stock` : `"${product.title}" marked Out of Stock`,
        'success'
      );
      reloadProducts();
      if (detailProduct?.id === product.id) {
        setDetailProduct(updated);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update stock', 'error');
    }
  };

  const handleInquire = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    openChatWithUser(
      business.id,
      `Hello! I'm interested in ordering "${product.title}" (${product.currency || '$'}${product.price.toFixed(2)}). Is this currently in stock and available for pickup/shipping?`
    );
  };

  const handleEdit = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setEditingProduct(product);
    setFormModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${product.title}" from catalog?`)) {
      try {
        db.deleteProduct(product.id, business.id);
        showToast('Product removed from catalog', 'info');
        reloadProducts();
        if (detailProduct?.id === product.id) {
          setDetailProduct(null);
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to delete product', 'error');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar: Title, Search, and Add CTA */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-stone-900">Product Catalog</h3>
                <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-xs font-mono font-bold">
                  {products.length} {products.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                Craft products, prices, and inventory distinct from social updates
              </p>
            </div>
          </div>

          {/* Owner Add Product Button */}
          {isOwner && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setFormModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          )}
        </div>

        {/* Search Bar & In-Stock Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-stone-100">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, materials, roast type..."
              className="w-full pl-8 pr-3.5 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-stone-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-700 text-xs"
              >
                ×
              </button>
            )}
          </div>

          <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700 font-medium cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-orange-600 focus:ring-orange-500"
            />
            <span>In Stock Only</span>
          </label>
        </div>

        {/* Tag Filters Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 -mx-1 px-1 text-[11px] scrollbar-none">
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition shrink-0 ${
              selectedTag === 'all'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Products ({products.length})
          </button>

          {products.some((p) => p.featured) && (
            <button
              onClick={() => setSelectedTag('featured')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition shrink-0 flex items-center gap-1 ${
                selectedTag === 'featured'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Featured</span>
            </button>
          )}

          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? 'all' : tag)}
              className={`px-2.5 py-1 rounded-lg font-medium transition shrink-0 flex items-center gap-1 ${
                selectedTag === tag
                  ? 'bg-orange-600 text-white font-bold shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Tag className="w-3 h-3 text-stone-400" />
              <span>{tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => setDetailProduct(product)}
              className="group bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-2xs hover:shadow-md hover:border-orange-300 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Product Image Cover */}
                <div className="relative aspect-16/10 bg-stone-900 overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />

                  {/* Stock status badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                    {product.in_stock ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600/90 text-white backdrop-blur-xs shadow-2xs">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>In Stock</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600/90 text-white backdrop-blur-xs shadow-2xs">
                        <XCircle className="w-3 h-3" />
                        <span>Sold Out</span>
                      </span>
                    )}

                    {product.featured && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-2xs">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Featured</span>
                      </span>
                    )}
                  </div>

                  {/* Price overlay on image bottom-right */}
                  <div className="absolute bottom-2.5 right-2.5 bg-black/75 backdrop-blur-xs px-2.5 py-0.8 rounded-lg text-white font-mono text-sm font-bold shadow-xs">
                    {product.currency || '$'}{product.price.toFixed(2)}
                  </div>

                  {/* Category badge */}
                  {product.category && (
                    <div className="absolute bottom-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/90 text-stone-800 shadow-2xs">
                        {product.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content Details */}
                <div className="p-3.5 space-y-2">
                  <h4 className="font-bold text-sm text-stone-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                    {product.title}
                  </h4>

                  {product.description && (
                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  )}

                  {/* Tags */}
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {product.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-100 text-stone-700"
                        >
                          #{tag}
                        </span>
                      ))}
                      {product.tags.length > 3 && (
                        <span className="text-[10px] text-stone-400 self-center">
                          +{product.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="p-3 pt-0 border-t border-stone-100 mt-2 flex items-center justify-between gap-1.5">
                {isOwner ? (
                  <div className="flex items-center justify-between w-full pt-2">
                    <button
                      type="button"
                      onClick={(e) => handleStockToggle(e, product)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition active:scale-95 ${
                        product.in_stock
                          ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {product.in_stock ? 'Set Sold Out' : 'Set In Stock'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleEdit(e, product)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition"
                        title="Edit product"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, product)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full pt-2">
                    <span className="text-[11px] text-stone-500 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-stone-400" />
                      <span>Tap for details</span>
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleInquire(e, product)}
                      className="px-3 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 text-xs font-semibold flex items-center gap-1 transition active:scale-95 shadow-2xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-orange-600" />
                      <span>Order Inquiry</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-stone-900">
              {searchQuery || selectedTag !== 'all' || inStockOnly
                ? 'No matching catalog products'
                : 'No products listed yet'}
            </h4>
            <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1">
              {searchQuery || selectedTag !== 'all' || inStockOnly
                ? 'Try clearing your search query or tag filter to view all available products.'
                : isOwner
                ? 'List your signature roast bags, ceramic tableware, bakery boxes, or bespoke leather goods with prices and tags.'
                : `${business.business_name} hasn't listed specific catalog products yet. Check their showcase feed above!`}
            </p>
          </div>

          {isOwner && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setFormModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>List First Product</span>
            </button>
          )}
        </div>
      )}

      {/* Product Form Modal (Create / Edit) */}
      {formModalOpen && (
        <ProductFormModal
          businessId={business.id}
          product={editingProduct}
          isOpen={formModalOpen}
          onClose={() => {
            setFormModalOpen(false);
            setEditingProduct(null);
          }}
          onSaved={() => {
            reloadProducts();
          }}
        />
      )}

      {/* Product Detail Modal */}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          business={business}
          isOpen={Boolean(detailProduct)}
          onClose={() => setDetailProduct(null)}
          isOwner={isOwner}
          onEdit={(p) => {
            setDetailProduct(null);
            setEditingProduct(p);
            setFormModalOpen(true);
          }}
          onDeleted={() => {
            reloadProducts();
          }}
          onStockToggled={(updated) => {
            setDetailProduct(updated);
            reloadProducts();
          }}
        />
      )}
    </div>
  );
};
