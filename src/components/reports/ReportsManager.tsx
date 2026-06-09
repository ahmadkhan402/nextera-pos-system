import { useState, useMemo } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Download,
  BarChart3,
  CalendarDays,
  Package,
  AlertTriangle,
  Wallet,
  Receipt,
  Boxes,
} from 'lucide-react';
import { useApp } from '../../context/SupabaseAppContext';
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  differenceInCalendarDays,
} from 'date-fns';

export function ReportsManager() {
  const { state } = useApp();

  const [dateRange, setDateRange] = useState('7');
  const [reportType, setReportType] = useState('sales');
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');

  const endDate =
    dateRange === 'custom' && endDateInput.trim() !== ''
      ? new Date(endDateInput)
      : new Date();

  const startDate =
    dateRange === 'custom' && startDateInput.trim() !== ''
      ? new Date(startDateInput)
      : subDays(endDate, parseInt(dateRange) || 7);

  const validEndDate = isNaN(endDate.getTime()) ? new Date() : endDate;
  const validStartDate = isNaN(startDate.getTime())
    ? subDays(validEndDate, 7)
    : startDate;

  const chartDays =
    dateRange === 'custom'
      ? Math.max(1, differenceInCalendarDays(validEndDate, validStartDate) + 1)
      : parseInt(dateRange) || 7;

  const filteredSales = state.sales.filter(sale => {
    const saleDate = new Date(sale.timestamp);

    return (
      saleDate >= startOfDay(validStartDate) &&
      saleDate <= endOfDay(validEndDate)
    );
  });

  const salesData = useMemo(() => {
    const salesByDay: Record<
      string,
      { date: string; sales: number; transactions: number }
    > = {};

    for (let i = chartDays - 1; i >= 0; i--) {
      const date = format(subDays(validEndDate, i), 'MM/dd');

      salesByDay[date] = {
        date,
        sales: 0,
        transactions: 0,
      };
    }

    filteredSales.forEach(sale => {
      const date = format(new Date(sale.timestamp), 'MM/dd');

      if (salesByDay[date]) {
        salesByDay[date].sales += sale.total;
        salesByDay[date].transactions += 1;
      }
    });

    return Object.values(salesByDay);
  }, [filteredSales, chartDays, validEndDate]);

  const topProducts = useMemo(() => {
    const productSales: Record<
      string,
      { name: string; quantity: number; revenue: number }
    > = {};

    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const productId = item.product.id;

        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.product.name,
            quantity: 0,
            revenue: 0,
          };
        }

        productSales[productId].quantity += item.quantity;
        productSales[productId].revenue += item.subtotal;
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredSales]);

  const categoryData = useMemo(() => {
    const categories: Record<string, { name: string; value: number }> = {};

    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const category = item.product.category;

        if (!categories[category]) {
          categories[category] = {
            name: category,
            value: 0,
          };
        }

        categories[category].value += item.subtotal;
      });
    });

    return Object.values(categories);
  }, [filteredSales]);

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = filteredSales.length;
  const averageTransaction =
    totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const totalDiscounts = filteredSales.reduce(
    (sum, sale) => sum + sale.discountAmount,
    0
  );

  const customerData = useMemo(() => {
    const customerStats: Record<
      string,
      {
        id: string;
        name: string;
        totalSpent: number;
        totalTransactions: number;
        totalItems: number;
        avgTransactionValue: number;
        lastPurchase: Date;
      }
    > = {};

    state.customers.forEach(customer => {
      customerStats[customer.id] = {
        id: customer.id,
        name: customer.name,
        totalSpent: 0,
        totalTransactions: 0,
        totalItems: 0,
        avgTransactionValue: 0,
        lastPurchase: new Date(customer.createdAt),
      };
    });

    customerStats['walk-in'] = {
      id: 'walk-in',
      name: 'Walk-in Customers',
      totalSpent: 0,
      totalTransactions: 0,
      totalItems: 0,
      avgTransactionValue: 0,
      lastPurchase: new Date(),
    };

    filteredSales.forEach(sale => {
      const customerId = sale.customerId || 'walk-in';

      if (customerStats[customerId]) {
        customerStats[customerId].totalSpent += sale.total;
        customerStats[customerId].totalTransactions += 1;
        customerStats[customerId].totalItems += sale.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        customerStats[customerId].lastPurchase = new Date(sale.timestamp);
      }
    });

    Object.values(customerStats).forEach(customer => {
      customer.avgTransactionValue =
        customer.totalTransactions > 0
          ? customer.totalSpent / customer.totalTransactions
          : 0;
    });

    return Object.values(customerStats).sort(
      (a, b) => b.totalSpent - a.totalSpent
    );
  }, [filteredSales, state.customers]);

  const inventoryData = useMemo(() => {
    const inventoryStats = state.products.map(product => {
      const soldQuantity = filteredSales.reduce((sum, sale) => {
        return (
          sum +
          sale.items
            .filter(item => item.product.id === product.id)
            .reduce((itemSum, item) => itemSum + item.quantity, 0)
        );
      }, 0);

      const revenue = filteredSales.reduce((sum, sale) => {
        return (
          sum +
          sale.items
            .filter(item => item.product.id === product.id)
            .reduce((itemSum, item) => itemSum + item.subtotal, 0)
        );
      }, 0);

      const stockValue = product.stock * (product.cost || 0);

      const potentialRevenue =
        product.stock *
        (product.isWeightBased ? product.pricePerUnit || 0 : product.price);

      const turnoverRatio = product.stock > 0 ? soldQuantity / product.stock : 0;

      const stockStatus =
        product.stock === 0
          ? 'Out of Stock'
          : product.stock <= product.minStock
            ? 'Low Stock'
            : 'In Stock';

      const sellingPrice = product.isWeightBased
        ? product.pricePerUnit || 0
        : product.price;

      const profitMargin =
        product.cost && sellingPrice
          ? ((sellingPrice - product.cost) / sellingPrice) * 100
          : 0;

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        currentStock: product.stock,
        minStock: product.minStock,
        stockStatus,
        costPrice: product.cost || 0,
        sellingPrice,
        stockValue,
        potentialRevenue,
        soldQuantity,
        revenue,
        turnoverRatio,
        profitMargin,
        active: product.active,
      };
    });

    return inventoryStats.sort((a, b) => {
      if (reportType === 'inventory') {
        if (a.stockStatus !== b.stockStatus) {
          const statusOrder = {
            'Out of Stock': 0,
            'Low Stock': 1,
            'In Stock': 2,
          };

          return (
            statusOrder[a.stockStatus as keyof typeof statusOrder] -
            statusOrder[b.stockStatus as keyof typeof statusOrder]
          );
        }
      }

      return b.revenue - a.revenue;
    });
  }, [state.products, filteredSales, reportType]);

  const COLORS = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#EC4899'];

  const exportReport = () => {
    let csvHeader = '';
    let csvData = '';
    let fileName = '';

    if (reportType === 'sales') {
      csvHeader = 'Date,Invoice Number,Customer,Items,Total,Discount,Cashier\n';

      csvData = filteredSales
        .map(sale => {
          const customerName = sale.customerId
            ? state.customers.find(c => c.id === sale.customerId)?.name ||
              'Walk-in Customer'
            : 'Walk-in Customer';

          return [
            format(new Date(sale.timestamp), 'yyyy-MM-dd HH:mm:ss'),
            sale.invoiceNumber,
            customerName,
            sale.items.length,
            sale.total.toFixed(2),
            sale.discountAmount.toFixed(2),
            sale.cashier,
          ].join(',');
        })
        .join('\n');

      fileName = `pos-sales-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    } else if (reportType === 'customers') {
      csvHeader =
        'Customer Name,Total Spent,Total Transactions,Total Items,Avg Transaction Value,Last Purchase\n';

      csvData = customerData
        .map(customer => {
          return [
            customer.name,
            customer.totalSpent.toFixed(2),
            customer.totalTransactions,
            customer.totalItems,
            customer.avgTransactionValue.toFixed(2),
            format(customer.lastPurchase, 'yyyy-MM-dd HH:mm:ss'),
          ].join(',');
        })
        .join('\n');

      fileName = `pos-customers-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    } else if (reportType === 'inventory') {
      csvHeader =
        'Product Name,SKU,Category,Current Stock,Min Stock,Stock Status,Cost Price,Selling Price,Stock Value,Potential Revenue,Sold Quantity,Revenue,Turnover Ratio,Profit Margin %,Active\n';

      csvData = inventoryData
        .map(item => {
          return [
            item.name,
            item.sku,
            item.category,
            item.currentStock,
            item.minStock,
            item.stockStatus,
            item.costPrice.toFixed(2),
            item.sellingPrice.toFixed(2),
            item.stockValue.toFixed(2),
            item.potentialRevenue.toFixed(2),
            item.soldQuantity,
            item.revenue.toFixed(2),
            item.turnoverRatio.toFixed(2),
            item.profitMargin.toFixed(2),
            item.active ? 'Yes' : 'No',
          ].join(',');
        })
        .join('\n');

      fileName = `pos-inventory-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    }

    const fullCsv = csvHeader + csvData;
    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(fullCsv);

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', fileName);
    linkElement.click();
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
                Analytics Center
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">
                Reports & Analytics
              </h1>

              <p className="mt-1 text-sm font-medium text-blue-100/80">
                {format(validStartDate, 'MMM dd, yyyy')} -{' '}
                {format(validEndDate, 'MMM dd, yyyy')}
              </p>
            </div>

            <button
              onClick={exportReport}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-950 shadow-xl shadow-black/10 transition-all hover:-translate-y-0.5 hover:bg-blue-50"
            >
              <Download className="h-5 w-5" />
              Export Report
            </button>
          </div>

          <ReportStats
            reportType={reportType}
            currency={state.settings.currency}
            totalRevenue={totalRevenue}
            totalTransactions={totalTransactions}
            averageTransaction={averageTransaction}
            totalDiscounts={totalDiscounts}
            customersCount={state.customers.length}
            customerData={customerData}
            productsCount={state.products.length}
            inventoryData={inventoryData}
          />
        </div>
      </section>

      <section className="rounded-[24px] border border-white/80 bg-white/85 p-4 shadow-xl shadow-slate-200/70 backdrop-blur-2xl lg:p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <BarChart3 className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-black text-slate-900">Report Filters</h2>
            <p className="text-xs font-semibold text-slate-500">
              Select report type and date range
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[220px_220px_minmax(0,1fr)]">
          <FilterSelect value={reportType} onChange={setReportType}>
            <option value="sales">Sales Report</option>
            <option value="inventory">Inventory Report</option>
            <option value="customers">Customer Report</option>
          </FilterSelect>

          <FilterSelect
            value={dateRange}
            onChange={value => {
              setDateRange(value);

              if (value === 'custom' && !startDateInput && !endDateInput) {
                const today = new Date();
                const weekAgo = subDays(today, 7);

                setEndDateInput(format(today, 'yyyy-MM-dd'));
                setStartDateInput(format(weekAgo, 'yyyy-MM-dd'));
              }
            }}
          >
            <option value="1">Today</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="custom">Custom Range</option>
          </FilterSelect>

          {dateRange === 'custom' && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <input
                type="date"
                value={startDateInput}
                onChange={e => setStartDateInput(e.target.value)}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                max={format(new Date(), 'yyyy-MM-dd')}
              />

              <span className="hidden text-sm font-black text-slate-400 sm:block">
                to
              </span>

              <input
                type="date"
                value={endDateInput}
                onChange={e => setEndDateInput(e.target.value)}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
          )}
        </div>
      </section>

      {reportType === 'sales' && (
        <>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <ChartCard icon={TrendingUp} title="Sales Trend" tone="blue">
              <ResponsiveContainer width="100%" height={310}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    formatter={(value: any, name: string) => [
                      name === 'sales'
                        ? `${state.settings.currency} ${Number(value).toFixed(2)}`
                        : value,
                      name === 'sales' ? 'Sales' : 'Transactions',
                    ]}
                    contentStyle={tooltipStyle}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#2563EB"
                    strokeWidth={3}
                    name="Sales"
                    dot={{ fill: '#2563EB', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#2563EB', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="transactions"
                    stroke="#059669"
                    strokeWidth={3}
                    name="Transactions"
                    dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#059669', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard icon={BarChart3} title="Sales by Category" tone="purple">
              {categoryData.length === 0 ? (
                <EmptyChart label="No category sales data found" />
              ) : (
                <ResponsiveContainer width="100%" height={310}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [
                        `${state.settings.currency} ${Number(value).toFixed(2)}`,
                        'Revenue',
                      ]}
                      contentStyle={tooltipStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <DataCard icon={ShoppingCart} title="Top Selling Products">
            <TopProductsTable
              products={topProducts}
              currency={state.settings.currency}
            />
          </DataCard>
        </>
      )}

      {reportType === 'customers' && (
        <>
          <ChartCard icon={TrendingUp} title="Top Customer Spending" tone="blue">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart
                data={customerData.slice(0, 10).map(customer => ({
                  name:
                    customer.name.length > 15
                      ? customer.name.substring(0, 15) + '...'
                      : customer.name,
                  spending: customer.totalSpent,
                  transactions: customer.totalTransactions,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  formatter={(value: any, name: string) => [
                    name === 'spending'
                      ? `${state.settings.currency} ${Number(value).toFixed(2)}`
                      : value,
                    name === 'spending' ? 'Total Spent' : 'Transactions',
                  ]}
                  contentStyle={tooltipStyle}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="spending"
                  stroke="#2563EB"
                  strokeWidth={3}
                  name="Total Spent"
                  dot={{ fill: '#2563EB', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#2563EB', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <DataCard icon={Users} title="Customer Analytics">
            <CustomerAnalyticsTable
              customers={customerData.slice(0, 20)}
              currency={state.settings.currency}
            />
          </DataCard>
        </>
      )}

      {reportType === 'inventory' && (
        <>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <ChartCard
              icon={BarChart3}
              title="Stock Status Distribution"
              tone="purple"
            >
              <ResponsiveContainer width="100%" height={310}>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: 'In Stock',
                        value: inventoryData.filter(
                          item => item.stockStatus === 'In Stock'
                        ).length,
                      },
                      {
                        name: 'Low Stock',
                        value: inventoryData.filter(
                          item => item.stockStatus === 'Low Stock'
                        ).length,
                      },
                      {
                        name: 'Out of Stock',
                        value: inventoryData.filter(
                          item => item.stockStatus === 'Out of Stock'
                        ).length,
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#059669" />
                    <Cell fill="#D97706" />
                    <Cell fill="#DC2626" />
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [value, 'Products']}
                    contentStyle={tooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard icon={DollarSign} title="Stock Value by Category" tone="emerald">
              <ResponsiveContainer width="100%" height={310}>
                <PieChart>
                  <Pie
                    data={Object.entries(
                      inventoryData.reduce(
                        (acc, item) => {
                          acc[item.category] =
                            (acc[item.category] || 0) + item.stockValue;
                          return acc;
                        },
                        {} as Record<string, number>
                      )
                    ).map(([category, value]) => ({
                      name: category,
                      value,
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {inventoryData.map((_, index) => (
                      <Cell
                        key={`stock-value-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [
                      `${state.settings.currency} ${Number(value).toFixed(2)}`,
                      'Stock Value',
                    ]}
                    contentStyle={tooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <DataCard icon={Boxes} title="Inventory Analytics">
            <InventoryAnalyticsTable
              items={inventoryData.slice(0, 50)}
              currency={state.settings.currency}
            />
          </DataCard>
        </>
      )}
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.12)',
};

