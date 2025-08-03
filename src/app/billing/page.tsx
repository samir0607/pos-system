'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
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
  address: string;
}

export default function BillingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    address: ''
  });
  const [discount, setDiscount] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [cart, discount]);

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
    setTotal(newTotal - Number(discount || 0));
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
          customer_phone: customerInfo.phone,
          customer_address: customerInfo.address
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const currentSaleId = data.id;
        console.log("Sale response:", data); 
        toast.success('Sale completed successfully');
        await fetchProducts();
        return currentSaleId; // Return success status
      } else {
        toast.error('Error processing sale');
        return 0;
      }
    } catch (error) {
      toast.error('Error processing sale');
      return 0;
    }
  };

  const sendWhatsAppInvoice = (cartData: CartItem[], customerData: CustomerInfo, totalAmount: number, discount: string) => {
    try {
      // Build itemized product list
      const itemsList = cartData.map((item, idx) =>
        `${idx + 1}. ${item.product.name} x${item.quantity} @ ₹${item.product.sell_price} = ₹${(item.product.sell_price * item.quantity).toFixed(2)}`
      ).join("\n");

      // Create WhatsApp message
      const message = `*GenZ Collection Invoice*\n\n` +
        `*Customer:* ${customerData.name}\n` +
        `*Phone:* ${customerData.phone}\n` +
        `*Address:* ${customerData.address}\n` +
        `*Date:* ${new Date().toLocaleDateString()}\n\n` +
        `*Items:*\n${itemsList}\n\n` +
        `*Discount:* ₹${Number(discount || 0).toFixed(2)}\n` +
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

  const convertToWords = (amount: number): string => {
    const words = require('number-to-words');
    const integerPart = Math.floor(amount);
    const decimalPart = Math.round((amount - integerPart) * 100);

    let result = words.toWords(integerPart) + ' rupees';
    if (decimalPart > 0) {
      result += ' and ' + words.toWords(decimalPart) + ' paise';
    }

    return result.charAt(0).toUpperCase() + result.slice(1);
  }

  const printInvoice = (
    cartData: CartItem[], 
    customerData: CustomerInfo, 
    totalAmount: number, 
    discount: string,
    saleId: number
  ) => {
    const printWindow = window.open('', '_blank');
    const amountInWords = convertToWords(totalAmount);
    if (printWindow) {
      const invoiceHTML = `
        <html>
          <head>
            <title>Invoice</title>
            <style>
              body { font-family: Arial, sans-serif; }
              thead{ background-color: lightgrey }
              @media print {
                thead {
                  background-color: lightgrey !important;
                  color: black !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
              }
              .top { display: flex; justify-content: space-between }
              .invoice { max-width: 800px; margin: 0 auto; padding: 20px; }
              .header { text-align: left; margin-bottom: 20px; }
              .customer-info { margin-bottom: 10px; }
              .customer-info h3 { margin-bottom: 10px; }
              .customer-info p { margin: 5px 0; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
              .total { text-align: right; margin-top: 20px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="invoice">
              <div class="top">
                <img id="invoice-logo" src="logo.png" alt="Logo" width="120" height="120"/>
                <p><strong> Sales Invoice/Cash Memo </strong></br> (original for Receipient)</br>
                Date: ${new Date().toLocaleDateString()}</br>
                Invoice.No: ${saleId}</p>
              </div>
              <div class="header">
                <h3>GenZ Collection - Beauty Parlour and Fashion Shop</h3>
                <p>Sukulpurwa, Bapu Nagar, Pipiganj, Uttar Pradesh - 273165</p>
                <p>Mob. No: 9076966951</p>
              </div>
              <div class="customer-info">
                <h3>Bill To:</h3>
                <p><strong>Name:</strong> ${customerData.name}</p>
                <p><strong>Phone:</strong> ${customerData.phone}</p>
                <p><strong>Address:</strong> ${customerData.address} </p>
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
                Discount: ₹${Number(discount).toFixed(2)}<br/>
                Total: ₹${totalAmount.toFixed(2)}
              </div>
              <h4>Amount In Words: </h4>
              <p> ${ amountInWords } </p>
            </div>
          </body>
        </html>
      `;
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      printWindow.onload = () => {
        const logoImg = printWindow.document.getElementById('invoice-logo') as HTMLImageElement;
        if(logoImg?.complete) {
          printWindow.print();
        } else {
          logoImg.onload = () => {
            printWindow.print();
          }
        }
      }
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address *
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
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
                <div className="flex items-center mb-4">
                  <span className="mr-2 font-semibold">Discount:</span>
                  <input
                    type="number"
                    value={discount}
                    min={0}
                    max={cart.reduce((sum, item) => sum + (item.product.sell_price * item.quantity), 0)}
                    onChange={e => setDiscount(String(e.target.value))}
                    className="w-24 px-2 py-1 border rounded"
                  />
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-lg font-semibold">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex space-x-4">
                  {/* <button
                    onClick={() => {
                      printInvoice(cart, customerInfo, total, discount, currentSaleId)}
                    disabled={cart.length === 0}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                  > */}
                    {/* <PrinterIcon className="h-5 w-5 mr-2" />
                    Print Invoice
                  </button> */}
                  <button
                    onClick={async () => {
                      const currentSaleId = await handleCheckout();
                      if (currentSaleId!=0) {
                        // Store cart data before clearing
                        const cartData = [...cart];
                        const customerData = { ...customerInfo };
                        const totalAmount = total;
                        const discountAmount = discount;
                        
                        // Clear the cart and form
                        setCart([]);
                        setCustomerInfo({ name: '', phone: '', address: '' });
                        setDiscount('');
                        setShowCustomerForm(false);
                        
                        printInvoice(cartData, customerData, totalAmount, discountAmount, currentSaleId);

                        // Send WhatsApp with stored data
                        setTimeout(() => {
                          sendWhatsAppInvoice(cartData, customerData, totalAmount, discount);
                        }, 100);
                      }
                    }}
                    className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center justify-center"
                  >
                    📱 Checkout
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