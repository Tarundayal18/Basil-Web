/**
 * BrandsSection component for managing product brands.
 * Handles creation and deletion of product brands.
 */
"use client";

import { useState, useEffect } from "react";
import { Package, X } from "lucide-react";
import { SectionWrapper } from "./SectionWrapper";
import { useAnalytics } from "@/hooks/useAnalytics";
import { inventoryService } from "@/services/inventory.service";
import { useStore } from "@/contexts/StoreContext";

interface Brand {
  id: string;
  name: string;
  storeId: string;
}

export function BrandsSection() {
  const { selectedStore } = useStore();
  const { trackButton, track, events } = useAnalytics("Brands Section", false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [newBrandName, setNewBrandName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedStore) return;

    const loadBrands = async () => {
      try {
        const brs = await inventoryService.getBrands(selectedStore.id);
        setBrands(brs);
      } catch (error) {
        console.error("Failed to load brands:", error);
      }
    };

    loadBrands();
  }, [selectedStore]);

  const handleAddBrand = async () => {
    if (!newBrandName.trim() || !selectedStore) return;
    try {
      trackButton("Add Brand", { location: "brands_section" });
      track(events.BRAND_ADDED, {});
      const brand = await inventoryService.createBrand({
        name: newBrandName.trim(),
        storeId: selectedStore.id,
      });
      setBrands([...brands, brand]);
      setNewBrandName("");
    } catch (error) {
      console.error("Failed to create brand:", error);
      setError("Failed to create brand");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDeleteBrand = async (id: string) => {
    try {
      trackButton("Delete Brand", { location: "brands_section", brand_id: id });
      track(events.BRAND_DELETED, { brand_id: id });
      await inventoryService.deleteBrand(id);
      setBrands(brands.filter((brand) => brand.id !== id));
    } catch (error) {
      console.error("Failed to delete brand:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete brand";
      setError(errorMessage);
      setTimeout(() => setError(""), 3000);
    }
  };

  if (!selectedStore) return null;

  return (
    <SectionWrapper
      title="Brands"
      description="Manage product brands for your store"
      icon={Package}
      gradientFrom="#e1b0d1"
      gradientTo="#46499e"
      iconColor="#46499e"
    >
      {error && (
        <div className="mb-4 p-3 bg-[#ed4734]/10 border-l-4 border-[#ed4734] rounded text-sm text-[#ed4734]">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newBrandName}
          onChange={(e) => setNewBrandName(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddBrand();
            }
          }}
          placeholder="Add brand"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46499e] focus:border-[#46499e] text-sm"
        />
        <button
          onClick={handleAddBrand}
          className="px-4 py-2 bg-[#46499e] text-white rounded-lg hover:bg-[#46499e]/90 font-medium text-sm"
        >
          Add
        </button>
      </div>

      {brands.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-2">
          {brands.map((brand) => (
            <span
              key={brand.id}
              className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-900 rounded-lg text-sm"
            >
              {brand.name}
              <button
                onClick={() => handleDeleteBrand(brand.id)}
                className="text-[#ed4734] hover:text-[#ed4734]/80"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
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
