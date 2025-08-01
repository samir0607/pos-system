'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
console.log('Rendering dashboard page');
interface SalesData {
  totalSales: number;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      const response = await fetch('/api/sales');
      const data = await response.json();
      
      // Process the data for the dashboard
      const processedData: SalesData = {
        totalSales: data.reduce((sum: number, sale: any) => sum + sale.total, 0),
        bestSellingProducts: processBestSellingProducts(data),
        salesByDate: processSalesByDate(data),
      };
      
      setSalesData(processedData);
    } catch (error) {
      toast.error('Error fetching sales data');
    } finally {
      setLoading(false);
    }
  };

  const processBestSellingProducts = (sales: any[]) => {
    const productSales = new Map<string, number>();
    
    sales.forEach(sale => {
      sale.items.forEach((item: any) => {
        const productName = item.product.name;
        const currentTotal = productSales.get(productName) || 0;
        productSales.set(productName, currentTotal + item.quantity);
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
      const date = new Date(sale.createdAt).toLocaleDateString();
      const currentTotal = salesByDate.get(date) || 0;
      salesByDate.set(date, currentTotal + sale.total);
    });

    return Array.from(salesByDate.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const handleDownloadReport = () => {
    if (!salesData) return;
    // Prepare data for Excel
    const bestSellingSheet = XLSX.utils.json_to_sheet(salesData.bestSellingProducts);
    const salesByDateSheet = XLSX.utils.json_to_sheet(salesData.salesByDate);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, bestSellingSheet, 'Best Selling Products');
    XLSX.utils.book_append_sheet(wb, salesByDateSheet, 'Sales By Date');
    // Add total sales as a separate sheet
    const totalSalesSheet = XLSX.utils.aoa_to_sheet([
      ['Total Sales'],
      [salesData.totalSales]
    ]);
    XLSX.utils.book_append_sheet(wb, totalSalesSheet, 'Total Sales');
    // Generate and download Excel file
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, 'sales_report.xlsx');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>
      <button
        onClick={handleDownloadReport}
        className="mb-6 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-semibold shadow"
      >
        Download Excel Report
      </button>
      {/* Basic Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Total Sales */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Total Sales</h2>
          <p className="text-3xl font-bold text-green-600">
            ₹{salesData?.totalSales.toFixed(2)}
          </p>
        </div>
        {/* Best Selling Products */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Best Selling Products</h2>
          <div className="space-y-4">
            {salesData?.bestSellingProducts.map((product, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="font-medium">{product.name}</span>
                <span className="text-gray-600">{product.totalSold} units</span>
              </div>
            ))}
          </div>
        </div>
        {/* Sales Trend */}
        <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Sales Trend</h2>
          <div className="h-64">
            <div className="flex items-end h-48 space-x-2">
              {salesData?.salesByDate.map((sale, index) => (
                <div
                  key={index}
                  className="flex-1 bg-blue-500 rounded-t"
                  style={{
                    height: `${(sale.total / Math.max(...salesData.salesByDate.map(s => s.total))) * 100}%`,
                  }}
                  title={`${sale.date}: ₹${sale.total.toFixed(2)}`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              {salesData?.salesByDate.map((sale, index) => (
                <span key={index} className="flex-1 text-center">
                  {sale.date}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 