function ReportStats({
  reportType,
  currency,
  totalRevenue,
  totalTransactions,
  averageTransaction,
  totalDiscounts,
  customersCount,
  customerData,
  productsCount,
  inventoryData,
}: any) {
  if (reportType === 'sales') {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ReportStatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`${currency} ${totalRevenue.toFixed(2)}`}
          tone="emerald"
        />
        <ReportStatCard
          icon={ShoppingCart}
          label="Transactions"
          value={totalTransactions.toString()}
          tone="blue"
        />
        <ReportStatCard
          icon={TrendingUp}
          label="Avg. Transaction"
          value={`${currency} ${averageTransaction.toFixed(2)}`}
          tone="purple"
        />
        <ReportStatCard
          icon={Users}
          label="Total Discounts"
          value={`${currency} ${totalDiscounts.toFixed(2)}`}
          tone="amber"
        />
      </div>
    );
  }

  if (reportType === 'customers') {
    const activeCustomers = customerData.filter(
      (c: any) => c.totalTransactions > 0
    ).length;

    const avgCustomerValue =
      customerData.reduce((sum: number, c: any) => sum + c.totalSpent, 0) /
      Math.max(activeCustomers, 1);

    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ReportStatCard
          icon={Users}
          label="Total Customers"
          value={customersCount.toString()}
          tone="blue"
        />
        <ReportStatCard
          icon={ShoppingCart}
          label="Active Customers"
          value={activeCustomers.toString()}
          tone="emerald"
        />
        <ReportStatCard
          icon={DollarSign}
          label="Avg. Customer Value"
          value={`${currency} ${avgCustomerValue.toFixed(2)}`}
          tone="purple"
        />
        <ReportStatCard
          icon={TrendingUp}
          label="Top Customer"
          value={customerData[0]?.name || 'N/A'}
          subValue={
            customerData[0]
              ? `${currency} ${customerData[0].totalSpent.toFixed(2)}`
              : ''
          }
          tone="amber"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <ReportStatCard
        icon={Package}
        label="Total Products"
        value={productsCount.toString()}
        tone="blue"
      />
      <ReportStatCard
        icon={AlertTriangle}
        label="Low Stock Items"
        value={inventoryData
          .filter(
            (item: any) =>
              item.stockStatus === 'Low Stock' ||
              item.stockStatus === 'Out of Stock'
          )
          .length.toString()}
        tone="rose"
      />
      <ReportStatCard
        icon={Wallet}
        label="Total Stock Value"
        value={`${currency} ${inventoryData
          .reduce((sum: number, item: any) => sum + item.stockValue, 0)
          .toFixed(2)}`}
        tone="emerald"
      />
      <ReportStatCard
        icon={TrendingUp}
        label="Potential Revenue"
        value={`${currency} ${inventoryData
          .reduce((sum: number, item: any) => sum + item.potentialRevenue, 0)
          .toFixed(2)}`}
        tone="purple"
      />
    </div>
  );
}

