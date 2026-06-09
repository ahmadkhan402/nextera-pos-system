import { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Eye,
  RefreshCw,
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  FileText,
  X,
  ShoppingCart,
  TrendingUp,
  CalendarDays,
  User,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/SupabaseAppContext';
import { format } from 'date-fns';
import { Sale } from '../../types';
import { CheckoutModal } from '../pos/CheckoutModal';
import { salesService } from '../../lib/services';
import { swalConfig } from '../../lib/sweetAlert';

const isDraftSale = (sale: Sale) => {
  return (
    sale.invoiceNumber.startsWith('DRAFT-') ||
    sale.notes?.includes('Draft sale') ||
    sale.notes?.includes('DRAFT_SALE')
  );
};

export function TransactionsManager() {
  const { state } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Sale | null>(null);

  const filteredTransactions = useMemo(() => {
    return state.sales
      .filter(sale => {
        const matchesSearch =
          (sale.receiptNumber ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (sale.cashier ?? '').toLowerCase().includes(searchTerm.toLowerCase());

        const saleStatus = isDraftSale(sale) ? 'draft' : sale.status;
        const matchesStatus = statusFilter === 'all' || saleStatus === statusFilter;
        const matchesPayment = paymentFilter === 'all' || sale.paymentMethod === paymentFilter;

        let matchesDate = true;

        if (dateFilter !== 'all') {
          const saleDate = new Date(sale.timestamp);
          const today = new Date();

          const daysDiff = Math.floor(
            (today.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          switch (dateFilter) {
            case 'today':
              matchesDate = daysDiff === 0;
              break;
            case 'week':
              matchesDate = daysDiff <= 7;
              break;
            case 'month':
              matchesDate = daysDiff <= 30;
              break;
          }
        }

        return matchesSearch && matchesStatus && matchesPayment && matchesDate;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [state.sales, searchTerm, statusFilter, paymentFilter, dateFilter]);

  const totalRevenue = filteredTransactions.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = filteredTransactions.length;
  const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const draftTransactions = filteredTransactions.filter(isDraftSale).length;

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Banknote className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'digital':
        return <Smartphone className="h-4 w-4" />;
      case 'credit':
        return <Receipt className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getPaymentClass = (method: string) => {
    switch (method) {
      case 'cash':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
      case 'card':
        return 'bg-blue-50 text-blue-700 ring-blue-100';
      case 'digital':
        return 'bg-purple-50 text-purple-700 ring-purple-100';
      case 'credit':
        return 'bg-amber-50 text-amber-700 ring-amber-100';
      default:
        return 'bg-slate-50 text-slate-700 ring-slate-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
      case 'pending':
        return 'bg-amber-50 text-amber-700 ring-amber-100';
      case 'refunded':
        return 'bg-rose-50 text-rose-700 ring-rose-100';
      case 'credit':
        return 'bg-blue-50 text-blue-700 ring-blue-100';
      case 'draft':
        return 'bg-purple-50 text-purple-700 ring-purple-100';
      default:
        return 'bg-slate-50 text-slate-700 ring-slate-100';
    }
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Receipt #', 'Date', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Cashier'].join(','),
      ...filteredTransactions.map(sale =>
        [
          sale.receiptNumber ?? '',
          format(new Date(sale.timestamp), 'yyyy-MM-dd HH:mm'),
          sale.customerName || 'Walk-in',
          sale.items.length,
          sale.total.toFixed(2),
          sale.paymentMethod,
          isDraftSale(sale) ? 'draft' : sale.status,
          sale.cashier ?? '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();

    window.URL.revokeObjectURL(url);
  };

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
                Sales History
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">
                Transactions
              </h1>
              <p className="mt-1 text-sm font-medium text-blue-100/80">
                View, filter, export and complete draft sales.
              </p>
            </div>

            <button
              onClick={exportTransactions}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-950 shadow-xl shadow-black/10 transition-all hover:-translate-y-0.5 hover:bg-blue-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={CreditCard}
              label="Total Revenue"
              value={`${state.settings.currency} ${totalRevenue.toFixed(2)}`}
              tone="blue"
            />

            <SummaryCard
              icon={Receipt}
              label="Transactions"
              value={totalTransactions.toString()}
              tone="emerald"
            />

            <SummaryCard
              icon={RefreshCw}
              label="Average Sale"
              value={`${state.settings.currency} ${averageTransaction.toFixed(2)}`}
              tone="purple"
            />

            <SummaryCard
              icon={FileText}
              label="Draft Sales"
              value={draftTransactions.toString()}
              tone="amber"
            />
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/80 bg-white/85 p-4 shadow-xl shadow-slate-200/70 backdrop-blur-2xl md:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                placeholder="Search receipt, customer, cashier..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <FilterSelect value={statusFilter} onChange={setStatusFilter}>
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="credit">Credit</option>
            <option value="draft">Draft</option>
            <option value="refunded">Refunded</option>
          </FilterSelect>

          <FilterSelect value={paymentFilter} onChange={setPaymentFilter}>
            <option value="all">All Payments</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="digital">Digital</option>
            <option value="credit">Credit</option>
          </FilterSelect>

          <FilterSelect value={dateFilter} onChange={setDateFilter}>
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </FilterSelect>
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-xl shadow-slate-200/70">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">Transaction List</h2>
            <p className="text-sm font-medium text-slate-500">
              Showing {filteredTransactions.length} result{filteredTransactions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
              <Receipt className="h-8 w-8" />
            </div>

            <h3 className="mt-4 text-lg font-black text-slate-900">No transactions found</h3>
            <p className="mt-1 max-w-md text-sm font-medium text-slate-500">
              Try changing your search term or filters to view more transactions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Cashier</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredTransactions.map(transaction => {
                  const status = isDraftSale(transaction) ? 'draft' : transaction.status;

                  return (
                    <tr
                      key={transaction.id}
                      className="transition-colors hover:bg-blue-50/40"
                    >
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                            {isDraftSale(transaction) ? (
                              <FileText className="h-5 w-5 text-purple-600" />
                            ) : (
                              <Receipt className="h-5 w-5" />
                            )}
                          </div>

                          <div>
                            <p className="text-sm font-black text-slate-900">
                              #{transaction.receiptNumber ?? 'N/A'}
                            </p>
                            <p className="text-xs font-semibold text-slate-400">
                              Invoice {transaction.invoiceNumber ?? 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="text-sm font-bold text-slate-900">
                          {format(new Date(transaction.timestamp), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs font-semibold text-slate-500">
                          {format(new Date(transaction.timestamp), 'HH:mm')}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="max-w-36 truncate text-sm font-bold text-slate-900">
                          {transaction.customerName || 'Walk-in Customer'}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                          {transaction.items.length} items
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="text-sm font-black text-slate-900">
                          {state.settings.currency} {transaction.total.toFixed(2)}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${getPaymentClass(
                            transaction.paymentMethod
                          )}`}
                        >
                          {getPaymentIcon(transaction.paymentMethod)}
                          {transaction.paymentMethod}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${getStatusColor(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="hidden whitespace-nowrap px-5 py-4 text-sm font-bold text-slate-700 lg:table-cell">
                        <div className="max-w-28 truncate">
                          {transaction.cashier ?? 'N/A'}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedTransaction(transaction)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition-all hover:bg-blue-600 hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}

interface SummaryCardProps {
  icon: typeof CreditCard;
  label: string;
  value: string;
  tone: 'blue' | 'emerald' | 'purple' | 'amber';
}

function SummaryCard({ icon: Icon, label, value, tone }: SummaryCardProps) {
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

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}

function FilterSelect({ value, onChange, children }: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
    >
      {children}
    </select>
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

interface TransactionDetailModalProps {
  transaction: Sale;
  onClose: () => void;
}

function TransactionDetailModal({ transaction, onClose }: TransactionDetailModalProps) {
  const { state, dispatch } = useApp();
  const [showCheckout, setShowCheckout] = useState(false);

  const handleCompleteDraft = () => {
    dispatch({ type: 'CLEAR_CART' });

    transaction.items.forEach(item => {
      dispatch({ type: 'ADD_TO_CART', payload: item });
    });

    if (transaction.customerId) {
      const customer = state.customers.find(c => c.id === transaction.customerId);

      if (customer) {
        dispatch({ type: 'SET_SELECTED_CUSTOMER', payload: customer });
      }
    }

    setShowCheckout(true);
  };

  const handleCheckoutComplete = async (_completedSale: Sale) => {
    try {
      await salesService.delete(transaction.id);

      dispatch({ type: 'DELETE_SALE', payload: transaction.id });

      setShowCheckout(false);
      onClose();
    } catch (error) {
      console.error('Error completing draft sale:', error);
      swalConfig.error('Failed to complete the draft sale. Please try again.');
    }
  };

  const status = isDraftSale(transaction) ? 'draft' : transaction.status;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
        <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-sky-800 px-6 py-5">
            <div className="absolute -left-16 -top-20 h-48 w-48 rounded-full bg-sky-400/25 blur-3xl" />
            <div className="absolute -right-16 -bottom-20 h-48 w-48 rounded-full bg-blue-300/20 blur-3xl" />

            <div className="relative flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-200">
                  Transaction Details
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  #{transaction.receiptNumber ?? 'N/A'}
                </h2>
              </div>

              <button
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20 transition-all hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 md:p-6">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <InfoCard
                icon={Receipt}
                label="Receipt Number"
                value={`#${transaction.receiptNumber ?? 'N/A'}`}
              />

              <InfoCard
                icon={CalendarDays}
                label="Date & Time"
                value={format(new Date(transaction.timestamp), 'MMM dd, yyyy HH:mm')}
              />

              <InfoCard
                icon={User}
                label="Customer"
                value={transaction.customerName || 'Walk-in Customer'}
              />

              <InfoCard
                icon={Wallet}
                label="Cashier"
                value={transaction.cashier ?? 'N/A'}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black capitalize text-slate-700">
                {transaction.paymentMethod}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${
                  status === 'draft'
                    ? 'bg-purple-50 text-purple-700 ring-purple-100'
                    : status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                      : 'bg-slate-50 text-slate-700 ring-slate-100'
                }`}
              >
                {status}
              </span>
            </div>

            {transaction.cardDetails && (
              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <h3 className="mb-4 text-lg font-black text-slate-900">Card Details</h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailLine label="Bank" value={transaction.cardDetails.bankName} />
                  <DetailLine label="Card Type" value={transaction.cardDetails.cardType} />
                  <DetailLine label="Card Ending" value={`****${transaction.cardDetails.lastFourDigits}`} />
                  <DetailLine label="Holder" value={transaction.cardDetails.holderName} />
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-slate-100 bg-white">
              <div className="border-b border-slate-100 px-4 py-3">
                <h3 className="text-lg font-black text-slate-900">Items</h3>
              </div>

              <div className="space-y-3 p-4">
                {transaction.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-900">
                        {item.product.name}
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {state.settings.currency}{' '}
                        {item.product.isWeightBased
                          ? (item.product.pricePerUnit || 0).toFixed(2)
                          : item.product.price.toFixed(2)}{' '}
                        {item.product.isWeightBased ? `per ${item.product.unit}` : ''} ×{' '}
                        {item.weight
                          ? `${item.weight}${item.product.unit}`
                          : item.quantity}
                      </p>
                    </div>

                    <p className="flex-shrink-0 font-black text-slate-900">
                      {state.settings.currency} {item.subtotal.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <div className="space-y-3">
                <TotalLine
                  label="Subtotal"
                  value={`${state.settings.currency} ${transaction.subtotal.toFixed(2)}`}
                />

                {transaction.discountAmount > 0 && (
                  <TotalLine
                    label="Discount"
                    value={`-${state.settings.currency} ${transaction.discountAmount.toFixed(2)}`}
                    success
                  />
                )}

                <TotalLine
                  label="Tax"
                  value={`${state.settings.currency} ${transaction.taxAmount.toFixed(2)}`}
                />

                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-4">
                  <span className="text-lg font-black text-slate-900">Total</span>
                  <span className="text-2xl font-black text-blue-700">
                    {state.settings.currency} {transaction.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {transaction.notes && (
              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
                <h3 className="mb-2 text-base font-black text-blue-950">Notes</h3>
                <p className="text-sm font-medium text-blue-800">{transaction.notes}</p>
              </div>
            )}

            {isDraftSale(transaction) && (
              <div className="rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 to-fuchsia-50 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-black text-purple-950">Draft Sale</h3>
                    <p className="mt-1 text-sm font-semibold text-purple-700">
                      This sale is pending payment completion.
                    </p>
                  </div>

                  <button
                    onClick={handleCompleteDraft}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-purple-200 transition-all hover:-translate-y-0.5 hover:bg-purple-700"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Complete Payment
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition-all hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {showCheckout && (
        <CheckoutModal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          onComplete={handleCheckoutComplete}
        />
      )}
    </>
  );
}

interface InfoCardProps {
  icon: typeof Receipt;
  label: string;
  value: string;
}

function InfoCard({ icon: Icon, label, value }: InfoCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
          {label}
        </p>
        <p className="mt-1 truncate text-sm font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}

interface DetailLineProps {
  label: string;
  value: string;
}

function DetailLine({ label, value }: DetailLineProps) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 font-bold capitalize text-slate-900">{value}</p>
    </div>
  );
}

interface TotalLineProps {
  label: string;
  value: string;
  success?: boolean;
}

function TotalLine({ label, value, success }: TotalLineProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className={`font-black ${success ? 'text-emerald-600' : 'text-slate-900'}`}>
        {value}
      </span>
    </div>
  );
}