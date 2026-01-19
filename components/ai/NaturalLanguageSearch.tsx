"use client";

import { useState } from "react";
import { aiService } from "@/services/ai.service";
import { Search, Loader2, Sparkles, FileText, Package, Users, Calendar, IndianRupee, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

// Helper component to display search results in human-readable format
function SearchResultsDisplay({ data }: { data: any }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        No results to display
      </div>
    );
  }

  // Check the first item to determine data type
  const firstItem = data[0];
  
  // PRIORITY 1: Detect Product Sales (aggregated sales data) - has productId/productName + totalQuantity
  if ((firstItem.productId || firstItem.productName) && firstItem.totalQuantity !== undefined) {
    return <ProductSalesResultsDisplay productSales={data} />;
  }
  
  // PRIORITY 2: Detect if it's a Product (inventory/product info)
  if (firstItem.name && (firstItem.costPrice !== undefined || (firstItem.quantity !== undefined && !firstItem.totalQuantity))) {
    return <ProductResultsDisplay products={data} />;
  }
  
  // PRIORITY 3: Detect if it's an Order/Invoice (has billNumber, status, or customer info without productId)
  if ((firstItem.billNumber || firstItem.invoiceNumber || firstItem.status) && !firstItem.productId) {
    return <OrderResultsDisplay orders={data} />;
  }
  
  // PRIORITY 4: Detect if it's a Customer (has customer info but no billNumber or productId)
  if (firstItem.customerName && firstItem.customerPhone && !firstItem.billNumber && !firstItem.productId) {
    return <CustomerResultsDisplay customers={data} />;
  }
  
  // Default: display as formatted JSON with better styling
  return <FormattedJSONDisplay data={data} />;
}

