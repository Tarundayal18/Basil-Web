/**
 * Customer Credit Ledger Page
 * View and manage credit for a specific customer
 */

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { crmService, CreditLedgerEntry } from "@/services/crm.service";
import { crmEnhancedService } from "@/services/crm-enhanced.service";
import { CreditCard, Plus, Minus, ArrowLeft, ArrowUp, ArrowDown, AlertCircle } from "lucide-react";
import Toast from "@/components/Toast";
import Link from "next/link";

export default function CustomerCreditPage() {
  return (
    <ProtectedRoute>
      <CustomerCreditContent />
    </ProtectedRoute>
  );
}

function CustomerCreditContent() {
  const params = useParams();
  const customerId = params.id as string;

  const [creditLedger, setCreditLedger] = useState<{ entries: CreditLedgerEntry[]; outstanding: number } | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [creditLimit, setCreditLimit] = useState<number | null>(null);

  useEffect(() => {
    if (customerId) {
      loadData();
    }
  }, [customerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Load customer profile and credit ledger in parallel
      const [creditData, profileData] = await Promise.all([
        crmService.getCreditLedger(customerId).catch(() => null),
        crmEnhancedService.getCustomerProfile(customerId).catch(() => null),
      ]);

      if (creditData) {
        setCreditLedger(creditData);
      } else {
        setCreditLedger({ entries: [], outstanding: 0 });
      }

      if (profileData) {
        setCustomer(profileData);
        // Extract credit limit from customer data if available
        setCreditLimit((profileData as any).creditLimit || null);
      }
    } catch (err: any) {
      console.error("Error loading credit ledger:", err);
      setError(err.message || "Failed to load credit ledger");
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (amount: number) => {
    if (!amountInput) {
      setError("Please enter an amount");
      return;
    }

    const amountValue = parseFloat(amountInput);
    if (isNaN(amountValue) || amountValue === 0) {
      setError("Please enter a valid amount");
      return;
    }

    // Check if giving credit would exceed limit
    if (amount > 0 && creditLimit !== null) {
      const currentOutstanding = creditLedger?.outstanding || 0;
      if (currentOutstanding + amountValue > creditLimit) {
        setError(`Credit limit of ₹${creditLimit.toLocaleString("en-IN", { minimumFractionDigits: 2 })} would be exceeded`);
        return;
      }
    }

    // Check if receiving payment would result in negative balance
    if (amount < 0) {
      const currentOutstanding = creditLedger?.outstanding || 0;
      if (currentOutstanding + (amount * amountValue) < 0) {
        setError("Cannot receive more than the outstanding credit amount");
        return;
      }
    }

    try {
      setProcessing(true);
      setError("");
      const updated = await crmService.addCreditEntry(customerId, {
        amount: amount * amountValue,
        remark: remark || undefined,
      });
      setCreditLedger(updated);
      setAmountInput("");
      setRemark("");
      setSuccessMessage(
        `Credit entry of ₹${Math.abs(amountValue).toFixed(2)} ${
          amount > 0 ? "added" : "received"
        } successfully`
      );
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error("Error adding credit entry:", err);
      setError(err.message || "Failed to add credit entry");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const outstanding = creditLedger?.outstanding || 0;
  const utilizationPercent = creditLimit && creditLimit > 0 
    ? Math.min(100, (Math.abs(outstanding) / creditLimit) * 100)
    : 0;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/crm/customers/${customerId}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Credit Ledger</h1>
            {customer && (
              <p className="text-gray-600 mt-1">
                {customer.name} ({customer.phone})
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credit Summary & Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Outstanding Balance Card */}
          <div className={`rounded-lg p-6 shadow-sm border-2 ${
            outstanding > 0 
              ? outstanding > (creditLimit || 0) * 0.8 
                ? 'bg-red-50 border-red-300' 
                : 'bg-orange-50 border-orange-200'
              : outstanding < 0
              ? 'bg-green-50 border-green-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Outstanding Credit</p>
                <p className={`text-4xl font-bold ${
                  outstanding > 0 
                    ? outstanding > (creditLimit || 0) * 0.8 
                      ? 'text-red-600' 
                      : 'text-orange-600'
                    : outstanding < 0
                    ? 'text-green-600'
                    : 'text-gray-600'
                }`}>
                  ₹{Math.abs(outstanding).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
                {outstanding < 0 && (
                  <p className="text-xs text-green-600 mt-1">(Overpaid - credit balance)</p>
                )}
              </div>
              <CreditCard className={`h-12 w-12 ${
                outstanding > 0 
                  ? outstanding > (creditLimit || 0) * 0.8 
                    ? 'text-red-400' 
                    : 'text-orange-400'
                  : outstanding < 0
                  ? 'text-green-400'
                  : 'text-gray-400'
              }`} />
            </div>
            
            {creditLimit !== null && creditLimit > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Credit Limit</span>
                  <span className="font-medium text-gray-900">₹{creditLimit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      utilizationPercent > 80 ? 'bg-red-600' : utilizationPercent > 60 ? 'bg-orange-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${utilizationPercent}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                  <span>{utilizationPercent.toFixed(1)}% utilized</span>
                  <span>₹{((creditLimit || 0) - Math.abs(outstanding)).toLocaleString("en-IN", { minimumFractionDigits: 2 })} remaining</span>
                </div>
              </div>
            )}

            {outstanding > 0 && creditLimit !== null && outstanding > creditLimit * 0.9 && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-700">
                  <p className="font-medium">High Credit Utilization</p>
                  <p>Credit limit is {utilizationPercent.toFixed(1)}% utilized. Consider collecting payment.</p>
                </div>
              </div>
            )}
          </div>

          {/* Transaction Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Credit Entry</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remark (Optional)
                </label>
                <input
                  type="text"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Enter remark"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleAddEntry(1)}
                  disabled={processing || !amountInput}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowUp className="h-5 w-5" />
                  Give Credit
                </button>
                <button
                  onClick={() => handleAddEntry(-1)}
                  disabled={processing || !amountInput}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowDown className="h-5 w-5" />
                  Receive Payment
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Ledger History */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Credit Ledger History</h2>
            <button
              onClick={loadData}
              disabled={loading}
              className="text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
          
          {!creditLedger || creditLedger.entries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No credit entries yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {creditLedger.entries
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((entry, index) => {
                  const runningBalance = creditLedger.entries
                    .filter((e) => new Date(e.createdAt).getTime() <= new Date(entry.createdAt).getTime())
                    .reduce((sum, e) => sum + (e.amount || 0), 0);
                  
                  return (
                    <div
                      key={entry.entryId}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border-l-4 border-gray-300"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          {entry.amount >= 0 ? (
                            <ArrowUp className="h-5 w-5 text-orange-600" />
                          ) : (
                            <ArrowDown className="h-5 w-5 text-green-600" />
                          )}
                          <div>
                            <p className={`text-lg font-semibold ${
                              entry.amount >= 0 ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {entry.amount >= 0 ? '+' : ''}₹{Math.abs(entry.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm text-gray-600 ml-8">{entry.remark || 'No remark'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 ml-8 text-xs text-gray-500">
                          <span>
                            {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(entry.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>•</span>
                          <span className="font-medium">
                            Balance: ₹{runningBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                          {entry.orderId && (
                            <>
                              <span>•</span>
                              <Link
                                href={`/invoices?orderId=${entry.orderId}`}
                                className="text-indigo-600 hover:text-indigo-700"
                              >
                                View Order
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      <Toast
        message={error}
        type="error"
        isOpen={!!error}
        onClose={() => setError("")}
      />
      <Toast
        message={successMessage}
        type="success"
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage("")}
      />
    </div>
  );
}