interface ReportStatCardProps {
  icon: typeof DollarSign;
  label: string;
  value: string;
  subValue?: string;
  tone: 'blue' | 'emerald' | 'purple' | 'amber' | 'rose';
}

function ReportStatCard({
  icon: Icon,
  label,
  value,
  subValue,
  tone,
}: ReportStatCardProps) {
  const toneClasses = {
    blue: 'bg-blue-500/15 text-blue-200 ring-blue-300/25',
    emerald: 'bg-emerald-500/15 text-emerald-200 ring-emerald-300/25',
    purple: 'bg-purple-500/15 text-purple-200 ring-purple-300/25',
    amber: 'bg-amber-500/15 text-amber-200 ring-amber-300/25',
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
          {subValue && (
            <p className="mt-0.5 truncate text-xs font-bold text-blue-100/70">
              {subValue}
            </p>
          )}
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

function ChartCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof BarChart3;
  title: string;
  tone?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-white/80 bg-white p-5 shadow-xl shadow-slate-200/70">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <Icon className="h-5 w-5" />
        </div>

        <h3 className="text-lg font-black text-slate-900">{title}</h3>
      </div>

      {children}
    </section>
  );
}

function DataCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof ShoppingCart;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-xl shadow-slate-200/70">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <Icon className="h-5 w-5" />
        </div>

        <h3 className="text-lg font-black text-slate-900">{title}</h3>
      </div>

      {children}
    </section>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[310px] items-center justify-center rounded-3xl bg-slate-50 text-sm font-bold text-slate-500">
      {label}
    </div>
  );
}

