"use client";

interface Supplier {
  id: string;
  name: string;
  storeId: string;
}

interface SupplierSelectorProps {
  suppliers: Supplier[];
  selectedSupplierId: string;
  onSupplierChange: (supplierId: string) => void;
  showNewSupplierInput: boolean;
  onToggleNewSupplier: () => void;
  newSupplierName: string;
  onNewSupplierNameChange: (name: string) => void;
  onCreateSupplier: () => Promise<void>;
  creatingSupplier: boolean;
}

export default function SupplierSelector({
  suppliers,
  selectedSupplierId,
  onSupplierChange,
  showNewSupplierInput,
  onToggleNewSupplier,
  newSupplierName,
  onNewSupplierNameChange,
  onCreateSupplier,
  creatingSupplier,
}: SupplierSelectorProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <label className="block text-sm font-medium text-gray-700">
          Supplier
        </label>
        {showNewSupplierInput ? (
          <>
            <button
              type="button"
              onClick={onCreateSupplier}
              disabled={!newSupplierName.trim() || creatingSupplier}
              className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {creatingSupplier ? "..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                onToggleNewSupplier();
                onNewSupplierNameChange("");
              }}
              className="px-2 py-1 border border-gray-300 rounded text-xs font-medium hover:bg-gray-50 whitespace-nowrap"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onToggleNewSupplier}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
          >
            + New
          </button>
        )}
      </div>
      {showNewSupplierInput ? (
        <input
          type="text"
          value={newSupplierName}
          onChange={(e) => onNewSupplierNameChange(e.target.value)}
          placeholder="Supplier name"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          autoFocus
        />
      ) : (
        <select
          value={selectedSupplierId}
          onChange={(e) => onSupplierChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Select Supplier</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
