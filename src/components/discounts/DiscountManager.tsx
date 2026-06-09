import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Percent,
  Gift,
  Calendar,
  Users,
  BadgePercent,
  Sparkles,
  ToggleLeft,
  Tags,
} from 'lucide-react';
import { Discount } from '../../types';
import { useApp } from '../../context/SupabaseAppContext';
import { DiscountModal } from './DiscountModal';
import { format } from 'date-fns';
import { swalConfig } from '../../lib/sweetAlert';

export function DiscountManager() {
  const { state, dispatch } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

  const filteredDiscounts = state.discounts.filter(discount => {
    const search = searchTerm.toLowerCase();

    return (
      discount.name.toLowerCase().includes(search) ||
      discount.description.toLowerCase().includes(search)
    );
  });

  const activeDiscounts = state.discounts.filter(d => d.active).length;
  const percentageDiscounts = state.discounts.filter(d => d.type === 'percentage').length;
  const freeGiftOffers = state.discounts.filter(d => d.type === 'free_gift').length;

  const handleEditDiscount = (discount: Discount) => {
    setEditingDiscount(discount);
    setShowDiscountModal(true);
  };

  const handleDeleteDiscount = async (discountId: string) => {
    const result = await swalConfig.deleteConfirm('discount');

    if (result.isConfirmed) {
      try {
        swalConfig.loading('Deleting discount...');

        const { discountsService } = await import('../../lib/services');

        await discountsService.delete(discountId);

        dispatch({ type: 'DELETE_DISCOUNT', payload: discountId });

        swalConfig.success('Discount deleted successfully!');
      } catch (error) {
        console.error('Error deleting discount:', error);
        swalConfig.error('Failed to delete discount. Please try again.');
      }
    }
  };

  const handleAddDiscount = () => {
    setEditingDiscount(null);
    setShowDiscountModal(true);
  };

  const toggleDiscountStatus = async (discount: Discount) => {
    try {
      swalConfig.loading(
        `${discount.active ? 'Deactivating' : 'Activating'} discount...`
      );

      const updatedDiscount = {
        ...discount,
        active: !discount.active,
      };

      const { discountsService } = await import('../../lib/services');

      await discountsService.update(discount.id, updatedDiscount);

      dispatch({
        type: 'UPDATE_DISCOUNT',
        payload: updatedDiscount,
      });

      swalConfig.success(
        `Discount ${discount.active ? 'deactivated' : 'activated'} successfully!`
      );
    } catch (error) {
      console.error('Error updating discount:', error);
      swalConfig.error('Failed to update discount. Please try again.');
    }
  };

  const getDiscountTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage':
      case 'fixed':
        return <Percent className="h-4 w-4" />;
      case 'free_gift':
        return <Gift className="h-4 w-4" />;
      default:
        return <Percent className="h-4 w-4" />;
    }
  };

  const getDiscountTypeColor = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'bg-blue-50 text-blue-700 ring-blue-100';
      case 'fixed':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
      case 'free_gift':
        return 'bg-purple-50 text-purple-700 ring-purple-100';
      default:
        return 'bg-slate-50 text-slate-700 ring-slate-100';
    }
  };

  const getDiscountValue = (discount: Discount) => {
    if (discount.type === 'percentage') return `${discount.value}%`;
    if (discount.type === 'fixed') return `${state.settings.currency} ${discount.value}`;
    if (discount.type === 'free_gift') return 'Free Gift';

    return discount.value;
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
                Promotions
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">
                Discounts & Offers
              </h1>

              <p className="mt-1 text-sm font-medium text-blue-100/80">
                Manage automatic discounts, fixed offers and free gift promotions.
              </p>
            </div>

            <button
              onClick={handleAddDiscount}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-950 shadow-xl shadow-black/10 transition-all hover:-translate-y-0.5 hover:bg-blue-50"
            >
              <Plus className="h-5 w-5" />
              Add Discount
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DiscountStatCard
              icon={BadgePercent}
              label="Total Discounts"
              value={state.discounts.length.toString()}
              tone="blue"
            />

            <DiscountStatCard
              icon={Sparkles}
              label="Active Discounts"
              value={activeDiscounts.toString()}
              tone="emerald"
            />

            <DiscountStatCard
              icon={Percent}
              label="Percentage Discounts"
              value={percentageDiscounts.toString()}
              tone="purple"
            />

            <DiscountStatCard
              icon={Gift}
              label="Free Gift Offers"
              value={freeGiftOffers.toString()}
              tone="amber"
            />
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/80 bg-white/85 p-4 shadow-xl shadow-slate-200/70 backdrop-blur-2xl lg:p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Search className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-black text-slate-900">Search Discounts</h2>
            <p className="text-xs font-semibold text-slate-500">
              Search by discount name or description
            </p>
          </div>
        </div>

        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            placeholder="Search discounts..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-xl shadow-slate-200/70">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-black text-slate-900">Discount List</h2>
            <p className="text-sm font-medium text-slate-500">
              Showing {filteredDiscounts.length} discount
              {filteredDiscounts.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600">
            <Tags className="h-4 w-4" />
            Promotions
          </div>
        </div>

        {filteredDiscounts.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
              <BadgePercent className="h-8 w-8" />
            </div>

            <h3 className="mt-4 text-lg font-black text-slate-900">
              No discounts found
            </h3>

            <p className="mt-1 max-w-md text-sm font-medium text-slate-500">
              Try changing your search term or create a new discount offer.
            </p>

            <button
              onClick={handleAddDiscount}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Discount
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <TableHead>Discount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredDiscounts.map(discount => (
                  <tr
                    key={discount.id}
                    className="transition-colors hover:bg-blue-50/40"
                  >
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                          {discount.type === 'free_gift' ? (
                            <Gift className="h-5 w-5 text-purple-600" />
                          ) : (
                            <Percent className="h-5 w-5 text-blue-600" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="max-w-[280px] truncate text-sm font-black text-slate-900">
                            {discount.name}
                          </p>

                          <p className="max-w-[280px] truncate text-xs font-semibold text-slate-400">
                            {discount.description || 'No description'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${getDiscountTypeColor(
                          discount.type
                        )}`}
                      >
                        {getDiscountTypeIcon(discount.type)}
                        {discount.type.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="text-sm font-black text-slate-900">
                        {getDiscountValue(discount)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                        <Users className="h-3.5 w-3.5" />
                        {discount.conditions.length} condition
                        {discount.conditions.length !== 1 ? 's' : ''}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-start gap-2">
                        <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />

                        <div className="text-xs">
                          <p className="font-black text-slate-900">
                            {format(new Date(discount.validFrom), 'MMM dd, yyyy')}
                          </p>
                          <p className="mt-0.5 font-semibold text-slate-500">
                            to {format(new Date(discount.validTo), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <button
                        onClick={() => toggleDiscountStatus(discount)}
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ring-1 transition-all hover:-translate-y-0.5 ${
                          discount.active
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-100 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 ring-rose-100 hover:bg-rose-100'
                        }`}
                      >
                        <ToggleLeft className="h-3.5 w-3.5" />
                        {discount.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditDiscount(discount)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition-all hover:bg-blue-600 hover:text-white"
                          title="Edit discount"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteDiscount(discount.id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 transition-all hover:bg-rose-600 hover:text-white"
                          title="Delete discount"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <DiscountModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        discount={editingDiscount}
      />
    </div>
  );
}

interface DiscountStatCardProps {
  icon: typeof Percent;
  label: string;
  value: string;
  tone: 'blue' | 'emerald' | 'purple' | 'amber';
}

function DiscountStatCard({
  icon: Icon,
  label,
  value,
  tone,
}: DiscountStatCardProps) {
  const toneClasses = {
    blue: 'bg-blue-500/15 text-blue-200 ring-blue-300/25',
    emerald: 'bg-emerald-500/15 text-emerald-200 ring-emerald-300/25',
    purple: 'bg-purple-500/15 text-purple-200 ring-purple-300/25',
    amber: 'bg-amber-500/15 text-amber-200 ring-amber-300/25',
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