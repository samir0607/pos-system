'use client';

import { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  name: string;
  contact: string;
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
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');

  // Category form state
  const [categoryName, setCategoryName] = useState('');
  // Supplier form state
  const [supplierName, setSupplierName] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  // Product form state
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category_id: '',
    cost_price: '',
    sell_price: '',
    quantity: '',
    supplier_id: '',
  });

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
    if (!supplierName.trim()) return;
    const response = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: supplierName, contact: supplierContact }),
    });
    if (response.ok) {
      toast.success('Supplier added');
      setSupplierName('');
      setSupplierContact('');
      fetchSuppliers();
    } else {
      toast.error('Failed to add supplier');
    }
  };

  // Product entry
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        cost_price: parseFloat(formData.cost_price),
        sell_price: parseFloat(formData.sell_price),
        quantity: parseInt(formData.quantity),
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
      }),
    });
    if (response.ok) {
      toast.success('Product added');
      setFormData({
        name: '', brand: '', category_id: '', cost_price: '', sell_price: '', quantity: '', supplier_id: '',
      });
      fetchProducts();
    } else {
      toast.error('Failed to add product');
    }
  };

  const handleDelete = async (productId: string) => {
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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        toast.success('Product updated successfully');
        fetchProducts();
        setEditingProduct(null);
        setFormData({
          name: '',
          brand: '',
          category_id: '',
          cost_price: '',
          sell_price: '',
          quantity: '',
          supplier_id: '',
        });
      } else {
        toast.error('Failed to update product');
      }
    } catch (error) {
      toast.error('Error updating product');
    }
  };

  // When editing, pre-fill the form
  useEffect(() => {
    if (editingProduct) {
      setFormData({
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Product Management</h1>
      {/* Category Entry Section */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Add Category</h2>
        <form onSubmit={handleCategorySubmit} className="flex gap-4">
          <input
            type="text"
            placeholder="Category Name"
            className="border p-2 rounded flex-1"
            value={categoryName}
            onChange={e => setCategoryName(e.target.value)}
            required
          />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Add Category</button>
        </form>
      </div>
      {/* Supplier Entry Section */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Add Supplier</h2>
        <form onSubmit={handleSupplierSubmit} className="flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Supplier Name"
            className="border p-2 rounded flex-1"
            value={supplierName}
            onChange={e => setSupplierName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Contact"
            className="border p-2 rounded flex-1"
            value={supplierContact}
            onChange={e => setSupplierContact(e.target.value)}
            required
          />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Add Supplier</button>
        </form>
      </div>
      {/* Product Entry Section */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Add Product</h2>
        <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Product Name"
            className="border p-2 rounded"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Brand"
            className="border p-2 rounded"
            value={formData.brand}
            onChange={e => setFormData({ ...formData, brand: e.target.value })}
            required
          />
          <select
            className="border p-2 rounded"
            value={formData.category_id}
            onChange={e => setFormData({ ...formData, category_id: e.target.value })}
            required
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Cost Price"
            className="border p-2 rounded"
            value={formData.cost_price}
            onChange={e => setFormData({ ...formData, cost_price: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Sell Price"
            className="border p-2 rounded"
            value={formData.sell_price}
            onChange={e => setFormData({ ...formData, sell_price: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Quantity"
            className="border p-2 rounded"
            value={formData.quantity}
            onChange={e => setFormData({ ...formData, quantity: e.target.value })}
            required  
          />
          <select
            className="border p-2 rounded"
            value={formData.supplier_id}
            onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
            required
          >
            <option value="">Select Supplier</option>
            {suppliers.map(sup => (
              <option key={sup.id} value={sup.id}>{sup.name}</option>
            ))}
          </select>
          <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 col-span-1 md:col-span-2">{editingProduct ? 'Update Product' : 'Add Product'}</button>
        </form>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 border rounded shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sell Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products
              .filter(product =>
                product.name.toLowerCase().includes(search.toLowerCase()) ||
                product.brand.toLowerCase().includes(search.toLowerCase()) ||
                (product.category && product.category.name.toLowerCase().includes(search.toLowerCase())) ||
                (product.supplier && product.supplier.name.toLowerCase().includes(search.toLowerCase()))
              )
              .map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.brand}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{product.cost_price}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{product.sell_price}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.category ? product.category.name : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.supplier ? product.supplier.name : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id.toString())}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 