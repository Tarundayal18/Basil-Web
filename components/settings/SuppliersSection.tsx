/**
 * SuppliersSection component for managing suppliers.
 * Handles creation and deletion of suppliers.
 */
"use client";

import { useState, useEffect } from "react";
import { Truck, X } from "lucide-react";
import { SectionWrapper } from "./SectionWrapper";
import { useAnalytics } from "@/hooks/useAnalytics";
import { inventoryService } from "@/services/inventory.service";
import { useStore } from "@/contexts/StoreContext";
import VendorReliabilityWidget from "@/components/ai/VendorReliabilityWidget";

interface Supplier {
  id: string;
  name: string;
  storeId: string;
}

export function SuppliersSection() {
  const { selectedStore } = useStore();
  const { trackButton, track, events } = useAnalytics(
    "Suppliers Section",
    false
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedStore) return;

    const loadSuppliers = async () => {
      try {
        const sups = await inventoryService.getSuppliers(selectedStore.id);
        setSuppliers(sups);
      } catch (error) {
        console.error("Failed to load suppliers:", error);
      }
    };

    loadSuppliers();
  }, [selectedStore]);

  const handleAddSupplier = async () => {
    if (!newSupplierName.trim() || !selectedStore) return;
    try {
      trackButton("Add Supplier", { location: "suppliers_section" });
      track(events.SUPPLIER_ADDED, {});
      const supplier = await inventoryService.createSupplier({
        name: newSupplierName.trim(),
        storeId: selectedStore.id,
      });
      setSuppliers([...suppliers, supplier]);
      setNewSupplierName("");
    } catch (error) {
      console.error("Failed to create supplier:", error);
      setError("Failed to create supplier");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    try {
      trackButton("Delete Supplier", {
        location: "suppliers_section",
        supplier_id: id,
      });
      track(events.SUPPLIER_DELETED, { supplier_id: id });
      await inventoryService.deleteSupplier(id);
      setSuppliers(suppliers.filter((supplier) => supplier.id !== id));
    } catch (error) {
      console.error("Failed to delete supplier:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete supplier";
      setError(errorMessage);
      setTimeout(() => setError(""), 3000);
    }
  };

  if (!selectedStore) return null;

  return (
    <SectionWrapper
      title="Suppliers"
      description="Manage suppliers for your store"
      icon={Truck}
      gradientFrom="#ed4734"
      gradientTo="#f1b02b"
      iconColor="#ed4734"
    >
      {error && (
        <div className="mb-4 p-3 bg-[#ed4734]/10 border-l-4 border-[#ed4734] rounded text-sm text-[#ed4734]">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newSupplierName}
          onChange={(e) => setNewSupplierName(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddSupplier();
            }
          }}
          placeholder="Add supplier"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ed4734] focus:border-[#ed4734] text-sm"
        />
        <button
          onClick={handleAddSupplier}
          className="px-4 py-2 bg-[#ed4734] text-white rounded-lg hover:bg-[#ed4734]/90 font-medium text-sm"
        >
          Add
        </button>
      </div>

      {suppliers.length > 0 ? (
        <div className="space-y-4">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{supplier.name}</span>
                <button
                  onClick={() => handleDeleteSupplier(supplier.id)}
                  className="text-[#ed4734] hover:text-[#ed4734]/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <VendorReliabilityWidget
                vendorId={supplier.id}
                vendorName={supplier.name}
                compact={true}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-2">No values added</p>
      )}

      <p className="text-xs text-gray-500">
        Removing does not delete existing products
      </p>
    </SectionWrapper>
  );
}
