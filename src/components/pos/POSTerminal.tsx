import { useState } from 'react';
import { ProductGrid } from './ProductGrid';
import { Cart } from './Cart';
import { CheckoutModal } from './CheckoutModal';
import { SalesTabManager } from './SalesTabManager';
import { Product, Sale } from '../../types';
import { useApp } from '../../context/SupabaseAppContext';
import { useAuth } from '../../context/AuthContext';
import { salesService } from '../../lib/services';
import { swalConfig } from '../../lib/sweetAlert';
import {
  Package,
  Receipt,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Store,
} from 'lucide-react';

export function POSTerminal() {
  const { state, dispatch } = useApp();
  const { user } = useAuth();

  const [showCheckout, setShowCheckout] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const activeProducts = state.products.filter(product => product.active).length;
  const cartItemCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  const today = new Date().toDateString();
  const todaysSales = state.sales.filter(
    sale => new Date(sale.timestamp).toDateString() === today
  );

  const todaysRevenue = todaysSales.reduce((sum, sale) => sum + sale.total, 0);

  const addToCart = (product: Product, weight?: number) => {
    if (product.trackInventory && product.stock <= 0) return;

    const existingItemIndex = state.cart.findIndex(
      item =>
        item.product.id === product.id &&
        (product.isWeightBased ? false : true)
    );

    if (existingItemIndex >= 0 && !product.isWeightBased) {
      const existingItem = state.cart[existingItemIndex];
      const newQuantity = existingItem.quantity + 1;

      if (!product.trackInventory || newQuantity <= product.stock) {
        const updatedItem = {
          ...existingItem,
          quantity: newQuantity,
          subtotal: product.price * newQuantity - (existingItem.discount || 0),
        };

        dispatch({
          type: 'UPDATE_CART_ITEM',
          payload: { index: existingItemIndex, item: updatedItem },
        });
      }
    } else {
      const quantity = 1;
      const itemWeight = weight || undefined;

      const price = product.isWeightBased
        ? (product.pricePerUnit || 0) * (weight || 1)
        : product.price;

      const newItem = {
        product,
        quantity,
        weight: itemWeight,
        discount: 0,
        discountType: 'percentage' as const,
        subtotal: price,
      };

      dispatch({ type: 'ADD_TO_CART', payload: newItem });
    }

    if (state.activeSalesTab) {
      dispatch({
        type: 'UPDATE_SALES_TAB',
        payload: {
          id: state.activeSalesTab,
          updates: { cart: state.cart },
        },
      });
    }
  };

  const handleCheckout = () => {
    setShowCheckout(true);
  };

  const handleCheckoutComplete = (sale: Sale) => {
    setLastSale(sale);
    setShowCheckout(false);

    if (state.activeSalesTab) {
      dispatch({
        type: 'UPDATE_SALES_TAB',
        payload: {
          id: state.activeSalesTab,
          updates: { cart: [], selectedCustomer: null },
        },
      });
    }
  };

  const saveDraft = async () => {
    if (state.cart.length === 0) return;

    try {
      const subtotal = state.cart.reduce((sum, item) => {
        const price = item.product.isWeightBased
          ? (item.product.pricePerUnit || 0) * (item.weight || 1)
          : item.product.price;

        return sum + price * item.quantity;
      }, 0);

      const totalDiscount = state.cart.reduce(
        (sum, item) => sum + (item.discount || 0),
        0
      );

      const taxAmount =
        (subtotal - totalDiscount) * (state.settings.taxRate / 100);

      const total = subtotal - totalDiscount + taxAmount;

      const draftCode = Date.now().toString().slice(-6);

      const draftSale: Omit<Sale, 'id'> = {
        invoiceNumber: `DRAFT-${draftCode}`,
        customerId: state.selectedCustomer?.id,
        customerName: state.selectedCustomer?.name,
        items: state.cart,
        subtotal,
        discountAmount: totalDiscount,
        taxAmount,
        total,
        paymentMethod: 'cash',
        status: 'completed',
        cashier: user?.user_metadata?.full_name || user?.email || 'Unknown',
        timestamp: new Date(),
        receiptNumber: `DRAFT-${draftCode}`,
        notes: 'DRAFT_SALE - payment pending',
      };

      const savedDraft = await salesService.create(draftSale);

      dispatch({ type: 'ADD_SALE', payload: savedDraft });
      dispatch({ type: 'CLEAR_CART' });

      if (state.activeSalesTab) {
        dispatch({
          type: 'UPDATE_SALES_TAB',
          payload: {
            id: state.activeSalesTab,
            updates: { cart: [], selectedCustomer: null },
          },
        });
      }

      swalConfig.success('Draft sale saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      swalConfig.error('Failed to save draft. Please try again.');
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 p-3 lg:p-5">
      <div className="flex h-full w-full gap-4 overflow-hidden">
        <SalesTabManager />

        <main className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden">
          <section className="relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-slate-950 via-blue-950 to-sky-800 p-4 shadow-2xl shadow-blue-950/20 lg:p-5">
            <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-sky-400/25 blur-3xl" />
            <div className="absolute -right-20 -bottom-24 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl" />
            <div className="absolute left-1/2 top-0 h-32 w-72 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />

            <div className="relative flex flex-col gap-4">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur-xl">
                    <Store className="h-6 w-6 text-white" />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-200">
                      POS Terminal
                    </p>
                    <h1 className="mt-1 text-2xl font-black tracking-tight text-white lg:text-3xl">
                      New Sale
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-xl">
                  <TrendingUp className="h-4 w-4 text-emerald-300" />
                  <span className="text-sm font-bold text-white">
                    Today Revenue:
                  </span>
                  <span className="text-sm font-black text-emerald-200">
                    {state.settings.currency} {todaysRevenue.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <DashboardStat
                  icon={Package}
                  label="Products"
                  value={activeProducts.toString()}
                  tone="blue"
                />

                <DashboardStat
                  icon={ShoppingCart}
                  label="Cart Items"
                  value={cartItemCount.toString()}
                  tone="emerald"
                />

                <DashboardStat
                  icon={Receipt}
                  label="Today Sales"
                  value={todaysSales.length.toString()}
                  tone="purple"
                />

                <DashboardStat
                  icon={Sparkles}
                  label="Revenue"
                  value={`${state.settings.currency} ${todaysRevenue.toFixed(2)}`}
                  tone="amber"
                />
              </div>
            </div>
          </section>

          <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="min-h-0 overflow-hidden rounded-[28px] border border-white/80 bg-white/80 shadow-xl shadow-slate-200/70 backdrop-blur-2xl">
              <ProductGrid onAddToCart={addToCart} />
            </div>

            <div className="min-h-0 overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-xl shadow-slate-200/70 backdrop-blur-2xl">
              <Cart onCheckout={handleCheckout} onSaveDraft={saveDraft} />
            </div>
          </section>

          <CheckoutModal
            isOpen={showCheckout}
            onClose={() => setShowCheckout(false)}
            onComplete={handleCheckoutComplete}
          />
        </main>
      </div>
    </div>
  );
}

interface DashboardStatProps {
  icon: typeof Package;
  label: string;
  value: string;
  tone: 'blue' | 'emerald' | 'purple' | 'amber';
}

function DashboardStat({ icon: Icon, label, value, tone }: DashboardStatProps) {
  const toneClasses = {
    blue: {
      icon: 'bg-blue-500/15 text-blue-200 ring-blue-300/25',
      glow: 'from-blue-400/25',
    },
    emerald: {
      icon: 'bg-emerald-500/15 text-emerald-200 ring-emerald-300/25',
      glow: 'from-emerald-400/25',
    },
    purple: {
      icon: 'bg-purple-500/15 text-purple-200 ring-purple-300/25',
      glow: 'from-purple-400/25',
    },
    amber: {
      icon: 'bg-amber-500/15 text-amber-200 ring-amber-300/25',
      glow: 'from-amber-400/25',
    },
  };

  const selectedTone = toneClasses[tone];

  return (
    <div className="group relative min-h-[94px] overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-4 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15">
      <div
        className={`absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${selectedTone.glow} to-transparent blur-2xl`}
      />

      <div className="relative flex h-full items-center gap-3">
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ring-1 ${selectedTone.icon}`}
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