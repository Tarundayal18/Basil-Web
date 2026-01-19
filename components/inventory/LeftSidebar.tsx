/**
 * This file contains the LeftSidebar component for product metadata fields.
 */
"use client";

import CategorySelector from "./CategorySelector";
import SubcategorySelector from "./SubcategorySelector";
import SupplierSelector from "./SupplierSelector";
import BrandSelector from "./BrandSelector";

interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
  storeId: string;
}

interface Brand {
  id: string;
  name: string;
  storeId: string;
}

interface LeftSidebarProps {
  // Category props
  categories: Category[];
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  showNewCategoryInput: boolean;
  onToggleNewCategory: () => void;
  newCategoryName: string;
  onNewCategoryNameChange: (name: string) => void;
  onCreateCategory: () => Promise<void>;
  creatingCategory: boolean;
  // Subcategory props
  subcategories: Subcategory[];
  selectedSubcategoryId: string;
  onSubcategoryChange: (subcategoryId: string) => void;
  showNewSubcategoryInput: boolean;
  onToggleNewSubcategory: () => void;
  newSubcategoryName: string;
  onNewSubcategoryNameChange: (name: string) => void;
  onCreateSubcategory: () => Promise<void>;
  creatingSubcategory: boolean;
  // Supplier props
  suppliers: Supplier[];
  selectedSupplierId: string;
  onSupplierChange: (supplierId: string) => void;
  showNewSupplierInput: boolean;
  onToggleNewSupplier: () => void;
  newSupplierName: string;
  onNewSupplierNameChange: (name: string) => void;
  onCreateSupplier: () => Promise<void>;
  creatingSupplier: boolean;
  // Brand props
  brands: Brand[];
  selectedBrandId: string;
  onBrandChange: (brandId: string) => void;
  showNewBrandInput: boolean;
  onToggleNewBrand: () => void;
  newBrandName: string;
  onNewBrandNameChange: (name: string) => void;
  onCreateBrand: () => Promise<void>;
  creatingBrand: boolean;
}

/**
 * LeftSidebar component for displaying product metadata fields (Category, Subcategory, Supplier, Brand)
 */
export default function LeftSidebar({
  categories,
  selectedCategoryId,
  onCategoryChange,
  showNewCategoryInput,
  onToggleNewCategory,
  newCategoryName,
  onNewCategoryNameChange,
  onCreateCategory,
  creatingCategory,
  subcategories,
  selectedSubcategoryId,
  onSubcategoryChange,
  showNewSubcategoryInput,
  onToggleNewSubcategory,
  newSubcategoryName,
  onNewSubcategoryNameChange,
  onCreateSubcategory,
  creatingSubcategory,
  suppliers,
  selectedSupplierId,
  onSupplierChange,
  showNewSupplierInput,
  onToggleNewSupplier,
  newSupplierName,
  onNewSupplierNameChange,
  onCreateSupplier,
  creatingSupplier,
  brands,
  selectedBrandId,
  onBrandChange,
  showNewBrandInput,
  onToggleNewBrand,
  newBrandName,
  onNewBrandNameChange,
  onCreateBrand,
  creatingBrand,
}: LeftSidebarProps) {
  return (
    <div className="col-span-12 md:col-span-3 space-y-4 p-4 bg-gray-50 rounded-lg order-6 md:order-1">
      {/* Category - Desktop only */}
      <div className="hidden md:block">
        <CategorySelector
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onCategoryChange={onCategoryChange}
          showNewCategoryInput={showNewCategoryInput}
          onToggleNewCategory={onToggleNewCategory}
          newCategoryName={newCategoryName}
          onNewCategoryNameChange={onNewCategoryNameChange}
          onCreateCategory={onCreateCategory}
          creatingCategory={creatingCategory}
        />
      </div>

      {/* Subcategory */}
      <SubcategorySelector
        subcategories={subcategories}
        selectedSubcategoryId={selectedSubcategoryId}
        onSubcategoryChange={onSubcategoryChange}
        showNewSubcategoryInput={showNewSubcategoryInput}
        onToggleNewSubcategory={onToggleNewSubcategory}
        newSubcategoryName={newSubcategoryName}
        onNewSubcategoryNameChange={onNewSubcategoryNameChange}
        onCreateSubcategory={onCreateSubcategory}
        creatingSubcategory={creatingSubcategory}
        disabled={!selectedCategoryId}
      />

      {/* Supplier */}
      <SupplierSelector
        suppliers={suppliers}
        selectedSupplierId={selectedSupplierId}
        onSupplierChange={onSupplierChange}
        showNewSupplierInput={showNewSupplierInput}
        onToggleNewSupplier={onToggleNewSupplier}
        newSupplierName={newSupplierName}
        onNewSupplierNameChange={onNewSupplierNameChange}
        onCreateSupplier={onCreateSupplier}
        creatingSupplier={creatingSupplier}
      />

      {/* Brand */}
      <BrandSelector
        brands={brands}
        selectedBrandId={selectedBrandId}
        onBrandChange={onBrandChange}
        showNewBrandInput={showNewBrandInput}
        onToggleNewBrand={onToggleNewBrand}
        newBrandName={newBrandName}
        onNewBrandNameChange={onNewBrandNameChange}
        onCreateBrand={onCreateBrand}
        creatingBrand={creatingBrand}
      />
    </div>
  );
}