function TopProductsTable({
  products,
  currency,
}: {
  products: any[];
  currency: string;
}) {
  if (products.length === 0) {
    return <EmptyTable label="No selling products found in this date range." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50/80">
          <tr>
            <TableHead>Rank</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Quantity Sold</TableHead>
            <TableHead>Revenue</TableHead>
            <TableHead>Avg. Price</TableHead>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 bg-white">
          {products.map((product, index) => (
            <tr key={index} className="transition-colors hover:bg-blue-50/40">
              <td className="whitespace-nowrap px-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-sm font-black text-white">
                  {index + 1}
                </div>
              </td>

              <td className="whitespace-nowrap px-5 py-4 text-sm font-black text-slate-900">
                {product.name}
              </td>

              <td className="whitespace-nowrap px-5 py-4">
                <Badge>{product.quantity}</Badge>
              </td>

              <td className="whitespace-nowrap px-5 py-4 text-sm font-black text-emerald-600">
                {currency} {product.revenue.toFixed(2)}
              </td>

              <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-slate-600">
                {currency} {(product.revenue / product.quantity).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CustomerAnalyticsTable({
  customers,
  currency,
}: {
  customers: any[];
  currency: string;
}) {
  if (customers.length === 0) {
    return <EmptyTable label="No customer analytics found." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50/80">
          <tr>
            <TableHead>Customer</TableHead>
            <TableHead>Total Spent</TableHead>
            <TableHead>Transactions</TableHead>
            <TableHead>Items Purchased</TableHead>
            <TableHead>Avg. Transaction</TableHead>
            <TableHead>Last Purchase</TableHead>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 bg-white">
          {customers.map(customer => (
            <tr key={customer.id} className="transition-colors hover:bg-blue-50/40">
              <td className="whitespace-nowrap px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-sm font-black text-white">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-black text-slate-900">{customer.name}</span>
                </div>
              </td>

              <td className="whitespace-nowrap px-5 py-4 font-black text-emerald-600">
                {currency} {customer.totalSpent.toFixed(2)}
              </td>

              <td className="whitespace-nowrap px-5 py-4">
                <Badge>{customer.totalTransactions}</Badge>
              </td>

              <td className="whitespace-nowrap px-5 py-4">
                <Badge tone="slate">{customer.totalItems}</Badge>
              </td>

              <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-600">
                {currency} {customer.avgTransactionValue.toFixed(2)}
              </td>

              <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-600">
                {format(customer.lastPurchase, 'MMM dd, yyyy')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InventoryAnalyticsTable({
  items,
  currency,
}: {
  items: any[];
  currency: string;
}) {
  if (items.length === 0) {
    return <EmptyTable label="No inventory analytics found." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50/80">
          <tr>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Stock Value</TableHead>
            <TableHead>Sold</TableHead>
            <TableHead>Revenue</TableHead>
            <TableHead>Turnover</TableHead>
            <TableHead>Margin</TableHead>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 bg-white">
          {items.map(item => (
            <tr key={item.id} className="transition-colors hover:bg-blue-50/40">
              <td className="whitespace-nowrap px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900">{item.name}</span>
                  {!item.active && (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-700">
                      Inactive
                    </span>
                  )}
                </div>
              </td>

              <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-black text-slate-600">
                {item.sku}
              </td>

              <td className="whitespace-nowrap px-5 py-4">
                <Badge tone="slate">{item.category}</Badge>
              </td>

              <td className="whitespace-nowrap px-5 py-4 font-black text-slate-900">
                {item.currentStock}
                {item.minStock > 0 && (
                  <span className="ml-1 text-xs font-bold text-slate-400">
                    / {item.minStock}
                  </span>
                )}
              </td>

              <td className="whitespace-nowrap px-5 py-4">
                <StatusBadge status={item.stockStatus} />
              </td>

              <td className="whitespace-nowrap px-5 py-4 font-black text-blue-600">
                {currency} {item.stockValue.toFixed(2)}
              </td>

              <td className="whitespace-nowrap px-5 py-4">
                <Badge>{item.soldQuantity}</Badge>
              </td>

              <td className="whitespace-nowrap px-5 py-4 font-black text-emerald-600">
                {currency} {item.revenue.toFixed(2)}
              </td>

              <td className="whitespace-nowrap px-5 py-4">
                <Badge
                  tone={
                    item.turnoverRatio > 0.5
                      ? 'emerald'
                      : item.turnoverRatio > 0.2
                        ? 'amber'
                        : 'rose'
                  }
                >
                  {(item.turnoverRatio * 100).toFixed(1)}%
                </Badge>
              </td>

              <td className="whitespace-nowrap px-5 py-4">
                <span
                  className={`font-black ${
                    item.profitMargin > 50
                      ? 'text-emerald-600'
                      : item.profitMargin > 20
                        ? 'text-amber-600'
                        : 'text-rose-600'
                  }`}
                >
                  {item.profitMargin.toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableHead({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 ${className}`}
    >
      {children}
    </th>
  );
}

function Badge({
  children,
  tone = 'blue',
}: {
  children: React.ReactNode;
  tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
}) {
  const classes = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    rose: 'bg-rose-50 text-rose-700 ring-rose-100',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${classes[tone]}`}
    >
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'Out of Stock') {
    return <Badge tone="rose">{status}</Badge>;
  }

  if (status === 'Low Stock') {
    return <Badge tone="amber">{status}</Badge>;
  }

  return <Badge tone="emerald">{status}</Badge>;
}

function EmptyTable({ label }: { label: string }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
        <Receipt className="h-8 w-8" />
      </div>

      <h3 className="mt-4 text-lg font-black text-slate-900">{label}</h3>

      <p className="mt-1 max-w-md text-sm font-medium text-slate-500">
        Try changing the report type or date range.
      </p>
    </div>
  );
}