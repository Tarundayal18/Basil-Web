/**
 * This file contains the CategorySelector component for selecting or creating categories.
 */
"use client";

interface Category {
  id: string;
  name: string;
}

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  showNewCategoryInput: boolean;
  onToggleNewCategory: () => void;
  newCategoryName: string;
  onNewCategoryNameChange: (name: string) => void;
  onCreateCategory: () => Promise<void>;
  creatingCategory: boolean;
}

/**
 * CategorySelector component for selecting or creating categories
 */
export default function CategorySelector({
  categories,
  selectedCategoryId,
  onCategoryChange,
  showNewCategoryInput,
  onToggleNewCategory,
  newCategoryName,
  onNewCategoryNameChange,
  onCreateCategory,
  creatingCategory,
}: CategorySelectorProps) {
  return (
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
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
