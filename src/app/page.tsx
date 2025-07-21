import Link from "next/link";
import { FaBox, FaReceipt, FaChartBar } from "react-icons/fa";

export default function Home() {
  return (
    
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-100">
      {/* Logo or Brand */}
      <div className="mb-8">
        <span className="text-5xl font-extrabold text-blue-700 drop-shadow-lg">POS System</span>
      </div>

      {/* Welcome Message */}
      <div className="bg-white/80 rounded-xl shadow-lg p-10 flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-2 text-gray-800">Welcome to the POS System</h1>
        <p className="text-lg mb-8 text-gray-600 text-center max-w-md">
          Manage your products, handle billing, and view analytics with ease. Use the navigation below to get started!
        </p>
        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/products" className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
            <FaBox /> Products
          </Link>
          <Link href="/billing" className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition">
            <FaReceipt /> Billing
          </Link>
          <Link href="/dashboard" className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition">
            <FaChartBar /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
} 