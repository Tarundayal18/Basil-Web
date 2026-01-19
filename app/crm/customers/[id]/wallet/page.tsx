/**
 * Customer Wallet Page
 * View and manage wallet for a specific customer
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { crmService, WalletTransaction } from "@/services/crm.service";
import { crmEnhancedService } from "@/services/crm-enhanced.service";
import { Wallet, Plus, Minus, ArrowLeft, ArrowUp, ArrowDown } from "lucide-react";
import Toast from "@/components/Toast";
import Link from "next/link";

export default function CustomerWalletPage() {
  return (
    <ProtectedRoute>
      <CustomerWalletContent />
    </ProtectedRoute>
  );
}

function CustomerWalletContent() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [wallet, setWallet] = useState<{ transactions: WalletTransaction[]; balance: number } | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (customerId) {
      loadData();
    }
  }, [customerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Load customer profile and wallet in parallel
      const [walletData, profileData] = await Promise.all([
        crmService.getWallet(customerId).catch(() => null),
        crmEnhancedService.getCustomerProfile(customerId).catch(() => null),
      ]);

      if (walletData) {
        setWallet(walletData);
      } else {
        setWallet({ transactions: [], balance: 0 });
      }

      if (profileData) {
        setCustomer(profileData);
      }
    } catch (err: any) {
      console.error("Error loading wallet:", err);
      setError(err.message || "Failed to load wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (amount: number) => {
    if (!amountInput) {
      setError("Please enter an amount");
      return;
    }

    const amountValue = parseFloat(amountInput);
    if (isNaN(amountValue) || amountValue === 0) {
      setError("Please enter a valid amount");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      const updated = await crmService.addWalletTransaction(customerId, {
        amount: amount * amountValue,
        remark: remark || undefined,
      });
      setWallet(updated);
      setAmountInput("");
      setRemark("");
      setSuccessMessage(`Transaction of ₹${Math.abs(amountValue).toFixed(2)} ${amount > 0 ? "added" : "deducted"} successfully`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error("Error adding transaction:", err);
      setError(err.message || "Failed to add transaction");
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Wallet Management</h1>
            {customer && (
              <p className="text-gray-600 mt-1">
                {customer.name} ({customer.phone})
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet Balance & Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Balance Card */}
          <div className={`rounded-lg p-6 shadow-sm ${wallet && wallet.balance >= 0 ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                <p className={`text-4xl font-bold ${wallet && wallet.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{(wallet?.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <Wallet className={`h-12 w-12 ${wallet && wallet.balance >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            </div>
          </div>

          {/* Transaction Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Transaction</h2>
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
                  onClick={() => handleAddTransaction(1)}
                  disabled={processing || !amountInput}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowUp className="h-5 w-5" />
                  Add
                </button>
                <button
                  onClick={() => handleAddTransaction(-1)}
                  disabled={processing || !amountInput}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowDown className="h-5 w-5" />
                  Deduct
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h2>
          {!wallet || wallet.transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {wallet.transactions
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((txn) => (
                  <div
                    key={txn.txnId}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        {txn.amount >= 0 ? (
                          <Plus className="h-5 w-5 text-green-600" />
                        ) : (
                          <Minus className="h-5 w-5 text-red-600" />
                        )}
                        <p className={`text-lg font-semibold ${txn.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {txn.amount >= 0 ? '+' : ''}₹{Math.abs(txn.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 ml-8">{txn.remark || 'No remark'}</p>
                      <div className="flex items-center gap-4 mt-2 ml-8 text-xs text-gray-500">
                        <span>
                          {new Date(txn.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(txn.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {txn.orderId && (
                          <>
                            <span>•</span>
                            <Link
                              href={`/invoices?orderId=${txn.orderId}`}
                              className="text-indigo-600 hover:text-indigo-700"
                            >
                              View Order
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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
