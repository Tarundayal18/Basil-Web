"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAnalytics } from "@/hooks/useAnalytics";
import {
  publicProductService,
  type PublicProduct,
} from "@/services/publicProduct.service";

/**
 * Public product page - displays product information from QR code scan
 */
export default function PublicProductPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const productId = params.productId as string;
  useAnalytics("Public Product Page", true);
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await publicProductService.getProduct(storeId, productId);
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    if (storeId && productId) {
      fetchProduct();
    }
  }, [storeId, productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            {product.store && (
              <p className="text-indigo-100 text-sm">{product.store.name}</p>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Pricing */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Pricing
                </h2>
                <div className="space-y-3">
                  {product.mrp && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">MRP:</span>
                      <span className="text-lg font-semibold text-gray-900">
                        ₹{product.mrp.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {product.sellingPrice && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Selling Price:</span>
                      <span className="text-xl font-bold text-indigo-600">
                        ₹{product.sellingPrice.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {product.mrp && product.sellingPrice && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">You Save:</span>
                        <span className="text-lg font-semibold text-green-600">
                          ₹{(product.mrp - product.sellingPrice).toFixed(2)}
                        </span>
                      </div>
                      {product.mrp > 0 && (
                        <div className="text-sm text-gray-500 mt-1 text-right">
                          (
                          {(
                            ((product.mrp - product.sellingPrice) /
                              product.mrp) *
                            100
                          ).toFixed(0)}
                          % off)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Product Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Product Information
                </h2>
                <div className="space-y-3">
                  {product.category && (
                    <div>
                      <span className="text-gray-600 text-sm">Category:</span>
                      <p className="text-gray-900 font-medium">
                        {product.category.name}
                      </p>
                    </div>
                  )}
                  {product.subcategory && (
                    <div>
                      <span className="text-gray-600 text-sm">
                        Subcategory:
                      </span>
                      <p className="text-gray-900 font-medium">
                        {product.subcategory.name}
                      </p>
                    </div>
                  )}
                  {product.manufacturer && (
                    <div>
                      <span className="text-gray-600 text-sm">
                        Manufacturer:
                      </span>
                      <p className="text-gray-900 font-medium">
                        {product.manufacturer.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* QR Code Info */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-sm text-indigo-800">
                <span className="font-semibold">Scanned from QR Code</span> -
                This product information is available for your convenience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
