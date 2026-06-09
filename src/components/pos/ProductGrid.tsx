import { useState, useRef, useEffect } from 'react';
import { Search, Plus, Package, Scale, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../../types';
import { useApp } from '../../context/SupabaseAppContext';

interface ProductGridProps {
  onAddToCart: (product: Product, weight?: number) => void;
}

export function ProductGrid({ onAddToCart }: ProductGridProps) {
  const { state } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showWeightModal, setShowWeightModal] = useState<Product | null>(null);
  const [weight, setWeight] = useState('');
  const categoriesRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  const filteredProducts = state.products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.barcode && product.barcode.includes(searchTerm));
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.active;
  });

  const categories = ['All', ...Array.from(new Set(state.products.map(p => p.category)))];
  const isTouchMode = state.settings.interfaceMode === 'touch';

  const checkScrollButtons = () => {
    if (categoriesRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoriesRef.current;
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 5); // 5px tolerance
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const categoriesElement = categoriesRef.current;
    if (categoriesElement) {
      categoriesElement.addEventListener('scroll', checkScrollButtons);
      return () => categoriesElement.removeEventListener('scroll', checkScrollButtons);
    }
  }, [categories]);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoriesRef.current) {
      const scrollAmount = 200;
      const currentScroll = categoriesRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      categoriesRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  const handleProductClick = (product: Product) => {
    if (product.isWeightBased) {
      setShowWeightModal(product);
      setWeight('');
    } else {
      onAddToCart(product);
    }
  };

  const handleWeightSubmit = () => {
    if (showWeightModal && weight && parseFloat(weight) > 0) {
      onAddToCart(showWeightModal, parseFloat(weight));
      setShowWeightModal(null);
      setWeight('');
    }
  };

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-xl shadow-slate-200/60">
        {/* Search and Filter Bar */}
        <div className="border-b border-slate-100 bg-white p-4 lg:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Products</p>
              <h2 className="text-xl font-black tracking-tight text-slate-950">Choose items</h2>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600">
              {filteredProducts.length} visible / {state.products.length} total
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search products by name, SKU, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`input border-slate-200 bg-slate-50 pl-12 shadow-none focus:bg-white ${isTouchMode ? 'h-14 text-lg' : 'h-12'}`}
              />
            </div>
            
            <div className="relative flex items-center">
              {/* Left scroll button */}
              {showLeftScroll && (
                <button
                  onClick={() => scrollCategories('left')}
                  className="absolute left-0 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md transition-all hover:bg-slate-50"
                  style={{ transform: 'translateX(-50%)' }}
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600" />
                </button>
              )}

              {/* Categories container */}
              <div 
                ref={categoriesRef}
                className="flex max-w-xl overflow-x-auto scroll-smooth space-x-2 px-6 scrollbar-hide lg:space-x-3"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                  className={`btn flex-shrink-0 whitespace-nowrap transition-all ${
                      selectedCategory === category
                        ? 'btn-primary'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    } ${isTouchMode ? 'btn-lg touch-friendly' : 'btn-md'}`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Right scroll button */}
              {showRightScroll && (
                <button
                  onClick={() => scrollCategories('right')}
                  className="absolute right-0 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md transition-all hover:bg-slate-50"
                  style={{ transform: 'translateX(50%)' }}
                >
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-auto bg-slate-50/70 p-4 lg:p-5">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="mb-4 rounded-3xl bg-blue-50 p-6">
                <Package className="h-16 w-16 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg font-medium">No products found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className={`grid gap-4 lg:gap-6 ${
              isTouchMode 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
            }`}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleProductClick}
                  isTouchMode={isTouchMode}
                  currency={state.settings.currency}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weight Input Modal */}
      {showWeightModal && (
        <div className="modal-overlay">
          <div className="modal max-w-sm">
            <div className="modal-header">
              <h3 className="text-lg font-bold text-gray-900">Enter Weight</h3>
              <button
                onClick={() => setShowWeightModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="modal-body space-y-4">
              <div className="text-center">
                <div className="bg-blue-100 p-4 rounded-2xl mb-4">
                  <Scale className="h-8 w-8 text-blue-600 mx-auto" />
                </div>
                <h4 className="font-semibold text-gray-900">{showWeightModal.name}</h4>
                <p className="text-sm text-gray-600">
                  {state.settings.currency} {showWeightModal.pricePerUnit?.toFixed(2)} per {showWeightModal.unit}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight ({showWeightModal.unit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="input"
                  placeholder={`Enter weight in ${showWeightModal.unit}`}
                  autoFocus
                />
              </div>
              
              {weight && parseFloat(weight) > 0 && (
                <div className="bg-blue-50 p-3 rounded-xl">
                  <div className="flex justify-between text-sm">
                    <span>Total Price:</span>
                    <span className="font-semibold">
                      {state.settings.currency} {((showWeightModal.pricePerUnit || 0) * parseFloat(weight)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button
                onClick={() => setShowWeightModal(null)}
                className="btn btn-secondary btn-md"
              >
                Cancel
              </button>
              <button
                onClick={handleWeightSubmit}
                disabled={!weight || parseFloat(weight) <= 0}
                className="btn btn-primary btn-md disabled:opacity-50"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  isTouchMode: boolean;
  currency: string;
}

function ProductCard({ product, onAddToCart, isTouchMode, currency }: ProductCardProps) {
  // Only check stock levels if inventory tracking is enabled
  // Default to true if trackInventory is undefined (for backwards compatibility)
  const shouldTrackInventory = product.trackInventory !== false;
  const isLowStock = shouldTrackInventory ? product.stock <= product.minStock : false;
  const isOutOfStock = shouldTrackInventory ? product.stock === 0 : false;

  return (
    <div
      className={`group cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg ${
        isLowStock && !isOutOfStock ? 'border-orange-200 bg-orange-50/70' : ''
      } ${isOutOfStock ? 'border-red-200 bg-red-50/80 opacity-75' : ''} ${
        isTouchMode ? 'p-4' : 'p-3'
      }`}
      onClick={() => !isOutOfStock && onAddToCart(product)}
    >
      <div className="flex flex-col h-full">
        {/* Product Image */}
        <div className={`relative mb-4 flex items-center justify-center overflow-hidden rounded-2xl bg-slate-100 ${
          isTouchMode ? 'h-32' : 'h-24'
        }`}>
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name} 
              className="h-full w-full rounded-2xl object-cover transition-transform duration-300 group-hover:scale-105" 
            />
          ) : (
            <Package className={`text-blue-300 ${isTouchMode ? 'h-10 w-10' : 'h-8 w-8'}`} />
          )}
          
          {/* Weight-based indicator */}
          {product.isWeightBased && (
            <div className="absolute left-2 top-2 flex items-center space-x-1 rounded-full bg-blue-600 px-2 py-1 text-xs font-semibold text-white shadow-lg shadow-blue-500/20">
              <Scale className="h-3 w-3" />
              <span>{product.unit}</span>
            </div>
          )}
          
          {/* Stock Status Badge */}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
              <span className="text-white font-semibold text-sm">Out of Stock</span>
            </div>
          )}
          
          {isLowStock && !isOutOfStock && (
            <div className="absolute bottom-2 right-2 rounded-full bg-orange-500 px-2 py-1 text-xs font-semibold text-white shadow-lg shadow-orange-500/20">
              Low Stock
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="flex-1 space-y-2">
          <h3 className={`font-semibold text-gray-900 line-clamp-2 ${
            isTouchMode ? 'text-base' : 'text-sm'
          }`}>
            {product.name}
          </h3>
          
          <p className={`font-medium text-gray-400 ${isTouchMode ? 'text-sm' : 'text-xs'}`}>
            SKU: {product.sku}
          </p>
          
          <div className="flex items-end justify-between gap-3">
            <span className={`font-bold text-blue-600 ${isTouchMode ? 'text-lg' : 'text-base'}`}>
              {currency} {product.isWeightBased ? product.pricePerUnit?.toFixed(2) : product.price.toFixed(2)}
              {product.isWeightBased && <span className="text-xs text-gray-500">/{product.unit}</span>}
            </span>
            <span className={`rounded-full bg-slate-100 px-2 py-1 text-right text-gray-500 ${
              isLowStock ? 'text-orange-600 font-medium' : ''
            } ${isTouchMode ? 'text-sm' : 'text-xs'}`}>
              {shouldTrackInventory 
                ? `Stock: ${product.stock}${product.isWeightBased ? product.unit : ''}`
                : 'Unlimited stock'
              }
            </span>
          </div>
        </div>
        
        {/* Add to Cart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isOutOfStock) onAddToCart(product);
          }}
          disabled={isOutOfStock}
          className={`mt-4 flex w-full items-center justify-center space-x-2 rounded-2xl bg-slate-950 font-bold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 ${
            isTouchMode ? 'btn-lg touch-friendly' : 'btn-md'
          }`}
        >
          {product.isWeightBased ? <Scale className={`${isTouchMode ? 'h-5 w-5' : 'h-4 w-4'}`} /> : <Plus className={`${isTouchMode ? 'h-5 w-5' : 'h-4 w-4'}`} />}
          <span>{isOutOfStock ? 'Out of Stock' : product.isWeightBased ? 'Enter Weight' : 'Add to Cart'}</span>
        </button>
      </div>
    </div>
  );
}