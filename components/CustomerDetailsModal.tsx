"use client";

import { useState, useEffect } from "react";
import { X, Phone, Mail, Download } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import {
  customersService,
  CustomerDetails,
} from "@/services/customers.service";
import { ordersService } from "@/services/orders.service";
import { JobCard } from "@/services/jobCards.service";
import CustomerLifetimeValueWidget from "@/components/ai/CustomerLifetimeValueWidget";

interface CustomerDetailsModalProps {
  customerId: string;
  onClose: () => void;
}

export default function CustomerDetailsModal({
  customerId,
  onClose,
}: CustomerDetailsModalProps) {
  const { trackButton } = useAnalytics("Customer Details Modal", false);
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingType, setSavingType] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loadingJobCards, setLoadingJobCards] = useState(false);
  const [analytics, setAnalytics] = useState<{
    totalJobCards: number;
    totalRevenue: number;
    lastVisitDate: string | null;
    firstVisitDate: string | null;
    averageCostPerVisit: number;
  } | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    fetchCustomerDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await customersService.getCustomerDetails(customerId);
      setCustomer(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load customer details"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (
    orderId: string,
    billNumber: string,
    pdfUrl?: string
  ) => {
    trackButton("Download PDF", {
      location: "customer_details_modal",
      order_id: orderId,
      bill_number: billNumber,
    });
    if (!pdfUrl) {
      alert("PDF not available for this bill");
      return;
    }

    setDownloading(orderId);
    try {
      await ordersService.downloadBillPdf(pdfUrl, billNumber, orderId);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to download PDF");
    } finally {
      setDownloading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const normalizeCustomerType = (customerType?: string) => {
    const s = (customerType || "retail").toLowerCase();
    if (s === "regular") return "retail";
    return s;
  };

  const handleCustomerTypeChange = async (nextType: string) => {
    if (!customer) return;
    try {
      setSavingType(true);
      setError("");
      const updated = await customersService.updateCustomer(customerId, {
        customerType: nextType,
      });
      setCustomer((prev) =>
        prev ? { ...prev, customerType: updated.customerType } : prev
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update customer type");
    } finally {
      setSavingType(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading customer details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Customer Details
            </h2>
            <button
              onClick={() => {
                trackButton("Close", {
                  location: "customer_details_modal_header",
                });
                onClose();
              }}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center py-12">
            <p className="text-red-600">{error || "Customer not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Customer Details</h2>
          <button
            onClick={() => {
              trackButton("Close", { location: "customer_details_modal_body" });
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Lifetime Value Widget */}
        <div className="mb-6">
          <CustomerLifetimeValueWidget customerId={customerId} compact={false} />
        </div>

        {/* Customer Information */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Customer Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="text-base font-medium text-gray-900">
                {customer.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <p className="text-base font-medium text-gray-900">
                  {customer.phone}
                </p>
              </div>
            </div>
            {customer.email && (
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="text-base font-medium text-gray-900">
                    {customer.email}
                  </p>
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Customer Type</p>
              <div className="flex items-center gap-2">
                <select
                  value={normalizeCustomerType(customer.customerType)}
                  onChange={(e) => handleCustomerTypeChange(e.target.value)}
                  disabled={savingType}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                >
                  <option value="retail">Retail</option>
                  <option value="wholesale">Wholesale</option>
                  <option value="corporate">Corporate</option>
                  <option value="vip">VIP</option>
                </select>
                {savingType && (
                  <span className="text-xs text-gray-500">Saving...</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-base font-medium text-gray-900">
                {customer.ordersCount || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Lifetime Value</p>
              <p className="text-base font-medium text-gray-900">
                {formatCurrency(customer.lifetimeValue || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Order History ({customer.orders.length})
          </h3>
          {customer.orders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No orders found</p>
          ) : (
            <div className="space-y-4">
              {customer.orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Order #{order.id.slice(-8)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.store.name} • {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          order.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-2">Items:</div>
                    <div className="space-y-1">
                      {order.orderItems.map((item) => {
                        const productName =
                          item.product?.name ||
                          item.productName ||
                          "Unknown Product";
                        return (
                          <div
                            key={item.id}
                            className="flex justify-between text-sm text-gray-700"
                          >
                            <span>
                              {productName} × {item.quantity}
                            </span>
                            <span>{formatCurrency(item.subtotal)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bill Actions */}
                  {order.bill && (
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <div className="text-sm text-gray-600">
                        Bill: {order.bill.billNumber}
                      </div>
                      {order.bill.pdfUrl && (
                        <button
                          onClick={() =>
                            handleDownloadPdf(
                              order.id,
                              order.bill!.billNumber,
                              order.bill!.pdfUrl
                            )
                          }
                          disabled={downloading === order.id}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          {downloading === order.id
                            ? "Downloading..."
                            : "Download PDF"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
