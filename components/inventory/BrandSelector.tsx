"use client";

interface Brand {
  id: string;
  name: string;
  storeId: string;
}

interface BrandSelectorProps {
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
 * BrandSelector component for selecting or creating brands
 */
export default function BrandSelector({
  brands,
  selectedBrandId,
  onBrandChange,
  showNewBrandInput,
  onToggleNewBrand,
  newBrandName,
  onNewBrandNameChange,
  onCreateBrand,
  creatingBrand,
}: BrandSelectorProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <label className="block text-sm font-medium text-gray-700">Brand</label>
        {showNewBrandInput ? (
          <>
            <button
              type="button"
              onClick={onCreateBrand}
              disabled={!newBrandName.trim() || creatingBrand}
              className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {creatingBrand ? "..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                onToggleNewBrand();
                onNewBrandNameChange("");
              }}
              className="px-2 py-1 border border-gray-300 rounded text-xs font-medium hover:bg-gray-50 whitespace-nowrap"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onToggleNewBrand}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
          >
            + New
          </button>
        )}
      </div>
      {showNewBrandInput ? (
        <input
          type="text"
          value={newBrandName}
          onChange={(e) => onNewBrandNameChange(e.target.value)}
          placeholder="Brand name"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          autoFocus
        />
      ) : (
        <select
          value={selectedBrandId}
          onChange={(e) => onBrandChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Select Brand</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
