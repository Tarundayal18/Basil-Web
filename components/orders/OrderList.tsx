/**
 * This file contains the OrderList component which displays orders in both
 * mobile card view and desktop table view with compact styling.
 */

"use client";

import { Order, ordersService } from "@/services/orders.service";
import { useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";

interface OrderListProps {
  orders: Order[];
  onViewOrder: (id: string) => void;
}

/**
 * Calculates subtotal (base price without GST) and GST for an order.
 * Accounts for discounts and tax percentages per item.
 * @param order - The order to calculate values for
 * @returns Object with subtotal (base) and GST amounts
 */
function calculateOrderAmounts(order: Order) {
  let totalBase = 0;
  let totalGST = 0;

  order.orderItems.forEach((item) => {
    const taxPercentage = item.taxPercentage || 0;
    // Item subtotal already includes discount and GST
    // Calculate base price (without GST) from the subtotal
    if (taxPercentage > 0) {
      const basePrice = item.subtotal / (1 + taxPercentage / 100);
      const gstAmount = item.subtotal - basePrice;
      totalBase += basePrice;
      totalGST += gstAmount;
    } else {
      // No GST, so subtotal is the base price
      totalBase += item.subtotal;
    }
  });

  return { subtotal: totalBase, gst: totalGST };
}

export default function OrderList({ orders, onViewOrder }: OrderListProps) {
  const { trackButton, track, events } = useAnalytics("Order List", false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);

  /**
   * Handles downloading the PDF for a given order.
   * @param order - The order to download PDF for
   */
  const handleDownloadPdf = async (order: Order) => {
    if (!order.bill?.billNumber) {
      alert("Bill number not available for this order");
      return;
    }

    trackButton("Download PDF", {
      location: "order_list",
      order_id: order.id,
      bill_number: order.bill?.billNumber,
    });
    track(events.ORDER_VIEWED, {
      action: "pdf_downloaded",
      order_id: order.id,
    });
    setDownloading(order.id);
    try {
      await ordersService.downloadBillPdf(
        order.bill.pdfUrl || "",
        order.bill.billNumber,
        order.id
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to download PDF");
    } finally {
      setDownloading(null);
    }
  };

  const handleRegeneratePdf = async (order: Order) => {
    if (!order.bill?.billNumber) {
      alert("Bill number not available for this order");
      return;
    }
    setRegenerating(order.id);
    try {
      await ordersService.generateBill(order.id);
      alert("PDF queued for regeneration. It will show as Ready once generated.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to regenerate PDF");
    } finally {
      setRegenerating(null);
    }
  };

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-1.5">
        {orders.map((order) => {
          const { subtotal, gst } = calculateOrderAmounts(order);
          return (
            <div
              key={order.id}
              className="bg-white rounded border border-gray-200 p-3"
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xs font-semibold text-gray-900">
                      #{order.id.slice(-8)}
                    </h3>
                    <span className="text-[10px] text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-700 font-medium truncate">
                    {order.customerName || "No customer"}
                  </p>
                  {order.customerPhone && (
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {order.customerPhone}
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {order.bill?.billNumber && (
                    <>
                      <span
                        className={[
                          "px-2 py-1 text-[10px] rounded border font-medium",
                          order.bill?.pdfStatus === "READY"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : order.bill?.pdfStatus === "FAILED"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-yellow-50 text-yellow-800 border-yellow-200",
                        ].join(" ")}
                        title="PDF status"
                      >
                        {order.bill?.pdfStatus === "READY"
                          ? "Ready"
                          : order.bill?.pdfStatus === "FAILED"
                          ? "Failed"
                          : "Queued"}
                      </span>
                      <button
                        onClick={() => handleRegeneratePdf(order)}
                        disabled={regenerating === order.id}
                        className="px-2 py-1 text-[10px] bg-gray-900 text-white rounded hover:bg-black transition-colors font-medium disabled:opacity-50"
                        title="Regenerate PDF"
                      >
                        {regenerating === order.id ? "..." : "Regen"}
                      </button>
                      <button
                        onClick={() => handleDownloadPdf(order)}
                        disabled={downloading === order.id}
                        className="px-2 py-1 text-[10px] bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                        title="Download PDF"
                      >
                        {downloading === order.id ? "..." : "PDF"}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => onViewOrder(order.id)}
                    className="px-2 py-1 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                  >
                    View
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Subtotal:</span>
                  <span className="text-gray-700 font-medium">
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">GST:</span>
                  <span className="text-gray-700 font-medium">
                    ₹{gst.toFixed(2)}
                  </span>
                </div>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Total:</span>
                  <span className="text-gray-900 font-semibold">
                    ₹{order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto p-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bill ID
                </th>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subtotal
                </th>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GST
                </th>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => {
                const { subtotal, gst } = calculateOrderAmounts(order);
                return (
                  <tr key={order.id}>
                    <td className="px-2 py-1.5 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id.slice(-8)}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-500">
                      {order.customerName || "-"}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-500">
                      {order.customerPhone || "-"}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-500">
                      ₹{subtotal.toFixed(2)}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-500">
                      ₹{gst.toFixed(2)}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-500 font-medium">
                      ₹{order.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        {order.bill?.billNumber && (
                          <>
                            <span
                              className={[
                                "px-2 py-1 text-[11px] rounded border font-medium",
                                order.bill?.pdfStatus === "READY"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : order.bill?.pdfStatus === "FAILED"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-yellow-50 text-yellow-800 border-yellow-200",
                              ].join(" ")}
                            >
                              {order.bill?.pdfStatus === "READY"
                                ? "Ready"
                                : order.bill?.pdfStatus === "FAILED"
                                ? "Failed"
                                : "Queued"}
                            </span>
                            <button
                              onClick={() => handleRegeneratePdf(order)}
                              disabled={regenerating === order.id}
                              className="text-gray-900 hover:text-black disabled:opacity-50"
                              title="Regenerate PDF"
                            >
                              {regenerating === order.id ? "..." : "Regenerate"}
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(order)}
                              disabled={downloading === order.id}
                              className="text-green-600 hover:text-green-800 disabled:opacity-50 flex items-center gap-1"
                              title="Download PDF"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              {downloading === order.id ? "..." : "PDF"}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            trackButton("View Order", {
                              location: "order_list",
                              order_id: order.id,
                            });
                            track(events.ORDER_VIEWED, { order_id: order.id });
                            onViewOrder(order.id);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
