/**
 * This file contains the SubcategorySelector component for selecting or creating subcategories.
 */
"use client";

interface Subcategory {
  id: string;
  name: string;
}

interface SubcategorySelectorProps {
  subcategories: Subcategory[];
  selectedSubcategoryId: string;
  onSubcategoryChange: (subcategoryId: string) => void;
  showNewSubcategoryInput: boolean;
  onToggleNewSubcategory: () => void;
  newSubcategoryName: string;
  onNewSubcategoryNameChange: (name: string) => void;
  onCreateSubcategory: () => Promise<void>;
  creatingSubcategory: boolean;
  disabled?: boolean;
}

/**
 * SubcategorySelector component for selecting or creating subcategories
 */
export default function SubcategorySelector({
  subcategories,
  selectedSubcategoryId,
  onSubcategoryChange,
  showNewSubcategoryInput,
  onToggleNewSubcategory,
  newSubcategoryName,
  onNewSubcategoryNameChange,
  onCreateSubcategory,
  creatingSubcategory,
  disabled = false,
}: SubcategorySelectorProps) {
  return (
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
              disabled={!newSubcategoryName.trim() || creatingSubcategory}
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
          <button
            type="button"
            onClick={onToggleNewSubcategory}
            disabled={disabled}
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
          disabled={disabled}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Select Subcategory</option>
          {subcategories.map((subcategory) => (
            <option key={subcategory.id} value={subcategory.id}>
              {subcategory.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
