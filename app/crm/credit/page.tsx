"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/contexts/StoreContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import { crmService, CreditLedgerEntry } from "@/services/crm.service";
import { customersService } from "@/services/customers.service";
import { CreditCard, Plus, Minus, Search, ArrowUp, ArrowDown } from "lucide-react";
import Toast from "@/components/Toast";

function CreditPageContent() {
  const { selectedStore } = useStore();
  const { track } = useAnalytics("Credit Management", true);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [creditLedger, setCreditLedger] = useState<{ entries: CreditLedgerEntry[]; outstanding: number } | null>(null);
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

  const loadCreditLedger = async (customerId: string) => {
    try {
      setLoading(true);
      setError("");
      const data = await crmService.getCreditLedger(customerId);
      setCreditLedger(data);
    } catch (err: any) {
      console.error("Error loading credit ledger:", err);
      setError(err.message || "Failed to load credit ledger");
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (amount: number) => {
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
      const updated = await crmService.addCreditEntry(selectedCustomer.id, {
        amount: amount * amountValue,
        remark: remark || undefined,
      });
      setCreditLedger(updated);
      setAmountInput("");
      setRemark("");
      setSuccessMessage(`Credit entry of ₹${Math.abs(amountValue)} ${amount > 0 ? "added" : "paid"} successfully`);
      track("credit_entry_added", {
        customerId: selectedCustomer.id,
        amount: amount * amountValue,
      });
    } catch (err: any) {
      console.error("Error adding credit entry:", err);
      setError(err.message || "Failed to add credit entry");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedStore) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please select a store to manage credit.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Credit Ledger</h1>
        <p className="text-gray-600">
          Manage customer credit limits and outstanding balances
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
                    loadCreditLedger(customer.id);
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

        {/* Credit Ledger Management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {selectedCustomer ? (
            <>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedCustomer.name}
                </h2>
                <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
              </div>

              {loading && !creditLedger ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                </div>
              ) : creditLedger ? (
                <>
                  <div className={`rounded-lg p-4 mb-4 ${creditLedger.outstanding >= 0 ? 'bg-orange-50' : 'bg-green-50'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Outstanding Credit</p>
                        <p className={`text-3xl font-bold ${creditLedger.outstanding >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          ₹{creditLedger.outstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <CreditCard className={`h-12 w-12 ${creditLedger.outstanding >= 0 ? 'text-orange-400' : 'text-green-400'}`} />
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
                        onClick={() => handleAddEntry(1)}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="h-5 w-5" />
                        Give Credit
                      </button>
                      <button
                        onClick={() => handleAddEntry(-1)}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="h-5 w-5" />
                        Receive Payment
                      </button>
                    </div>
                  </div>

                  {/* Ledger History */}
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Credit Ledger History</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {creditLedger.entries.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No credit entries yet</p>
                      ) : (
                        creditLedger.entries
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .slice(0, 10)
                          .map((entry) => (
                            <div
                              key={entry.entryId}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${entry.amount >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                  {entry.amount >= 0 ? '+' : ''}₹{Math.abs(entry.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-gray-600">{entry.remark || 'No remark'}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(entry.createdAt).toLocaleDateString()}
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
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Search and select a customer to manage credit</p>
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

export default function CreditPage() {
  return (
    <ProtectedRoute>
      <CreditPageContent />
    </ProtectedRoute>
  );
}

