/**
 * ProductCategoriesSection component for managing product categories.
 * Handles creation, editing, and deletion of product categories.
 */
"use client";

import { useState, useEffect } from "react";
import { Tag, X, Edit } from "lucide-react";
import { SectionWrapper } from "./SectionWrapper";
import { useAnalytics } from "@/hooks/useAnalytics";
import { inventoryService } from "@/services/inventory.service";
import { useStore } from "@/contexts/StoreContext";
import { CategoryEditModal } from "./CategoryEditModal";

interface Category {
  id: string;
  name: string;
  storeId: string;
  gstRate?: number;
  hsnCode?: string;
  marginPercentage?: number;
  purchaseMarginPercentage?: number;
  overheadChargesPercentage?: number;
}

export function ProductCategoriesSection() {
  const { selectedStore } = useStore();
  const { trackButton, track, events } = useAnalytics(
    "Product Categories Section",
    false
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryEditData, setCategoryEditData] = useState<{
    name: string;
    gstRate?: number;
    hsnCode?: string;
    marginPercentage?: number;
    purchaseMarginPercentage?: number;
    overheadChargesPercentage?: number;
  }>({
    name: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!selectedStore) return;

    const loadCategories = async () => {
      try {
        const cats = await inventoryService.getCategories(selectedStore.id);
        setCategories(cats);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };

    loadCategories();
  }, [selectedStore]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !selectedStore) return;
    try {
      trackButton("Add Category", { location: "product_categories_section" });
      track(events.CATEGORY_ADDED, {});
      const category = await inventoryService.createCategory({
        name: newCategoryName.trim(),
        storeId: selectedStore.id,
      });
      setCategories([...categories, category]);
      setNewCategoryName("");
    } catch (error) {
      console.error("Failed to create category:", error);
      setError("Failed to create category");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      trackButton("Delete Category", {
        location: "product_categories_section",
        category_id: id,
      });
      track(events.CATEGORY_DELETED, { category_id: id });
      await inventoryService.deleteCategory(id);
      setCategories(categories.filter((cat) => cat.id !== id));
    } catch (error) {
      console.error("Failed to delete category:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete category";
      setError(errorMessage);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleEditCategory = (category: Category) => {
    trackButton("Edit Category", {
      location: "product_categories_section",
      category_id: category.id,
    });
    setEditingCategory(category);
    setCategoryEditData({
      name: category.name,
      gstRate: category.gstRate,
      hsnCode: category.hsnCode,
      marginPercentage: category.marginPercentage,
      purchaseMarginPercentage: category.purchaseMarginPercentage,
      overheadChargesPercentage: category.overheadChargesPercentage,
    });
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    try {
      const updated = await inventoryService.updateCategory(
        editingCategory.id,
        categoryEditData
      );
      setCategories(
        categories.map((cat) => (cat.id === editingCategory.id ? updated : cat))
      );
      setEditingCategory(null);
      setCategoryEditData({ name: "" });
      setSuccess("Category updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Failed to update category:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update category";
      setError(errorMessage);
      setTimeout(() => setError(""), 3000);
    }
  };

  if (!selectedStore) return null;

  return (
    <>
      <SectionWrapper
        title="Product Categories"
        description="Manage product categories for your store"
        icon={Tag}
        gradientFrom="#46499e"
        gradientTo="#e1b0d1"
        iconColor="#46499e"
      >
        {(error || success) && (
          <div className="mb-4">
            {error && (
              <div className="p-3 bg-[#ed4734]/10 border-l-4 border-[#ed4734] rounded text-sm text-[#ed4734]">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-[#46499e]/10 border-l-4 border-[#46499e] rounded text-sm text-[#46499e]">
                {success}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCategory();
              }
            }}
            placeholder="Add category"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46499e] focus:border-[#46499e] text-sm"
          />
          <button
            onClick={handleAddCategory}
            className="px-4 py-2 bg-[#46499e] text-white rounded-lg hover:bg-[#46499e]/90 font-medium text-sm"
          >
            Add
          </button>
        </div>

        {categories.length > 0 ? (
          <div className="space-y-2 mb-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {category.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 space-x-3">
                    {category.gstRate !== undefined &&
                      category.gstRate !== null && (
                        <span>GST: {category.gstRate}%</span>
                      )}
                    {category.hsnCode && <span>HSN: {category.hsnCode}</span>}
                    {category.marginPercentage !== undefined &&
                      category.marginPercentage !== null && (
                        <span>
                          Selling Margin: {category.marginPercentage}%
                        </span>
                      )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="text-[#46499e] hover:text-[#46499e]/80"
                    title="Edit category"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-[#ed4734] hover:text-[#ed4734]/80"
                    title="Delete category"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
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

      <CategoryEditModal
        editingCategory={editingCategory}
        categoryEditData={categoryEditData}
        onClose={() => {
          setEditingCategory(null);
          setCategoryEditData({ name: "" });
        }}
        onUpdate={handleUpdateCategory}
        onDataChange={setCategoryEditData}
      />
    </>
  );
}
