"use client";

interface Category {
  id: string;
  name: string;
  subcategories: Array<{ id: string; name: string }>;
}

interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

interface CategorySubcategorySelectorProps {
  categories: Category[];
  subcategories: Subcategory[];
  selectedCategoryId: string;
  selectedSubcategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  onSubcategoryChange: (subcategoryId: string) => void;
  showNewCategoryInput: boolean;
  onToggleNewCategory: () => void;
  newCategoryName: string;
  onNewCategoryNameChange: (name: string) => void;
  onCreateCategory: () => Promise<void>;
  creatingCategory: boolean;
  showNewSubcategoryInput: boolean;
  onToggleNewSubcategory: () => void;
  newSubcategoryName: string;
  onNewSubcategoryNameChange: (name: string) => void;
  onCreateSubcategory: () => Promise<void>;
  creatingSubcategory: boolean;
}

export default function CategorySubcategorySelector({
  categories,
  subcategories,
  selectedCategoryId,
  selectedSubcategoryId,
  onCategoryChange,
  onSubcategoryChange,
  showNewCategoryInput,
  onToggleNewCategory,
  newCategoryName,
  onNewCategoryNameChange,
  onCreateCategory,
  creatingCategory,
  showNewSubcategoryInput,
  onToggleNewSubcategory,
  newSubcategoryName,
  onNewSubcategoryNameChange,
  onCreateSubcategory,
  creatingSubcategory,
}: CategorySubcategorySelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Category Field - Match Brand/Supplier layout exactly */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Category
          </label>
          {showNewCategoryInput ? (
            <>
              <button
                type="button"
                onClick={onCreateCategory}
                disabled={!newCategoryName.trim() || creatingCategory}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {creatingCategory ? "..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleNewCategory();
                  onNewCategoryNameChange("");
                }}
                className="px-2 py-1 border border-gray-300 rounded text-xs font-medium hover:bg-gray-50 whitespace-nowrap"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onToggleNewCategory}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
            >
              + New
            </button>
          )}
        </div>
        {showNewCategoryInput ? (
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => onNewCategoryNameChange(e.target.value)}
            placeholder="Category name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            autoFocus
          />
        ) : (
          <select
            value={selectedCategoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Subcategory Field - Match Brand/Supplier layout exactly, always allow adding */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Subcategory
          </label>
          {showNewSubcategoryInput ? (
            <>
              <button
                type="button"
                onClick={onCreateSubcategory}
                disabled={!newSubcategoryName.trim() || creatingSubcategory || !selectedCategoryId}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {creatingSubcategory ? "..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleNewSubcategory();
                  onNewSubcategoryNameChange("");
                }}
                className="px-2 py-1 border border-gray-300 rounded text-xs font-medium hover:bg-gray-50 whitespace-nowrap"
              >
                Cancel
              </button>
            </>
          ) : (
            // Always show "+ New" button for subcategory (like Brand/Supplier)
            <button
              type="button"
              onClick={onToggleNewSubcategory}
              disabled={!selectedCategoryId}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              + New
            </button>
          )}
        </div>
        {showNewSubcategoryInput ? (
          <input
            type="text"
            value={newSubcategoryName}
            onChange={(e) => onNewSubcategoryNameChange(e.target.value)}
            placeholder="Subcategory name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            autoFocus
          />
        ) : (
          <select
            value={selectedSubcategoryId}
            onChange={(e) => onSubcategoryChange(e.target.value)}
            disabled={!selectedCategoryId}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select Subcategory</option>
            {subcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
