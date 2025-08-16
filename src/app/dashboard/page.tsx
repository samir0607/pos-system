'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface SalesData {
  totalSales: number;
  totalCost: number;
  netProfit: number;
  bestSellingProducts: Array<{
    name: string;
    totalSold: number;
  }>;
  salesByDate: Array<{
    date: string;
    total: number;
  }>;
}

export default function DashboardPage() {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [rawSales, setRawSales] = useState<any[]>([]); // keep raw sales for exports
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      const response = await fetch('/api/sales');
      const data = await response.json();

      setRawSales(data || []);

      // Calculate totals
      const totalSales = (data || []).reduce((sum: number, sale: any) => sum + (Number(sale.total_amount) || 0), 0);
      const totalCost = calculateTotalCost(data || []);
      const netProfit = totalSales - totalCost;

      // Process the data for the dashboard
      const processedData: SalesData = {
        totalSales,
        totalCost,
        netProfit,
        bestSellingProducts: processBestSellingProducts(data || []),
        salesByDate: processSalesByDate(data || []),
      };

      setSalesData(processedData);
    } catch (error) {
      toast.error('Error fetching sales data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalCost = (sales: any[]) => {
    let totalCost = 0;

    sales.forEach(sale => {
      (sale.items || []).forEach((item: any) => {
        // product cost may be stored under different keys or as strings
        const costPrice = Number(item.product?.cost_price ?? item.product?.cost ?? 0) || 0;
        const quantitySold = Number(item.quantity_sold ?? 0) || 0;
        totalCost += costPrice * quantitySold;
      });
    });

    return totalCost;
  };

  const processBestSellingProducts = (sales: any[]) => {
    const productSales = new Map<string, number>();

    sales.forEach(sale => {
      (sale.items || []).forEach((item: any) => {
        const productName = item.product?.name ?? 'Unknown';
        const currentTotal = productSales.get(productName) || 0;
        productSales.set(productName, currentTotal + (Number(item.quantity_sold) || 0));
      });
    });

    return Array.from(productSales.entries())
      .map(([name, totalSold]) => ({ name, totalSold }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);
  };

  const processSalesByDate = (sales: any[]) => {
    const salesByDate = new Map<string, number>();

    sales.forEach(sale => {
      // store as ISO date (YYYY-MM-DD) for stable sorting
      const d = new Date(sale.sale_date || sale.created_at || null);
      if (isNaN(d.getTime())) return; // skip invalid dates
      const dateKey = d.toISOString().split('T')[0];
      const currentTotal = salesByDate.get(dateKey) || 0;
      salesByDate.set(dateKey, currentTotal + (Number(sale.total_amount) || 0));
    });

    return Array.from(salesByDate.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const handleDownloadReport = () => {
    if (!salesData || rawSales.length === 0) return;

    // Flatten raw sales into sold items list
    const soldItemsData = rawSales.flatMap((sale: any) =>
      (sale.items || []).map((item: any) => {
        const costPrice = Number(item.product?.cost_price ?? item.product?.cost ?? 0) || 0;
        const sellingPrice = Number(item.sell_price ?? item.product?.selling_price ?? item.price ?? 0) || 0;
        const qty = Number(item.quantity_sold ?? 0) || 0;
        const totalPrice = Number(item.total_price ?? sellingPrice * qty) || sellingPrice * qty;

        return {
          'Invoice No': sale.invoice_no ?? sale.id ?? '',
          'Name': item.product?.name ?? 'Unknown',
          // Use ISO date for Excel friendliness, and also keep a human readable column
          'Date of Item Sold': (sale.sale_date ? new Date(sale.sale_date) : new Date()).toISOString().split('T')[0],
          'Cost Price': costPrice,
          'Selling Price': sellingPrice,
          'Quantity': qty,
          'Total Price': totalPrice,
        };
      })
    );

    // Create Sold Items sheet
    const soldItemsSheet = XLSX.utils.json_to_sheet(soldItemsData);

    // Existing sheets
    const bestSellingSheet = XLSX.utils.json_to_sheet(salesData.bestSellingProducts.map(p => ({ Name: p.name, UnitsSold: p.totalSold })));
    const salesByDateSheet = XLSX.utils.json_to_sheet(salesData.salesByDate.map(s => ({ Date: s.date, Total: s.total })));

    const profitMargin = salesData.totalSales > 0 ? (salesData.netProfit / salesData.totalSales) * 100 : 0;
    const financialSummarySheet = XLSX.utils.aoa_to_sheet([
      ['Financial Summary'],
      ['Total Sales', salesData.totalSales],
      ['Total Cost', salesData.totalCost],
      ['Net Profit', salesData.netProfit],
      ['Profit Margin %', profitMargin.toFixed(2)],
    ]);

    // Build workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, soldItemsSheet, 'Sold Items');
    XLSX.utils.book_append_sheet(wb, bestSellingSheet, 'Best Selling Products');
    XLSX.utils.book_append_sheet(wb, salesByDateSheet, 'Sales By Date');
    XLSX.utils.book_append_sheet(wb, financialSummarySheet, 'Financial Summary');

    // Download
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, 'sales_report.xlsx');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="backdrop-blur-md bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/30 border-t-white/80"></div>
        </div>
      </div>
    );
  }

  const formatDate = (isoOrLocale: any) => {
    if (!isoOrLocale) return '';
    const d = new Date(isoOrLocale);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    // try parsing dd/mm/yyyy
    const parts = String(isoOrLocale).split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const d2 = new Date(Number(year), Number(month) - 1, Number(day));
      if (!isNaN(d2.getTime())) {
        return d2.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    }

    return String(isoOrLocale);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-400/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-4">
            Analytics Dashboard
          </h1>
          <p className="text-white/70 text-lg">Real-time insights into your business performance</p>
        </div>

        {/* Download Button */}
        <div className="flex justify-center mb-10">
          <button
            onClick={handleDownloadReport}
            className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 backdrop-blur-md rounded-2xl border border-white/20 text-white font-semibold text-lg shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105 hover:from-emerald-400/90 hover:to-teal-500/90"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative flex items-center gap-2">
              📊 Download Excel Report
            </span>
          </button>
        </div>

        {/* Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Total Sales */}
          <div className="group relative backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-8 border border-white/20 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-emerald-500/20 rounded-xl backdrop-blur-sm">
                  <span className="text-2xl">💰</span>
                </div>
                <h2 className="text-xl font-semibold text-white/90">Total Sales</h2>
              </div>
              <p className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
                ₹{salesData?.totalSales.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Total Cost */}
          <div className="group relative backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-8 border border-white/20 shadow-2xl hover:shadow-red-500/20 transition-all duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-pink-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-500/20 rounded-xl backdrop-blur-sm">
                  <span className="text-2xl">💸</span>
                </div>
                <h2 className="text-xl font-semibold text-white/90">Total Cost</h2>
              </div>
              <p className="text-4xl font-bold bg-gradient-to-r from-red-400 to-pink-300 bg-clip-text text-transparent">
                ₹{salesData?.totalCost.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Net Profit */}
          <div className="group relative backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-8 border border-white/20 shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl backdrop-blur-sm">
                  <span className="text-2xl">📈</span>
                </div>
                <h2 className="text-xl font-semibold text-white/90">Net Profit</h2>
              </div>
              <p className={`text-4xl font-bold bg-gradient-to-r ${(salesData?.netProfit || 0) >= 0 ? 'from-emerald-400 to-green-300' : 'from-red-400 to-pink-300'} bg-clip-text text-transparent`}>
                ₹{salesData?.netProfit.toFixed(2)}
              </p>
              {salesData && salesData.totalSales > 0 && (
                <p className="text-white/60 mt-2 text-lg">
                  Margin: {((salesData.netProfit / salesData.totalSales) * 100).toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Best Selling Products */}
          <div className="group relative backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-8 border border-white/20 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-500/20 rounded-xl backdrop-blur-sm">
                  <span className="text-2xl">🏆</span>
                </div>
                <h2 className="text-2xl font-semibold text-white/90">Best Selling Products</h2>
              </div>
              <div className="space-y-4">
                {salesData?.bestSellingProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400/30 to-pink-500/30 rounded-full flex items-center justify-center text-white font-bold backdrop-blur-sm">
                        {index + 1}
                      </div>
                      <span className="font-medium text-white/90 text-lg">{product.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-purple-300 font-semibold text-lg">{product.totalSold}</span>
                      <span className="text-white/60 text-sm ml-1">units</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sales Trend */}
          <div className="group relative backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-8 border border-white/20 shadow-2xl hover:shadow-cyan-500/20 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-cyan-500/20 rounded-xl backdrop-blur-sm">
                  <span className="text-2xl">📊</span>
                </div>
                <h2 className="text-2xl font-semibold text-white/90">Sales Trend</h2>
              </div>
              <div className="h-80 overflow-x-auto">
                <div className="relative h-56">
                  <div className="flex items-end justify-center h-full space-x-1 px-4">
                    {salesData?.salesByDate.map((sale, index) => {
                      const maxValue = Math.max(...(salesData.salesByDate.map(s => s.total)) || [1]);
                      const barHeightPercent = (sale.total / maxValue) * 80;
                      const barWidth = Math.max(40, Math.min(80, 500 / salesData.salesByDate.length));

                      return (
                        <div key={index} className="flex flex-col items-center justify-end h-full group/bar" style={{ width: `${barWidth}px` }}>
                          {/* Sales amount on top of bar */}
                          <div className="text-xs font-semibold text-cyan-300 mb-2 text-center whitespace-nowrap opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200">
                            ₹{sale.total.toFixed(0)}
                          </div>
                          {/* Bar */}
                          <div
                            className="bg-gradient-to-t from-cyan-500/80 via-blue-400/70 to-purple-400/60 rounded-t-lg w-full backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-cyan-400/30 transition-all duration-300 hover:scale-105 relative overflow-hidden group-hover/bar:from-cyan-400 group-hover/bar:via-blue-300 group-hover/bar:to-purple-300"
                            style={{
                              height: `${Math.max(barHeightPercent, 10)}%`,
                              minHeight: '20px'
                            }}
                            title={`${sale.date}: ₹${sale.total.toFixed(2)}`}
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200"></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Date labels */}
                <div className="flex justify-center space-x-1 mt-4 overflow-x-auto px-4">
                  {salesData?.salesByDate.map((sale, index) => {
                    const barWidth = Math.max(40, Math.min(80, 500 / salesData.salesByDate.length));
                    return (
                      <div
                        key={index}
                        className="text-xs text-white/70 text-center font-medium"
                        style={{ width: `${barWidth}px` }}
                      >
                        {formatDate(sale.date)}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
