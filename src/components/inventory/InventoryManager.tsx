import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Filter,
  Boxes,
  Tags,
  DollarSign,
} from 'lucide-react';
import { Product } from '../../types';
import { useApp } from '../../context/SupabaseAppContext';
import { ProductModal } from './ProductModal';
import { swalConfig } from '../../lib/sweetAlert';

export function InventoryManager() {
  const { state } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const categories = [
    'All',
    ...Array.from(new Set(state.products.map((p: Product) => p.category))),
  ];

  const filteredProducts = state.products
    .filter(product => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'stock':
          aValue = a.stock;
          bValue = b.stock;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }

      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    });

  const lowStockProducts = state.products.filter(
    (p: Product) => p.trackInventory && p.stock <= p.minStock
  );

  const totalValue = state.products.reduce(
    (sum: number, p: Product) => sum + p.stock * p.cost,
    0
  );

  const outOfStockProducts = state.products.filter(
    (p: Product) => p.trackInventory && p.stock === 0
  );

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    const result = await swalConfig.deleteConfirm('product');

    if (result.isConfirmed) {
      try {
        swalConfig.loading('Deleting product...');

        const { productsService } = await import('../../lib/services');

        await productsService.delete(productId);

        window.location.reload();

        swalConfig.success('Product deleted successfully!');
      } catch (error) {
        console.error('Error deleting product:', error);
        swalConfig.error('Failed to delete product. Please try again.');
      }
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  return (
    <div className="min-h-full space-y-5 bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 p-4 lg:p-6">
      <section className="relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-slate-950 via-blue-950 to-sky-800 p-5 shadow-2xl shadow-blue-950/20 lg:p-6">
        <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-sky-400/25 blur-3xl" />
        <div className="absolute -right-20 -bottom-24 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute left-1/2 top-0 h-32 w-72 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex flex-col gap-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-200">
                Stock Control
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">
                Inventory Management
              </h1>

              <p className="mt-1 text-sm font-medium text-blue-100/80">
                Manage products, categories, pricing and stock levels.
              </p>
            </div>

            <button
              onClick={handleAddProduct}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-950 shadow-xl shadow-black/10 transition-all hover:-translate-y-0.5 hover:bg-blue-50"
            >
              <Plus className="h-5 w-5" />
              Add Product
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InventoryStatCard
              icon={Package}
              label="Total Products"
              value={state.products.length.toString()}
              tone="blue"
            />

            <InventoryStatCard
              icon={AlertTriangle}
              label="Low Stock Items"
              value={lowStockProducts.length.toString()}
              tone="amber"
            />

            <InventoryStatCard
              icon={TrendingUp}
              label="Inventory Value"
              value={`${state.settings.currency || '$'} ${totalValue.toFixed(2)}`}
              tone="emerald"
            />

            <InventoryStatCard
              icon={TrendingDown}
              label="Out of Stock"
              value={outOfStockProducts.length.toString()}
              tone="rose"
            />
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/80 bg-white/85 p-4 shadow-xl shadow-slate-200/70 backdrop-blur-2xl lg:p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Filter className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-black text-slate-900">Filters</h2>
            <p className="text-xs font-semibold text-slate-500">
              Search, category and sorting controls
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_220px_220px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="Search product name or SKU..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={e => {
              const [field, order] = e.target.value.split('-');

              setSortBy(field as 'name' | 'stock' | 'price');
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          >
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="stock-asc">Stock Low-High</option>
            <option value="stock-desc">Stock High-Low</option>
            <option value="price-asc">Price Low-High</option>
            <option value="price-desc">Price High-Low</option>
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-xl shadow-slate-200/70">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-black text-slate-900">Products</h2>
            <p className="text-sm font-medium text-slate-500">
              Showing {filteredProducts.length} product
              {filteredProducts.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600">
            <Boxes className="h-4 w-4" />
            {selectedCategory === 'All' ? 'All Categories' : selectedCategory}
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
              <Package className="h-8 w-8" />
            </div>

            <h3 className="mt-4 text-lg font-black text-slate-900">
              No products found
            </h3>

            <p className="mt-1 max-w-md text-sm font-medium text-slate-500">
              Try changing your search term or category filter, or add a new product.
            </p>

            <button
              onClick={handleAddProduct}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredProducts.map(product => {
                  const isLowStock =
                    product.trackInventory && product.stock <= product.minStock;

                  const isOutOfStock =
                    product.trackInventory && product.stock === 0;

                  const stockStatus = !product.trackInventory
                    ? 'Not Tracked'
                    : isOutOfStock
                      ? 'Out of Stock'
                      : isLowStock
                        ? 'Low Stock'
                        : 'In Stock';

                  return (
                    <tr
                      key={product.id}
                      className="transition-colors hover:bg-blue-50/40"
                    >
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                            <Package className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <p className="max-w-[260px] truncate text-sm font-black text-slate-900">
                              {product.name}
                            </p>

                            <p className="max-w-[260px] truncate text-xs font-semibold text-slate-400">
                              {product.description || 'No description'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="rounded-xl bg-slate-100 px-3 py-1 font-mono text-xs font-black text-slate-700">
                          {product.sku}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-100">
                          <Tags className="h-3.5 w-3.5" />
                          {product.category}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-1 text-sm font-black text-slate-900">
                          {state.settings.currency || '$'} {product.price.toFixed(2)}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="text-sm font-bold text-slate-500">
                          {state.settings.currency || '$'} {product.cost.toFixed(2)}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-black ${
                              isOutOfStock
                                ? 'text-rose-600'
                                : isLowStock
                                  ? 'text-amber-600'
                                  : 'text-slate-900'
                            }`}
                          >
                            {product.trackInventory ? product.stock : '—'}
                          </span>

                          {isLowStock && (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                        </div>

                        {product.trackInventory && (
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            Min: {product.minStock}
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${
                            isOutOfStock
                              ? 'bg-rose-50 text-rose-700 ring-rose-100'
                              : isLowStock
                                ? 'bg-amber-50 text-amber-700 ring-amber-100'
                                : !product.trackInventory
                                  ? 'bg-slate-50 text-slate-600 ring-slate-100'
                                  : 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                          }`}
                        >
                          {stockStatus}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition-all hover:bg-blue-600 hover:text-white"
                            title="Edit product"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 transition-all hover:bg-rose-600 hover:text-white"
                            title="Delete product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ProductModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        product={editingProduct}
      />
    </div>
  );
}

interface InventoryStatCardProps {
  icon: typeof Package;
  label: string;
  value: string;
  tone: 'blue' | 'amber' | 'emerald' | 'rose';
}

function InventoryStatCard({
  icon: Icon,
  label,
  value,
  tone,
}: InventoryStatCardProps) {
  const toneClasses = {
    blue: 'bg-blue-500/15 text-blue-200 ring-blue-300/25',
    amber: 'bg-amber-500/15 text-amber-200 ring-amber-300/25',
    emerald: 'bg-emerald-500/15 text-emerald-200 ring-emerald-300/25',
    rose: 'bg-rose-500/15 text-rose-200 ring-rose-300/25',
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-4 shadow-lg backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/15">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex items-center gap-4">
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ring-1 ${toneClasses[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-100/70">
            {label}
          </p>

          <p className="mt-1 truncate text-xl font-black leading-tight text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
}

function TableHead({ children, className = '' }: TableHeadProps) {
  return (
    <th
      className={`px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 ${className}`}
    >
      {children}
    </th>
  );
}