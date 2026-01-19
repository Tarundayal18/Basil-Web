/**
 * Inventory Management Example
 * Enterprise-level example showing inventory operations
 */

'use client';

import React, { useState } from 'react';
import { useShopkeeperInventory } from '@/hooks/useShopkeeperInventory';
import { validateProductData } from '@/lib/api-validator';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorAlert } from '@/components/ErrorAlert';

export function InventoryExample() {
  const {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    createProduct,
    updateProduct,
    deleteProduct,
    clearError,
  } = useShopkeeperInventory(20);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sellingPrice: '',
    categoryId: '',
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    clearError();

    const validation = validateProductData({
      name: formData.name,
      price: parseFloat(formData.sellingPrice),
    });

    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    try {
      const response = await createProduct({
        name: formData.name.trim(),
        sellingPrice: parseFloat(formData.sellingPrice),
        categoryId: formData.categoryId || undefined,
      });

      if (response.success) {
        setShowCreateForm(false);
        setFormData({ name: '', sellingPrice: '', categoryId: '' });
      }
    } catch (err) {
      console.error('Create product error:', err);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await deleteProduct(itemId);
    } catch (err) {
      console.error('Delete product error:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventory</h1>
        <div className="space-x-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showCreateForm ? 'Cancel' : 'Add Product'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4">
          <ErrorAlert error={error} onDismiss={clearError} />
        </div>
      )}

      {/* Create Product Form */}
      {showCreateForm && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Create New Product</h2>
          <form onSubmit={handleCreateProduct}>
            {validationErrors.length > 0 && (
              <ErrorAlert error={validationErrors.join(', ')} />
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category ID (Optional)
                </label>
                <input
                  type="text"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </form>
        </div>
      )}

      {/* Inventory List */}
      {loading && items.length === 0 ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Loading inventory..." />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Selling Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{item.sellingPrice?.toFixed(2) || item.mrp?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.categoryId || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}

          {items.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              No products found. Create your first product!
            </div>
          )}
        </>
      )}
    </div>
  );
}
