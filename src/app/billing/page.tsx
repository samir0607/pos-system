'use client';

import { useState, useEffect } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { toWords } from 'number-to-words'
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
  unitDiscount: number;
}

interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
}

interface DerivedTotals {
  subTotal: number;     
  discount: number;        
  total: number;
}

export default function BillingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [derived, setDerived] = useState<DerivedTotals>({subTotal: 0, discount: 0, total: 0});
  const [search, setSearch] = useState('');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    address: ''
  });

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
      toast.dismiss();
      toast.error('Error fetching products');
    }
  };

  const calculateTotal = () => {
    const subTotal = cart.reduce((sum, item) => sum + (item.product.sell_price * item.quantity) , 0);
    const discount = cart.reduce((sum, item) => sum + (Number(item.unitDiscount || 0) * item.quantity), 0);
    const total = Math.max(0,subTotal - discount);

    setDerived({
      subTotal: Number(subTotal.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      total: Number(total.toFixed(2))
    });
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        if (existingItem.quantity + 1 > product.quantity) {
          toast.dismiss();
          toast.error('Not enough stock');
          return prevCart;
        }
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1, unitDiscount: 0 }];
    });
    toast.dismiss();
    toast.success('Added to cart successfully');
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.product.id !== productId) return item;
        const maxAllowed = item.product.quantity;
        const qty = Math.min(newQuantity, maxAllowed);
        if (newQuantity > maxAllowed) {
          toast.dismiss();
          toast.error(`Only ${maxAllowed} units available in stock`);
        }
        return { ...item, quantity: qty };
        }
      )
    );
  };

  const updateDiscount = (productId: string, newUnitDiscount: number) => {
    setCart((prevCart) => 
      prevCart.map((item) => item.product.id === productId ? {
        ...item,
        unitDiscount: Number(newUnitDiscount || 0)
      } : item
    ));
  };
  
  const handleCheckout = async () => {
    if (!customerInfo.name.trim() || !customerInfo.phone.trim()) {
      toast.dismiss();
      toast.error('Please enter customer name and phone number');
      return;
    }

    try {
      const payload = {
        items: cart.map((item) => {
          const price = Number(item.product.sell_price);
          const unit_discount = Number(item.unitDiscount || 0);
          const net_price = Math.max(0, price - unit_discount);
          const amount = Number((net_price * item.quantity).toFixed(2));
          return {
            product_id: item.product.id,
            quantity_sold: item.quantity,
            sell_price: price,
            unit_discount,
            net_price,
            amount,
          };
        }),
        subtotal: Number(derived.subTotal.toFixed(2)),
        discount_amount: Number(derived.discount.toFixed(2)),
        total_amount: Number(derived.total.toFixed(2)),
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_address: customerInfo.address
      }; 

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const currentSaleId = data.id;

        toast.dismiss();
        toast.success('Sale completed successfully');
        await fetchProducts();

        return currentSaleId; // Return success status
      } else {
        toast.dismiss();
        toast.error('Error processing sale');
        return 0;
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Error processing sale');
      return 0;
    }
  };

  const sendWhatsAppInvoice = (cartData: CartItem[], customerData: CustomerInfo, derivedData: DerivedTotals) => {
    try {
      // Build itemized product list
      const itemsList = cartData.map((item, idx) =>
        `${idx + 1}. ${item.product.name} x${item.quantity} @ ₹${item.product.sell_price} = ₹${(item.product.sell_price * item.quantity).toFixed(2)}`
      ).join("\n");

      // Create WhatsApp message
      const message = 
        `Dear ${customerData.name},
          Thank you for shopping with us
        Date: ${new Date().toLocaleDateString()}
          
        Items: \n${itemsList}\n
        SubTotal: ₹${Number(derivedData.subTotal || 0).toFixed(2)}
        Discount: ₹${Number(derivedData.discount || 0).toFixed(2)}
        Total Amount: ₹${derivedData.total.toFixed(2)}\n
        Thank you for shopping with us! 
        For any queries, reply to this message.`;

      // Format phone number (remove any non-digit characters and add country code if needed)
      let phoneNumber = customerData.phone.replace(/\D/g, '');
      if (!phoneNumber.startsWith('91') && phoneNumber.length === 10) {
        phoneNumber = '91' + phoneNumber;
      }
      if (phoneNumber.length < 10) {
        toast.dismiss();
        toast.error('Invalid phone number format');
        return;
      }
      // Create WhatsApp share URL
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      console.log('WhatsApp URL:', whatsappUrl); // Debug log
      const newWindow = window.open(whatsappUrl, '_blank');
      if (!newWindow) {
        toast.dismiss();
        toast.error('Popup blocked! Please allow popups for this site.');
      } else {
        toast.dismiss();
        toast.success('WhatsApp opened! Please send the message.');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Error opening WhatsApp');
    }
  };

  const convertToWords = (amount: number): string => {
    const integerPart = Math.floor(amount);
    const decimalPart = Math.round((amount - integerPart) * 100);

    let result = toWords(integerPart) + ' rupees';
    if (decimalPart > 0) {
      result += ' and ' + toWords(decimalPart) + ' paise';
    }

    return result.charAt(0).toUpperCase() + result.slice(1);
  }

  const printInvoice = (
    cartData: CartItem[], 
    customerData: CustomerInfo, 
    derivedData: DerivedTotals,
    saleId: number
  ) => {
    const printWindow = window.open('', '_blank');
    const amountInWords = convertToWords(derivedData.total);
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
              .top, .info { display: flex; justify-content: space-between }
              .invoice { max-width: 800px; margin: 0 auto; padding: 20px; }
              .header { text-align: left; margin-bottom: 20px; }
              .customer-info { margin-bottom: 10px; }
              .customer-info h3 { margin-bottom: 10px; }
              .customer-info p { margin: 5px 0; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
              .total { margin-left: auto; max-width: 150px; text-align: right; margin-top: 10px;font-size: 14px; }
              .row { display: flex; justify-content: space-between; }
              .total .total-final { font-weight: bold; font-size: 16px; }
            </style>
          </head>
          <body>
            <div class="invoice">
              <div class="top">
                <img id="invoice-logo" src="logo.png" alt="Logo" width="120" height="130"/>
                <p><strong> Sales Invoice/Cash Memo </strong></br> (original for Receipient)</br>
                </br> Date: ${new Date().toLocaleDateString()}</br>
                Invoice.No: ${saleId}</p>
              </div>
              <div class="header">
                <h3>GenZ Collection - Beauty Parlour and Fashion Shop</h3>
                <p>Sukulpurwa, Bapu Nagar, Pipiganj, Uttar Pradesh - 273165</p>
                <p>Mob. No: 9076966951</p>
              </div>
              <div class="info">
                <div class="customer-info">
                  <h3>Bill To:</h3>
                  <p><strong>Name:</strong> ${customerData.name}</p>
                  <p><strong>Phone:</strong> ${customerData.phone}</p>
                  <p><strong>Address:</strong> ${customerData.address} </p>
                </div>
                <img id="insta" src="insta.png" alt="Logo" width="120" height="130"/>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Rate</th>
                    <th>Discount</th>
                    <th>Net Rate</th>
                    <th>Quantity</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${cartData.map(item => `
                    <tr>
                      <td>${item.product.name}</td>
                      <td>₹${item.product.sell_price}</td>
                      <td>₹${item.unitDiscount}</td>
                      <td>₹${item.product.sell_price - item.unitDiscount}</td>
                      <td>${item.quantity}</td>
                      <td>₹${((item.product.sell_price - item.unitDiscount) * item.quantity).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="total">
                <div class="row">
                  <span>Subtotal:</span>
                  <span>₹${Number(derivedData.subTotal).toFixed(2)}</span>
                </div>
                <div class="row">
                  <span>Discount:</span>
                  <span>₹${Number(derivedData.discount).toFixed(2)}</span>
                </div>
                <div class="row total-final">
                  <span>Total:</span>
                  <span>₹${derivedData.total.toFixed(2)}</span>
                </div>
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
        const instaImg = printWindow.document.getElementById('insta') as HTMLImageElement;

        const checkIfImagesLoaded = () => {
          if (logoImg.complete && instaImg.complete) {
            printWindow.print();
          }
        };

        if(logoImg.complete && instaImg.complete) {
          printWindow.print();
        } else {
          logoImg.onload = checkIfImagesLoaded;
          instaImg.onload = checkIfImagesLoaded;
        }
      }
    }
  }; 

  return (
    <ProtectedRoute>
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
        <div className="container mx-auto px-4 py-2">
          <h1 className="text-xl font-bold mb-3 text-white drop-shadow-lg">Billing System</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 h-80vh gap-6">
          <div className="grid grid-rows-2 gap-3">
          {/* Products List */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 p-4">
            <h2 className="font-semibold mb-3 text-white">Available Products</h2>
            
            <div className="space-y-2">
              {/* Search Bar */}
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full p-1 border rounded-xl bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder-white/70 shadow focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              />
              {products
                .filter(product => product.name.toLowerCase().includes(search.toLowerCase()))
                .slice(0,3)
                .map(product => (
                  <div key={product.id} className="flex items-center justify-between pt-1 pb-1 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/15 transition-all duration-300">
                    <div>
                      <h3 className="font-medium text-white">{product.name}</h3>
                      <p className="text-gray-200">₹{product.sell_price}</p>
                      <p className="text-sm text-gray-300">Quantity Remaining: {product.quantity}</p>
                      {product.quantity === 0 && (
                        <span className="text-xs text-red-400 font-semibold">Not Available</span>
                      )}
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className={`px-4 py-2 rounded-2xl text-white transition-all duration-300 ${
                        product.quantity === 0 
                          ? 'bg-gray-600/50 cursor-not-allowed backdrop-blur-sm' 
                          : 'bg-blue-500/70 hover:bg-blue-500/90 backdrop-blur-sm shadow-lg hover:shadow-blue-500/25'
                      }`}
                      disabled={product.quantity === 0}
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
            </div>
          </div>
          {/* Customer Information Form */}
          <div className="max-h-60 mb-6 p-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
            <h3 className="font-semibold mb-3 text-white">Customer Information</h3>
            <div className="space-y-3">
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter customer name"
                  className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  required
                />
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                  className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  required
                />
                <input
                  type="tel"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter Address"
                  className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  required
                />
            </div>
          </div>
          </div>
          {/* Cart */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Cart</h2>
            {cart.length === 0 ? (
              <p className="text-gray-300">No items in cart</p>
            ) : (
              <>
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300">
                      <div>
                        <h3 className="font-medium text-white">{item.product.name}</h3>
                        <p className="text-gray-200">₹{item.product.sell_price}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="text-xl text-white hover:text-gray-300 bg-white/20 backdrop-blur-sm w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-white/30"
                        >
                          -
                        </button>
                        <span className="text-white font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="text-xl text-white hover:text-gray-300 bg-white/20 backdrop-blur-sm w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-white/30"
                        >
                          +
                        </button>

                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-xs text-red-400 hover:text-red-300 bg-red-500/20 backdrop-blur-sm p-2 rounded-full transition-all duration-300 hover:bg-red-500/30"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                        <div className="flex flex-col space-y-1">
                          <label className="text-xs text-gray-300">Discount</label>
                          <input
                            type="number"
                            min="0"
                            max={item.product.sell_price}
                            value={item.unitDiscount || ''}
                            onChange={(e) => updateDiscount(item.product.id, parseFloat(e.target.value) || 0)}
                            placeholder="₹0.00"
                            className="w-20 px-2 py-1 text-sm bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 rounded focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                  <div className="text-xs flex justify-between items-center mt-3 text-gray-300">
                    <span className="font-semibold">SubTotal:</span>
                    <span>₹{derived.subTotal.toFixed(2)}</span>
                  </div>

                  <div className="text-xs flex justify-between items-center text-gray-300">
                    <span className="font-semibold">Discount:</span>
                    <span>₹{derived.discount.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center mb-4 text-white">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="font-semibold text-xl">₹{derived.total.toFixed(2)}</span>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={async () => {
                        const currentSaleId = await handleCheckout();
                        if (currentSaleId!=0) {
                          // Store cart data before clearing
                          const cartData = [...cart];
                          const customerData = { ...customerInfo };
                          const derivedData = {...derived};
                          
                          // Clear the cart and form
                          setCart([]);
                          setCustomerInfo({ name: '', phone: '', address: '' });

                          printInvoice(cartData, customerData, derivedData, currentSaleId);

                          // Send WhatsApp with stored data
                          setTimeout(() => {
                            sendWhatsAppInvoice(cartData, customerData, derivedData);
                          }, 100);
                        }
                      }}
                      className="flex-1 bg-green-500/70 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-green-500/90 flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-green-500/25"
                    >
                      📱 Checkout
                    </button>
                    
                  </div>
              </>
            )}
          </div>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}