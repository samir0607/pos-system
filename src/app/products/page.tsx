'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Edit, Trash2 } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  name: string;
  contact: string;
  address: string;
}

interface Product {
  id: number;
  name: string;
  brand: string;
  category_id: number | null;
  cost_price: number;
  sell_price: number;
  quantity: number;
  supplier_id: number | null;
  category?: Category;
  supplier?: Supplier;
}

export default function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Search
  const [searchProduct, setSearchProduct] = useState('');
  const [searchSupplier, setSearchSupplier] = useState('');
  // Category form state
  const [categoryName, setCategoryName] = useState('');
  // Supplier form state
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    contact: '',
    address: ''
  });
  
  // Product form state
  const [productFormData, setProductFormData] = useState({
    name: '',
    brand: '',
    category_id: '',
    cost_price: '',
    sell_price: '',
    quantity: '',
    supplier_id: '',
  });

  const supplierFormRef  = useRef<HTMLDivElement>(null);
  const productFormRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategories();
    fetchSuppliers();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    const response = await fetch('/api/categories');
    const data = await response.json();
    setCategories(data);
  };
  const fetchSuppliers = async () => {
    const response = await fetch('/api/suppliers');
    const data = await response.json();
    setSuppliers(data);
  };
  const fetchProducts = async () => {
    const response = await fetch('/api/products');
    const data = await response.json();
    setProducts(data);
  };

  // Category entry
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: categoryName }),
    });
    if (response.ok) {
      toast.success('Category added');
      setCategoryName('');
      fetchCategories();
    } else {
      toast.error('Failed to add category');
    }
  };

  // Supplier entry
  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierFormData.name.trim()) return;
    if (editingSupplier) {
      // Edit mode: update product
      const response = await fetch(`/api/suppliers/${editingSupplier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...supplierFormData
        }),
      });
      if (response.ok) {
        toast.success('Supplier updated successfully');
        fetchSuppliers();
        setEditingSupplier(null);
        setSupplierFormData({
          name: '', contact: '', address: ''
        });
      } else {
        toast.error('Failed to update supplier');
      }
    } else {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: supplierFormData.name, contact: supplierFormData.contact, address: supplierFormData.address }),
      });
      if (response.ok) {
        toast.success('Supplier added');
        setSupplierFormData({
          name: '',
          contact: '',
          address: ''
        });
        fetchSuppliers();
      } else {
        toast.error('Failed to add supplier');
      }
    }
  };

  // Product entry
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      // Edit mode: update product
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...productFormData,
          cost_price: parseFloat(productFormData.cost_price),
          sell_price: parseFloat(productFormData.sell_price),
          quantity: parseInt(productFormData.quantity),
          category_id: productFormData.category_id ? parseInt(productFormData.category_id) : null,
          supplier_id: productFormData.supplier_id ? parseInt(productFormData.supplier_id) : null,
        }),
      });
      if (response.ok) {
        toast.success('Product updated successfully');
        fetchProducts();
        setEditingProduct(null);
        setProductFormData({
          name: '', brand: '', category_id: '', cost_price: '', sell_price: '', quantity: '', supplier_id: '',
        });
      } else {
        toast.error('Failed to update product');
      }
    } else {
      // Add mode: create product
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...productFormData,
          cost_price: parseFloat(productFormData.cost_price),
          sell_price: parseFloat(productFormData.sell_price),
          quantity: parseInt(productFormData.quantity),
          category_id: productFormData.category_id ? parseInt(productFormData.category_id) : null,
          supplier_id: productFormData.supplier_id ? parseInt(productFormData.supplier_id) : null,
        }),
      });
      if (response.ok) {
        toast.success('Product added');
        setProductFormData({
          name: '', brand: '', category_id: '', cost_price: '', sell_price: '', quantity: '', supplier_id: '',
        });
        fetchProducts();
      } else {
        toast.error('Failed to add product');
      }
    }
  };

  const handleProductDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('Product deleted successfully');
        fetchProducts();
      } else {
        toast.error('Failed to delete product');
      }
    } catch (error) {
      toast.error('Error deleting product');
    }
  };

  const handleSupplierDelete = async (supplierId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const response = await fetch(`/api/suppliers/${supplierId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('Supplier deleted successfully');
        fetchProducts();
      } else {
        toast.error('Failed to delete Supplier');
      }
    } catch (error) {
      toast.error('Error deleting Supplier');
    }
  };

  // When editing, pre-fill the form
  useEffect(() => {
    if (editingProduct) {
      setProductFormData({
        name: editingProduct.name,
        brand: editingProduct.brand,
        category_id: editingProduct.category_id?.toString() || '',
        cost_price: editingProduct.cost_price.toString(),
        sell_price: editingProduct.sell_price.toString(),
        quantity: editingProduct.quantity.toString(),
        supplier_id: editingProduct.supplier_id?.toString() || '',
      });
    }
  }, [editingProduct]);

  useEffect(() => {
    if (editingSupplier) {
      setSupplierFormData({
        name: editingSupplier.name,
        contact: editingSupplier.contact,
        address: editingSupplier.address
      });
    }
  }, [editingSupplier]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-800 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-12 text-center text-white drop-shadow-lg">
          Product Management
        </h1>

        {/* Category Entry Section */}
        <div className="mb-8 backdrop-blur-md bg-white/10 p-6 rounded-2xl shadow-2xl border border-white/20 hover:bg-white/15 transition-all duration-300">
          <h2 className="text-2xl font-semibold mb-6 text-white drop-shadow-md">Add Category</h2>
          <form onSubmit={handleCategorySubmit} className="flex gap-4">
            <input
              type="text"
              placeholder="Category Name"
              className="backdrop-blur-sm bg-white/20 border border-white/30 p-3 rounded-xl flex-1 text-white placeholder-white/70 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all duration-300"
              value={categoryName}
              onChange={e => setCategoryName(e.target.value)}
              required
            />
            <button 
              type="submit" 
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-medium"
            >
              Add Category
            </button>
          </form>
        </div>

        {/* Supplier Entry Section */}
        <div className="mb-8 backdrop-blur-md bg-white/10 p-6 rounded-2xl shadow-2xl border border-white/20 hover:bg-white/15 transition-all duration-300" ref={supplierFormRef}>
          <h2 className="text-2xl font-semibold mb-6 text-white drop-shadow-md">
            {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
          </h2>
          <form onSubmit={handleSupplierSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Supplier Name"
              className="backdrop-blur-sm bg-white/20 border border-white/30 p-3 rounded-xl text-white placeholder-white/70 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all duration-300"
              value={supplierFormData.name}
              onChange={e => setSupplierFormData({...supplierFormData, name: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="Contact"
              className="backdrop-blur-sm bg-white/20 border border-white/30 p-3 rounded-xl text-white placeholder-white/70 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all duration-300"
              value={supplierFormData.contact}
              onChange={e => setSupplierFormData({...supplierFormData, contact: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="Address"
              className="backdrop-blur-sm bg-white/20 border border-white/30 p-3 rounded-xl text-white placeholder-white/70 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all duration-300"
              value={supplierFormData.address}
              onChange={e => setSupplierFormData({...supplierFormData, address: e.target.value})}
              required
            />
            <button 
              type="submit" 
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-medium md:col-span-3"
            >
              {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
            </button>
          </form>
        </div>

        {/* Supplier Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search Suppliers..."
            value={searchSupplier}
            onChange={e => setSearchSupplier(e.target.value)}
            className="w-full md:w-1/2 backdrop-blur-sm bg-white/20 border border-white/30 px-4 py-3 rounded-xl text-white placeholder-white/70 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all duration-300"
          />
        </div>

        {/* Supplier Table */}
        <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-2xl border border-white/20 overflow-hidden mb-12">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="backdrop-blur-sm bg-white/20 border-b border-white/20">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Address</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {suppliers
                  .filter(supplier =>
                    supplier.name.toLowerCase().includes(searchSupplier.toLowerCase()) ||
                    supplier.address.toLowerCase().includes(searchSupplier.toLowerCase())
                  )
                  .map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-white/5 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-white">{supplier.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-white/80">{supplier.contact}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-white/80">{supplier.address}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditingSupplier(supplier);
                            supplierFormRef.current?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="text-blue-400 hover:text-blue-300 mr-4 p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleSupplierDelete(supplier.id.toString())}
                          className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Entry Section */}
        <div className="mb-8 backdrop-blur-md bg-white/10 p-6 rounded-2xl shadow-2xl border border-white/20 hover:bg-white/15 transition-all duration-300" ref={productFormRef}>
          <h2 className="text-2xl font-semibold mb-6 text-white drop-shadow-md">
            {editingProduct ? 'Edit Product' : 'Add Product'}
          </h2>
          <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Product Name"
              className="backdrop-blur-sm bg-white/20 border border-white/30 p-3 rounded-xl text-white placeholder-white/70 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all duration-300"
              value={productFormData.name}
              onChange={e => setProductFormData({ ...productFormData, name: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Brand"
              className="backdrop-blur-sm bg-white/20 border border-white/30 p-3 rounded-xl text-white placeholder-white/70 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all duration-300"
              value={productFormData.brand}
              onChange={e => setProductFormData({ ...productFormData, brand: e.target.value })}
              required
            />
            <select
              className="backdrop-blur-sm bg-white/20 border border-white/30 p-3 rounded-xl text-white focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all duration-300"
              value={productFormData.category_id}
              onChange={e => setProductFormData({ ...productFormData, category_id: e.target.value })}
              required
            >
              <option value="" className="bg-gray-800">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-gray-800">{cat.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Cost Price"
              className="backdrop-blur-sm bg-white/20 border border-white/30 p-3 rounded-xl text-white placeholder-white/70 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all duration-300"
              value={productFormData.cost_price}
              onChange={e => setProductFormData({ ...productFormData, cost_price: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Sell Price"
              className="backdrop-blur-sm bg-white/20 border border-white/30 p-3 rounded-xl text-white placeholder-white/70 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all duration-300"
              value={productFormData.sell_price}
              onChange={e => setProductFormData({ ...productFormData, sell_price: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Quantity"
              className="backdrop-blur-sm bg-white/20 border border-white/30 p-3 rounded-xl text-white placeholder-white/70 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all duration-300"
              value={productFormData.quantity}
              onChange={e => setProductFormData({ ...productFormData, quantity: e.target.value })}
              required  
            />
            <select
              className="backdrop-blur-sm bg-white/20 border border-white/30 p-3 rounded-xl text-white focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all duration-300"
              value={productFormData.supplier_id}
              onChange={e => setProductFormData({ ...productFormData, supplier_id: e.target.value })}
              required
            >
              <option value="" className="bg-gray-800">Select Supplier</option>
              {suppliers.map(sup => (
                <option key={sup.id} value={sup.id} className="bg-gray-800">{sup.name}</option>
              ))}
            </select>
            <button 
              type="submit" 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-medium md:col-span-2 lg:col-span-3"
            >
              {editingProduct ? 'Update Product' : 'Add Product'}
            </button>
          </form>
        </div>

        {/* Product Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search products..."
            value={searchProduct}
            onChange={e => setSearchProduct(e.target.value)}
            className="w-full md:w-1/2 backdrop-blur-sm bg-white/20 border border-white/30 px-4 py-3 rounded-xl text-white placeholder-white/70 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all duration-300"
          />
        </div>

        {/* Products Table */}
        <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="backdrop-blur-sm bg-white/20 border-b border-white/20">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Brand</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Cost Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Sell Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {products
                  .filter(product =>
                    product.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
                    product.brand.toLowerCase().includes(searchProduct.toLowerCase()) ||
                    (product.category && product.category.name.toLowerCase().includes(searchProduct.toLowerCase())) ||
                    (product.supplier && product.supplier.name.toLowerCase().includes(searchProduct.toLowerCase()))
                  )
                  .map((product) => (
                    <tr key={product.id} className="hover:bg-white/5 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-white font-medium">{product.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-white/80">{product.brand}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-400 font-medium">₹{product.cost_price}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-emerald-400 font-medium">₹{product.sell_price}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-blue-400 font-medium">{product.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-white/80">{product.category ? product.category.name : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-white/80">{product.supplier ? product.supplier.name : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            productFormRef.current?.scrollIntoView({ behavior: 'smooth'});
                          }}
                          className="text-blue-400 hover:text-blue-300 mr-4 p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleProductDelete(product.id.toString())}
                          className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 