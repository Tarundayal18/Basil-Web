import { Order, ordersService } from "@/services/orders.service";
import { useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";

interface OrderModalProps {
  order: Order;
  onClose: () => void;
}

/**
 * OrderModal component displays detailed information about a bill/order
 * including customer details, items, and totals with improved UI/UX
 */
export default function OrderModal({ order, onClose }: OrderModalProps) {
  const { trackButton, events } = useAnalytics("Order Modal", false);
  const [downloading, setDownloading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  /**
   * Handles downloading the PDF bill
   */
  const handleDownloadPdf = async () => {
    if (!order.bill?.billNumber) {
      alert("Bill number not available for this order");
      return;
    }

    trackButton("Download PDF", {
      location: "order_modal",
      order_id: order.id,
      bill_number: order.bill?.billNumber,
    });
    setDownloading(true);
    try {
      await ordersService.downloadBillPdf(
        order.bill.pdfUrl || "",
        order.bill.billNumber,
        order.id
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  /**
   * Handles regenerating the PDF bill
   */
  const handleRegeneratePdf = async () => {
    trackButton("Regenerate PDF", {
      location: "order_modal",
      order_id: order.id,
      bill_number: order.bill?.billNumber,
    });
    setRegenerating(true);
    try {
      await ordersService.generateBill(order.id);
      alert(
        "Bill PDF regeneration queued. Please refresh the page in a moment."
      );
      // Optionally refresh the order data or close modal
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to regenerate PDF. Please try again."
      );
    } finally {
      setRegenerating(false);
    }
  };

  /**
   * Handles sending invoice via WhatsApp
   */
  const handleSendWhatsApp = async () => {
    if (!order.customerPhone) {
      alert("Customer phone number not available");
      return;
    }

    if (!order.bill?.pdfUrl) {
      alert("PDF not available for this bill. Please regenerate it first.");
      return;
    }

    trackButton("Send WhatsApp", {
      location: "order_modal",
      order_id: order.id,
      bill_number: order.bill?.billNumber,
    });
    setSendingWhatsApp(true);
    try {
      await ordersService.sendWhatsApp(order.id, order.store?.id);
      alert("Invoice sent via WhatsApp successfully!");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to send WhatsApp. Please try again."
      );
    } finally {
      setSendingWhatsApp(false);
    }
  };

  /**
   * Handles sending invoice via Email
   */
  const handleSendEmail = async () => {
    if (!order.customerEmail) {
      alert("Customer email not available");
      return;
    }

    if (!order.bill?.pdfUrl) {
      alert("PDF not available for this bill. Please regenerate it first.");
      return;
    }

    trackButton("Send Email", {
      location: "order_modal",
      order_id: order.id,
      bill_number: order.bill?.billNumber,
    });
    setSendingEmail(true);
    try {
      await ordersService.sendEmail(order.id, order.store?.id);
      alert("Invoice sent via email successfully!");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to send email. Please try again."
      );
    } finally {
      setSendingEmail(false);
    }
  };

  // Calculate totals
  let totalBase = 0;
  let totalGST = 0;
  order.orderItems.forEach((item) => {
    const taxPercentage = item.taxPercentage || 0;
    if (taxPercentage > 0) {
      const basePrice = item.subtotal / (1 + taxPercentage / 100);
      const gstAmount = item.subtotal - basePrice;
      totalBase += basePrice;
      totalGST += gstAmount;
    } else {
      totalBase += item.subtotal;
    }
  });

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div
          className="flex justify-between items-center px-6 py-4 border-b border-gray-200"
          style={{
            background:
              "linear-gradient(to right, rgba(70, 73, 158, 0.1), rgba(225, 176, 209, 0.1))",
          }}
        >
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bill Details</h2>
            {order.bill && (
              <p className="text-sm text-gray-600 mt-1">
                Bill # {order.bill.billNumber}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-white rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          <div className="space-y-6">
            {/* Bill Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Customer Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start">
                    <span className="text-gray-500 w-24 flex-shrink-0">
                      Name:
                    </span>
                    <span className="text-gray-900 font-medium">
                      {order.customerName || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-gray-500 w-24 flex-shrink-0">
                      Phone:
                    </span>
                    <span className="text-gray-900">
                      {order.customerPhone || "N/A"}
                    </span>
                  </div>
                  {(order as any).customerEmail && (
                    <div className="flex items-start">
                      <span className="text-gray-500 w-24 flex-shrink-0">
                        Email:
                      </span>
                      <span className="text-gray-900">
                        {(order as any).customerEmail}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Bill Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start">
                    <span className="text-gray-500 w-24 flex-shrink-0">
                      Date:
                    </span>
                    <span className="text-gray-900">
                      {new Date(order.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-gray-500 w-24 flex-shrink-0">
                      Status:
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : order.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-gray-500 w-24 flex-shrink-0">
                      Bill ID:
                    </span>
                    <span className="text-gray-900 font-mono text-xs">
                      {order.id.slice(-8)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill Items */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Bill Items
              </h3>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {order.orderItems.map((item) => {
                  const discountPercentage = item.discountPercentage || 0;
                  const taxPercentage = item.taxPercentage || 0;
                  const productName =
                    item.product?.name || item.productName || "Unknown Product";
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {productName}
                      </h4>
                      {item.product?.barcode && (
                        <p className="text-xs text-gray-500 mb-3">
                          Barcode: {item.product.barcode}
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-50 rounded p-2">
                          <span className="text-gray-500 text-xs">
                            Quantity
                          </span>
                          <p className="text-gray-900 font-semibold mt-1">
                            {item.quantity}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded p-2">
                          <span className="text-gray-500 text-xs">Rate</span>
                          <p className="text-gray-900 font-semibold mt-1">
                            ₹{item.price.toFixed(2)}
                          </p>
                        </div>
                        {discountPercentage > 0 && (
                          <div
                            className="rounded p-2"
                            style={{
                              backgroundColor: "rgba(241, 176, 43, 0.15)",
                            }}
                          >
                            <span
                              className="text-xs"
                              style={{ color: "#f1b02b" }}
                            >
                              Discount
                            </span>
                            <p
                              className="font-semibold mt-1"
                              style={{ color: "#f1b02b" }}
                            >
                              {discountPercentage.toFixed(2)}%
                            </p>
                          </div>
                        )}
                        {taxPercentage > 0 && (
                          <div
                            className="rounded p-2"
                            style={{
                              backgroundColor: "rgba(70, 73, 158, 0.15)",
                            }}
                          >
                            <span
                              className="text-xs"
                              style={{ color: "#46499e" }}
                            >
                              GST
                            </span>
                            <p
                              className="font-semibold mt-1"
                              style={{ color: "#46499e" }}
                            >
                              {taxPercentage.toFixed(2)}%
                            </p>
                          </div>
                        )}
                        <div
                          className="rounded p-2 col-span-2"
                          style={{
                            backgroundColor: "rgba(70, 73, 158, 0.1)",
                          }}
                        >
                          <span
                            className="text-xs"
                            style={{ color: "#46499e" }}
                          >
                            Subtotal
                          </span>
                          <p
                            className="font-bold mt-1 text-base"
                            style={{ color: "#46499e" }}
                          >
                            ₹{item.subtotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead
                    style={{
                      background:
                        "linear-gradient(to right, rgba(70, 73, 158, 0.08), rgba(225, 176, 209, 0.08))",
                    }}
                  >
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Disc%
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        GST%
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.orderItems.map((item) => {
                      const discountPercentage = item.discountPercentage || 0;
                      const taxPercentage = item.taxPercentage || 0;
                      const productName =
                        item.product?.name ||
                        item.productName ||
                        "Unknown Product";
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {productName}
                            </div>
                            {item.product?.barcode && (
                              <div className="text-xs text-gray-500 mt-1">
                                Barcode: {item.product.barcode}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-700">
                            ₹{item.price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            {discountPercentage > 0 ? (
                              <span
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: "rgba(241, 176, 43, 0.15)",
                                  color: "#f1b02b",
                                }}
                              >
                                {discountPercentage.toFixed(2)}%
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            {taxPercentage > 0 ? (
                              <span
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: "rgba(70, 73, 158, 0.15)",
                                  color: "#46499e",
                                }}
                              >
                                {taxPercentage.toFixed(2)}%
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                            ₹{item.subtotal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Section */}
            <div
              className="rounded-lg p-6 border"
              style={{
                background:
                  "linear-gradient(to bottom right, rgba(70, 73, 158, 0.1), rgba(225, 176, 209, 0.1))",
                borderColor: "rgba(70, 73, 158, 0.2)",
              }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Bill Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Subtotal (Base):</span>
                  <span className="text-gray-900 font-medium">
                    ₹{totalBase.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">GST:</span>
                  <span className="text-gray-900 font-medium">
                    ₹{totalGST.toFixed(2)}
                  </span>
                </div>
                <div
                  className="border-t pt-3 mt-3"
                  style={{ borderColor: "rgba(70, 73, 158, 0.2)" }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">
                      Grand Total:
                    </span>
                    <span
                      className="text-2xl font-bold"
                      style={{ color: "#46499e" }}
                    >
                      ₹{order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            {order.bill?.pdfUrl && order.customerPhone && (
              <button
                onClick={handleSendWhatsApp}
                disabled={sendingWhatsApp}
                className="px-4 py-2.5 bg-green-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Send invoice via WhatsApp"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                {sendingWhatsApp ? "Sending..." : "Send WhatsApp"}
              </button>
            )}
            {order.bill?.pdfUrl && order.customerEmail && (
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Send invoice via Email"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {sendingEmail ? "Sending..." : "Send Email"}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {order.bill && (
              <div className="flex gap-2">
                {order.bill.pdfUrl ? (
                  <button
                    onClick={handleDownloadPdf}
                    disabled={downloading}
                    className="px-6 py-2.5 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{ backgroundColor: "#46499e" }}
                    onMouseEnter={(e) => {
                      if (!downloading) {
                        e.currentTarget.style.backgroundColor = "#3a3d85";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!downloading) {
                        e.currentTarget.style.backgroundColor = "#46499e";
                      }
                    }}
                  >
                    <svg
                      className="w-5 h-5"
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
                    {downloading ? "Downloading..." : "Download PDF"}
                  </button>
                ) : (
                  <button
                    onClick={handleRegeneratePdf}
                    disabled={regenerating}
                    className="px-6 py-2.5 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{ backgroundColor: "#ed4734" }}
                    onMouseEnter={(e) => {
                      if (!regenerating) {
                        e.currentTarget.style.backgroundColor = "#d63a28";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!regenerating) {
                        e.currentTarget.style.backgroundColor = "#ed4734";
                      }
                    }}
                    title="Regenerate PDF for this bill"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    {regenerating ? "Regenerating..." : "Regenerate PDF"}
                  </button>
                )}
              </div>
            )}
            <button
              onClick={() => {
                trackButton("Close", { location: "order_modal" });
                onClose();
              }}
              className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