// Display Product Sales (Aggregated Sales Data)
function ProductSalesResultsDisplay({ productSales }: { productSales: any[] }) {
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return "₹0.00";
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Top Products Sold ({productSales.length})
        </h4>
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {productSales.map((product, idx) => (
          <div
            key={product.productId || idx}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-indigo-600">#{idx + 1}</span>
                  <div className="font-semibold text-gray-900 text-lg">
                    {product.productName || product.productId || `Product #${idx + 1}`}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-xs text-blue-600 mb-1">Quantity Sold</div>
                    <div className="text-xl font-bold text-blue-900">{product.totalQuantity || 0} units</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-xs text-green-600 mb-1">Total Revenue</div>
                    <div className="text-xl font-bold text-green-900">{formatCurrency(product.totalAmount)}</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-xs text-purple-600 mb-1">Orders</div>
                    <div className="text-xl font-bold text-purple-900">{product.orderCount || 0}</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-xs text-orange-600 mb-1">Avg per Order</div>
                    <div className="text-xl font-bold text-orange-900">
                      {product.orderCount 
                        ? formatCurrency((product.totalAmount || 0) / product.orderCount)
                        : formatCurrency(0)
                      }
                    </div>
                  </div>
                </div>
              </div>
              {product.productId && (
                <Link
                  href={`/products?productId=${product.productId}`}
                  className="ml-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap"
                >
                  View Product →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Display Orders/Invoices
function OrderResultsDisplay({ orders }: { orders: any[] }) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return "₹0.00";
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Orders & Invoices ({orders.length})
        </h4>
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {orders.map((order, idx) => (
          <div
            key={order.id || idx}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-900">
                    {order.billNumber || order.invoiceNumber || `Order #${(idx + 1).toString().padStart(4, "0")}`}
                  </span>
                  {order.status && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      order.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : order.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {order.status}
                    </span>
                  )}
                  {order.orderType && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                      {order.orderType}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {order.customerName && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Users className="w-3 h-3 text-gray-400" />
                      <span>{order.customerName}</span>
                    </div>
                  )}
                  {order.createdAt && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                  )}
                  {order.totalAmount !== undefined && (
                    <div className="flex items-center gap-2 text-gray-900 font-semibold">
                      <IndianRupee className="w-3 h-3 text-gray-400" />
                      <span>{formatCurrency(order.totalAmount)}</span>
                    </div>
                  )}
                  {order.customerPhone && (
                    <div className="text-xs text-gray-500">
                      Phone: {order.customerPhone}
                    </div>
                  )}
                </div>
                {order.billingAddress && (
                  <div className="text-xs text-gray-500 mt-2">
                    {order.billingAddress}
                  </div>
                )}
              </div>
              {order.id && (
                <Link
                  href={`/invoices?orderId=${order.id}`}
                  className="ml-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap"
                >
                  View Invoice →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Display Products
function ProductResultsDisplay({ products }: { products: any[] }) {
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return "₹0.00";
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Products ({products.length})
        </h4>
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {products.map((product, idx) => (
          <div
            key={product.id || idx}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-2">
                  {product.name || product.productName || `Product #${idx + 1}`}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {product.hsnCode && (
                    <div>
                      <span className="text-xs text-gray-500">HSN:</span>
                      <span className="ml-1 text-gray-700">{product.hsnCode}</span>
                    </div>
                  )}
                  {product.quantity !== undefined && (
                    <div>
                      <span className="text-xs text-gray-500">Stock:</span>
                      <span className={`ml-1 font-medium ${
                        (product.quantity ?? 0) < (product.lowStockAlert ?? 10) ? "text-red-600" : "text-gray-700"
                      }`}>
                        {product.quantity ?? 0}
                      </span>
                    </div>
                  )}
                  {product.costPrice !== undefined && (
                    <div>
                      <span className="text-xs text-gray-500">Cost:</span>
                      <span className="ml-1 text-gray-700">{formatCurrency(product.costPrice)}</span>
                    </div>
                  )}
                  {product.sellingPrice !== undefined && (
                    <div>
                      <span className="text-xs text-gray-500">Price:</span>
                      <span className="ml-1 font-semibold text-gray-900">{formatCurrency(product.sellingPrice)}</span>
                    </div>
                  )}
                  {product.taxPercentage !== undefined && (
                    <div>
                      <span className="text-xs text-gray-500">GST:</span>
                      <span className="ml-1 text-gray-700">{product.taxPercentage}%</span>
                    </div>
                  )}
                  {product.marginPercentage !== undefined && (
                    <div>
                      <span className="text-xs text-gray-500">Margin:</span>
                      <span className="ml-1 text-gray-700">{product.marginPercentage.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </div>
              {product.id && (
                <Link
                  href={`/products?productId=${product.id}`}
                  className="ml-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap"
                >
                  View →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Display Customers
function CustomerResultsDisplay({ customers }: { customers: any[] }) {
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return "₹0.00";
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Customers ({customers.length})
        </h4>
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {customers.map((customer, idx) => (
          <div
            key={customer.id || customer.customerId || idx}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-2">
                  {customer.customerName || customer.name || `Customer #${idx + 1}`}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                  {customer.customerPhone && (
                    <div>Phone: {customer.customerPhone}</div>
                  )}
                  {customer.email && (
                    <div>Email: {customer.email}</div>
                  )}
                  {customer.billingAddress && (
                    <div className="md:col-span-2 text-xs text-gray-500">
                      {customer.billingAddress}
                    </div>
                  )}
                  {customer.totalOrders !== undefined && (
                    <div>Orders: {customer.totalOrders}</div>
                  )}
                  {customer.lifetimeValue !== undefined && (
                    <div>Lifetime Value: {formatCurrency(customer.lifetimeValue)}</div>
                  )}
                </div>
              </div>
              {(customer.id || customer.customerId) && (
                <Link
                  href={`/customers/${customer.id || customer.customerId}`}
                  className="ml-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap"
                >
                  View →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Fallback: Formatted JSON display (better than raw JSON)
function FormattedJSONDisplay({ data }: { data: any }) {
  if (!Array.isArray(data)) {
    // Single object or primitive
    return (
      <div className="bg-white border border-gray-200 rounded p-3">
        <div className="text-sm text-gray-700">
          <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(data, null, 2)}</pre>
        </div>
      </div>
    );
  }

  // Array of objects - show count and first few items
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-gray-900">
        Found {data.length} result{data.length !== 1 ? "s" : ""}
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {data.slice(0, 20).map((item, idx) => (
          <div
            key={idx}
            className="bg-white border border-gray-200 rounded-lg p-3 text-xs"
          >
            <pre className="whitespace-pre-wrap text-gray-700">
              {JSON.stringify(item, null, 2)}
            </pre>
          </div>
        ))}
        {data.length > 20 && (
          <div className="text-center text-xs text-gray-500 py-2">
            ... and {data.length - 20} more results
          </div>
        )}
      </div>
    </div>
  );
}

interface NaturalLanguageSearchProps {
  onResult?: (result: any) => void;
  placeholder?: string;
  compact?: boolean;
}

export default function NaturalLanguageSearch({
  onResult,
  placeholder = "Ask anything about your business...",
  compact = false,
}: NaturalLanguageSearchProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const response = await aiService.naturalLanguageSearch({ query: query.trim() });
      setResult(response);
      if (onResult) {
        onResult(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process query");
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          disabled={loading}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-600 animate-spin" />
        )}
      </form>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI Search</h3>
      </div>

      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={loading}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-600 animate-spin" />
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="mt-3 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-start gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-900 whitespace-pre-wrap font-medium">{result.answer}</p>
              {/* CRITICAL FIX: Removed confidence score display - it's for backend/internal use only, not for customers */}
            </div>
          </div>
          
          {/* Actions */}
          {result.actions && result.actions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-2">Recommended Actions:</p>
              <div className="flex flex-wrap gap-2">
                {result.actions.map((action: { label: string; action: string; url?: string }, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (action.url) {
                        window.location.href = action.url;
                      }
                    }}
                    className="px-3 py-1.5 text-xs bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Charts (if available) */}
          {result.charts && result.charts.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-2">Visualizations:</p>
              <div className="space-y-3">
                {result.charts.map((chart: { type: "bar" | "line" | "pie" | "table"; title: string; data: any }, idx: number) => (
                  <div key={idx} className="bg-white rounded p-3 border border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">{chart.title}</p>
                    <div className="text-xs text-gray-500">
                      {chart.type === "bar" && (
                        <div className="space-y-1">
                          {chart.data.labels?.map((label: string, i: number) => {
                            // CRITICAL FIX: Check if chart is for quantity (no rupee symbol) or revenue (with rupee symbol)
                            const isQuantityChart = chart.title?.toLowerCase().includes("quantity") || 
                                                   chart.title?.toLowerCase().includes("units") ||
                                                   chart.title?.toLowerCase().includes("sold");
                            const value = chart.data.values[i];
                            const formattedValue = isQuantityChart 
                              ? `${value?.toFixed(0) || 0} ${value === 1 ? 'unit' : 'units'}` // Quantity: no rupee symbol
                              : `₹${value?.toFixed(2) || '0.00'}`; // Revenue: with rupee symbol
                            
                            return (
                              <div key={i} className="flex items-center gap-2">
                                <span className="w-24 truncate">{label}:</span>
                                <div className="flex-1 bg-gray-200 rounded h-4 relative">
                                  <div
                                    className="bg-indigo-600 h-4 rounded"
                                    style={{
                                      width: `${(chart.data.values[i] / Math.max(...chart.data.values)) * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="w-20 text-right">{formattedValue}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {chart.type === "pie" && (
                        <div className="space-y-1">
                          {chart.data.labels?.map((label: string, i: number) => {
                            // CRITICAL FIX: Check if chart is for quantity (no rupee symbol) or revenue (with rupee symbol)
                            const isQuantityChart = chart.title?.toLowerCase().includes("quantity") || 
                                                   chart.title?.toLowerCase().includes("units") ||
                                                   chart.title?.toLowerCase().includes("sold");
                            const value = chart.data.values?.[i] || 0;
                            const formattedValue = typeof value === "number"
                              ? (isQuantityChart 
                                  ? `${value.toFixed(0)} ${value === 1 ? 'unit' : 'units'}` // Quantity: no rupee symbol
                                  : `₹${value.toFixed(2)}`) // Revenue: with rupee symbol
                              : value;
                            
                            return (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <span>{label}:</span>
                                <span className="font-medium">{formattedValue}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Data Display */}
          {result.data && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <SearchResultsDisplay data={result.data} />
            </div>
          )}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p className="mb-1">Try asking:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-400">
          <li>"Show me top items sold last month"</li>
          <li>"Why is GST higher this quarter?"</li>
          <li>"Which vendor increased prices?"</li>
        </ul>
      </div>
    </div>
  );
}

