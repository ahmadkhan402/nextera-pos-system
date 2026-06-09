import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  CreditCard,
  Eye,
  Users,
  Wallet,
  Activity,
  Crown,
} from 'lucide-react';
import { Customer } from '../../types';
import { useApp } from '../../context/SupabaseAppContext';
import { CustomerModal } from './CustomerModal';
import { CustomerDetailModal } from './CustomerDetailModal';
import { swalConfig } from '../../lib/sweetAlert';

export function CustomerManager() {
  const { state, dispatch } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  const filteredCustomers = state.customers.filter((customer: Customer) => {
    const search = searchTerm.toLowerCase();

    return (
      customer.name.toLowerCase().includes(search) ||
      (customer.email ?? '').toLowerCase().includes(search) ||
      (customer.phone ?? '').includes(searchTerm)
    );
  });

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowCustomerModal(true);
  };

  const handleViewCustomer = (customer: Customer) => {
    setViewingCustomer(customer);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    const result = await swalConfig.deleteConfirm('customer');

    if (result.isConfirmed) {
      try {
        swalConfig.loading('Deleting customer...');

        const { customersService } = await import('../../lib/services');

        await customersService.delete(customerId);

        dispatch({ type: 'DELETE_CUSTOMER', payload: customerId });

        swalConfig.success('Customer deleted successfully!');
      } catch (error) {
        console.error('Error deleting customer:', error);
        swalConfig.error('Failed to delete customer. Please try again.');
      }
    }
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setShowCustomerModal(true);
  };

  const totalCustomers = state.customers.length;

  const totalPurchases = state.customers.reduce(
    (sum: number, c: Customer) => sum + c.totalPurchases,
    0
  );

  const averagePurchase = totalCustomers > 0 ? totalPurchases / totalCustomers : 0;

  const activeCustomers = state.customers.filter(
    (c: Customer) =>
      c.lastPurchase &&
      new Date().getTime() - new Date(c.lastPurchase).getTime() <
        30 * 24 * 60 * 60 * 1000
  ).length;

  return (
    <div className="min-h-full space-y-5 bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 p-4 md:p-6">
      <section className="relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-slate-950 via-blue-950 to-sky-800 p-5 shadow-2xl shadow-blue-950/20 md:p-6">
        <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-sky-400/25 blur-3xl" />
        <div className="absolute -right-20 -bottom-24 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute left-1/2 top-0 h-32 w-72 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex flex-col gap-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-200">
                Customer CRM
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">
                Customers
              </h1>

              <p className="mt-1 text-sm font-medium text-blue-100/80">
                Manage customer profiles, purchase history and price tiers.
              </p>
            </div>

            <button
              onClick={handleAddCustomer}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-950 shadow-xl shadow-black/10 transition-all hover:-translate-y-0.5 hover:bg-blue-50"
            >
              <Plus className="h-5 w-5" />
              Add Customer
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <CustomerStatCard
              icon={Users}
              label="Total Customers"
              value={totalCustomers.toString()}
              tone="blue"
            />

            <CustomerStatCard
              icon={Wallet}
              label="Total Purchases"
              value={`${state.settings.currency || '$'} ${totalPurchases.toFixed(2)}`}
              tone="emerald"
            />

            <CustomerStatCard
              icon={CreditCard}
              label="Average Purchase"
              value={`${state.settings.currency || '$'} ${averagePurchase.toFixed(2)}`}
              tone="purple"
            />

            <CustomerStatCard
              icon={Activity}
              label="Active 30 Days"
              value={activeCustomers.toString()}
              tone="amber"
            />
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/80 bg-white/85 p-4 shadow-xl shadow-slate-200/70 backdrop-blur-2xl md:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="Search customer name, email or phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <button
            onClick={handleAddCustomer}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            Add Customer
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-xl shadow-slate-200/70">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-black text-slate-900">Customer List</h2>

            <p className="text-sm font-medium text-slate-500">
              Showing {filteredCustomers.length} customer
              {filteredCustomers.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600">
            <User className="h-4 w-4" />
            CRM Records
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
              <Users className="h-8 w-8" />
            </div>

            <h3 className="mt-4 text-lg font-black text-slate-900">
              No customers found
            </h3>

            <p className="mt-1 max-w-md text-sm font-medium text-slate-500">
              Try changing your search term or create a new customer profile.
            </p>

            <button
              onClick={handleAddCustomer}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Customer
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Total Purchases</TableHead>
                  <TableHead>Price Tier</TableHead>
                  <TableHead className="hidden sm:table-cell">Last Purchase</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredCustomers.map((customer: Customer) => (
                  <tr
                    key={customer.id}
                    className="transition-colors hover:bg-blue-50/40"
                  >
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-100">
                          <User className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="max-w-[240px] truncate text-sm font-black text-slate-900">
                            {customer.name}
                          </p>

                          <p className="max-w-[240px] truncate text-xs font-semibold text-slate-400">
                            ID: {customer.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex max-w-xs items-center gap-2 truncate text-sm font-bold text-slate-900">
                          <Mail className="h-4 w-4 flex-shrink-0 text-slate-400" />
                          <span className="truncate">
                            {customer.email || 'No email'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                          <Phone className="h-4 w-4 flex-shrink-0 text-slate-400" />
                          {customer.phone || 'No phone'}
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="text-sm font-black text-slate-900">
                        {state.settings.currency || '$'}{' '}
                        {customer.totalPurchases.toFixed(2)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-100">
                        <Crown className="h-3.5 w-3.5" />
                        {customer.priceTier}
                      </span>
                    </td>

                    <td className="hidden whitespace-nowrap px-5 py-4 text-sm font-bold text-slate-700 sm:table-cell">
                      {customer.lastPurchase
                        ? new Date(customer.lastPurchase).toLocaleDateString()
                        : 'Never'}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewCustomer(customer)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 transition-all hover:bg-emerald-600 hover:text-white"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleEditCustomer(customer)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition-all hover:bg-blue-600 hover:text-white"
                          title="Edit Customer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 transition-all hover:bg-rose-600 hover:text-white"
                          title="Delete Customer"
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

      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        customer={editingCustomer}
      />

      {viewingCustomer && (
        <CustomerDetailModal
          customer={viewingCustomer}
          onClose={() => setViewingCustomer(null)}
        />
      )}
    </div>
  );
}

interface CustomerStatCardProps {
  icon: typeof User;
  label: string;
  value: string;
  tone: 'blue' | 'emerald' | 'purple' | 'amber';
}

function CustomerStatCard({
  icon: Icon,
  label,
  value,
  tone,
}: CustomerStatCardProps) {
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