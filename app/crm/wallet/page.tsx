"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/contexts/StoreContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import { crmService, WalletTransaction } from "@/services/crm.service";
import { customersService } from "@/services/customers.service";
import { Wallet, Plus, Minus, Search, ArrowUp, ArrowDown } from "lucide-react";
import Toast from "@/components/Toast";

function WalletPageContent() {
  const { selectedStore } = useStore();
  const { track } = useAnalytics("Wallet Management", true);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [wallet, setWallet] = useState<{ transactions: WalletTransaction[]; balance: number } | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (selectedStore?.id && searchQuery.length >= 1) {
      searchCustomers();
    } else {
      setCustomers([]);
    }
  }, [searchQuery, selectedStore]);

  const searchCustomers = async () => {
    if (!selectedStore?.id) return;

    try {
      const response = await customersService.getCustomers({
        storeId: selectedStore.id,
        search: searchQuery,
        limit: 10,
      });
      setCustomers(response.data || []);
    } catch (err) {
      console.error("Error searching customers:", err);
    }
  };

  const loadWallet = async (customerId: string) => {
    try {
      setLoading(true);
      setError("");
      const data = await crmService.getWallet(customerId);
      setWallet(data);
    } catch (err: any) {
      console.error("Error loading wallet:", err);
      setError(err.message || "Failed to load wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (amount: number) => {
    if (!selectedCustomer) {
      setError("Please select a customer");
      return;
    }

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
      setLoading(true);
      setError("");
      const updated = await crmService.addWalletTransaction(selectedCustomer.id, {
        amount: amount * amountValue,
        remark: remark || undefined,
      });
      setWallet(updated);
      setAmountInput("");
      setRemark("");
      setSuccessMessage(`Transaction of ₹${Math.abs(amountValue)} ${amount > 0 ? "added" : "deducted"} successfully`);
      track("wallet_transaction_added", {
        customerId: selectedCustomer.id,
        amount: amount * amountValue,
      });
    } catch (err: any) {
      console.error("Error adding transaction:", err);
      setError(err.message || "Failed to add transaction");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedStore) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please select a store to manage wallets.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Wallet Management</h1>
        <p className="text-gray-600">
          Track customer wallet balances and transactions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Customer</h2>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {customers.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    loadWallet(customer.id);
                    setSearchQuery("");
                    setCustomers([]);
                  }}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <p className="font-medium text-gray-900">{customer.name}</p>
                  <p className="text-sm text-gray-600">{customer.phone}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Wallet Management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {selectedCustomer ? (
            <>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedCustomer.name}
                </h2>
                <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
              </div>

              {loading && !wallet ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                </div>
              ) : wallet ? (
                <>
                  <div className={`rounded-lg p-4 mb-4 ${wallet.balance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Current Balance</p>
                        <p className={`text-3xl font-bold ${wallet.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{wallet.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <Wallet className={`h-12 w-12 ${wallet.balance >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                    </div>
                  </div>

                  <div className="space-y-4 mb-4">
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
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="h-5 w-5" />
                        Add
                      </button>
                      <button
                        onClick={() => handleAddTransaction(-1)}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="h-5 w-5" />
                        Deduct
                      </button>
                    </div>
                  </div>

                  {/* Transaction History */}
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Transactions</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {wallet.transactions.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No transactions yet</p>
                      ) : (
                        wallet.transactions
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .slice(0, 10)
                          .map((txn) => (
                            <div
                              key={txn.txnId}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${txn.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {txn.amount >= 0 ? '+' : ''}₹{Math.abs(txn.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-gray-600">{txn.remark || 'No remark'}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(txn.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Search and select a customer to manage wallet</p>
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

export default function WalletPage() {
  return (
    <ProtectedRoute>
      <WalletPageContent />
    </ProtectedRoute>
  );
}

