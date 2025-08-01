'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, MinusIcon, PrinterIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ProtectedRoute from '../components/ProtectedRoute';

interface Product {
  id: string;
  name: string;
  sell_price: number;
  quantity: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CustomerInfo {
  name: string;
  phone: string;
}

export default function BillingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: ''
  });
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [cart]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      toast.error('Error fetching products');
    }
  };

  const calculateTotal = () => {
    const newTotal = cart.reduce((sum, item) => sum + (item.product.sell_price * item.quantity), 0);
    setTotal(newTotal);
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const handleCheckout = async () => {
    if (!customerInfo.name.trim() || !customerInfo.phone.trim()) {
      toast.error('Please enter customer name and phone number');
      return;
    }

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            product_id: item.product.id,
            quantity_sold: item.quantity,
            sell_price: item.product.sell_price,
            total_price: item.product.sell_price * item.quantity
          })),
          total_amount: total,
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone
        }),
      });

      if (response.ok) {
        toast.success('Sale completed successfully');
        await fetchProducts();
        return true; // Return success status
      } else {
        toast.error('Error processing sale');
        return false;
      }
    } catch (error) {
      toast.error('Error processing sale');
      return false;
    }
  };

  const generateInvoiceHTML = () => {
    return `
      <html>
        <head>
          <title>Invoice</title>
          <style>
            body { font-family: Arial, sans-serif; }
            .invoice { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .customer-info { margin-bottom: 20px; }
            .customer-info h3 { margin-bottom: 10px; }
            .customer-info p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            .total { text-align: right; margin-top: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">
              <h1>GenZ Collection</h1>
              <p>Date: ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="customer-info">
              <h3>Customer Information:</h3>
              <p><strong>Name:</strong> ${customerInfo.name}</p>
              <p><strong>Phone:</strong> ${customerInfo.phone}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${cart.map(item => `
                  <tr>
                    <td>${item.product.name}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.product.sell_price}</td>
                    <td>₹${(item.product.sell_price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total">
              Total: ₹${total.toFixed(2)}
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const printInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateInvoiceHTML());
      printWindow.document.close();
      printWindow.print();
    }
  };

  const sendWhatsAppInvoice = () => {
    sendWhatsAppInvoiceWithData(cart, customerInfo, total);
  };

  const sendWhatsAppInvoiceWithData = (cartData: CartItem[], customerData: CustomerInfo, totalAmount: number) => {
    try {
      // Build itemized product list
      const itemsList = cartData.map((item, idx) =>
        `${idx + 1}. ${item.product.name} x${item.quantity} @ ₹${item.product.sell_price} = ₹${(item.product.sell_price * item.quantity).toFixed(2)}`
      ).join("\n");

      // Create WhatsApp message
      const message = `*GenZ Collection Invoice*\n\n` +
        `*Customer:* ${customerData.name}\n` +
        `*Phone:* ${customerData.phone}\n` +
        `*Date:* ${new Date().toLocaleDateString()}\n\n` +
        `*Items:*\n${itemsList}\n\n` +
        `*Total Amount:* ₹${totalAmount.toFixed(2)}\n\n` +
        `Thank you for shopping with us! \n` +
        `For any queries, reply to this message.`;

      // Format phone number (remove any non-digit characters and add country code if needed)
      let phoneNumber = customerData.phone.replace(/\D/g, '');
      if (!phoneNumber.startsWith('91') && phoneNumber.length === 10) {
        phoneNumber = '91' + phoneNumber;
      }
      if (phoneNumber.length < 10) {
        toast.error('Invalid phone number format');
        return;
      }
      // Create WhatsApp share URL
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      console.log('WhatsApp URL:', whatsappUrl); // Debug log
      const newWindow = window.open(whatsappUrl, '_blank');
      if (!newWindow) {
        toast.error('Popup blocked! Please allow popups for this site.');
      } else {
        toast.success('WhatsApp opened! Please send the message.');
      }
    } catch (error) {
      console.error('WhatsApp error:', error);
      toast.error('Error opening WhatsApp');
    }
  };

  const printInvoiceWithData = (cartData: CartItem[], customerData: CustomerInfo, totalAmount: number) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const invoiceHTML = `
        <html>
          <head>
            <title>Invoice</title>
            <style>
              body { font-family: Arial, sans-serif; }
              .invoice { max-width: 800px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .customer-info { margin-bottom: 20px; }
              .customer-info h3 { margin-bottom: 10px; }
              .customer-info p { margin: 5px 0; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
              .total { text-align: right; margin-top: 20px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="invoice">
              <div class="header">
                <h1>GenZ Collection</h1>
                <p>Date: ${new Date().toLocaleDateString()}</p>
              </div>
              <div class="customer-info">
                <h3>Customer Information:</h3>
                <p><strong>Name:</strong> ${customerData.name}</p>
                <p><strong>Phone:</strong> ${customerData.phone}</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${cartData.map(item => `
                    <tr>
                      <td>${item.product.name}</td>
                      <td>${item.quantity}</td>
                      <td>₹${item.product.sell_price}</td>
                      <td>₹${(item.product.sell_price * item.quantity).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="total">
                Total: ₹${totalAmount.toFixed(2)}
              </div>
            </div>
          </body>
        </html>
      `;
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Billing System</h1>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 border rounded shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Products List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Available Products</h2>
          <div className="space-y-4">
            {products
              .filter(product => product.name.toLowerCase().includes(search.toLowerCase()))
              .map(product => (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-gray-600">₹{product.sell_price}</p>
                    <p className="text-sm text-gray-500">Quantity Remaining: {product.quantity}</p>
                    {product.quantity === 0 && (
                      <span className="text-xs text-red-600 font-semibold">Not Available</span>
                    )}
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className={`px-4 py-2 rounded text-white ${product.quantity === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                    disabled={product.quantity === 0}
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* Cart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Current Cart</h2>
          {cart.length === 0 ? (
            <p className="text-gray-500">No items in cart</p>
          ) : (
            <>
              {/* Customer Information Form */}
              <div className="mb-6 p-4 border rounded bg-gray-50">
                <h3 className="font-semibold mb-3">Customer Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter customer name"
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <h3 className="font-medium">{item.product.name}</h3>
                      <p className="text-gray-600">₹{item.product.sell_price}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <MinusIcon className="h-5 w-5" />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-lg font-semibold">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => printInvoiceWithData(cart, customerInfo, total)}
                    disabled={cart.length === 0}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <PrinterIcon className="h-5 w-5 mr-2" />
                    Print Invoice
                  </button>
                  <button
                    onClick={async () => {
                      const checkoutSuccess = await handleCheckout();
                      if (checkoutSuccess) {
                        // Store cart data before clearing
                        const cartData = [...cart];
                        const customerData = { ...customerInfo };
                        const totalAmount = total;
                        
                        // Clear the cart and form
                        setCart([]);
                        setCustomerInfo({ name: '', phone: '' });
                        setShowCustomerForm(false);
                        
                        // Send WhatsApp with stored data
                        setTimeout(() => {
                          sendWhatsAppInvoiceWithData(cartData, customerData, totalAmount);
                        }, 100);
                      }
                    }}
                    className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center justify-center"
                  >
                    📱 Checkout & WhatsApp
                  </button>
                  
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
} 