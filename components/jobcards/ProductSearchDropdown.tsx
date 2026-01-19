/**
 * ProductSearchDropdown Component
 * 
 * Provides seamless product search with autocomplete functionality for job card items.
 * When a product is selected, automatically populates price and tax.
 * Pattern: Similar to NL frontend ProductSearchPanel for consistency.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Package } from "lucide-react";
import { inventoryService, Product } from "@/services/inventory.service";
import { useDebounce } from "@/hooks/useDebounce";
import { useStore } from "@/contexts/StoreContext";

interface ProductSearchDropdownProps {
  value: string; // Product name
  onChange: (product: {
    name: string;
    unitPrice: number;
    taxRate: number;
    productId?: string;
  }) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  required?: boolean;
}

export default function ProductSearchDropdown({
  value,
  onChange,
  onFocus,
  onBlur,
  disabled = false,
  required = false,
}: ProductSearchDropdownProps) {
  const { selectedStore } = useStore();
  const [searchQuery, setSearchQuery] = useState(value || "");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cacheRef = useRef<Map<string, Product[]>>(new Map());

  const debouncedSearch = useDebounce(searchQuery, 150);

  // Search products when query changes
  useEffect(() => {
    if (!selectedStore?.id || !debouncedSearch || debouncedSearch.length < 1) {
      setProducts([]);
      setShowDropdown(false);
      return;
    }

    const searchProducts = async () => {
      const searchKey = debouncedSearch.trim().toLowerCase();
      const cacheKey = `${selectedStore.id}:${searchKey}`;

      // Check cache first and show immediately
      if (cacheRef.current.has(cacheKey)) {
        const cachedResults = cacheRef.current.get(cacheKey)!;
        setProducts(cachedResults);
        setShowDropdown(cachedResults.length > 0);
        setSelectedIndex(-1);
        setLoading(false);
      }

      try {
        // Only show loading if we don't have cached results
        if (!cacheRef.current.has(cacheKey)) {
          setLoading(true);
        }

        const response = await inventoryService.getInventory({
          storeId: selectedStore.id,
          search: debouncedSearch,
          limit: 20, // Show more results for product search
        });
        
        const productsData = response.data || [];
        
        // Cache the results
        cacheRef.current.set(cacheKey, productsData);
        
        // Only update if this is still the current debounced search
        if (debouncedSearch.trim().toLowerCase() === searchKey) {
          setProducts(productsData);
          setShowDropdown(productsData.length > 0);
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error("Error searching products:", error);
        // Don't clear products if we have cached results
        if (!cacheRef.current.has(cacheKey)) {
          setProducts([]);
          setShowDropdown(false);
        }
      } finally {
        setLoading(false);
      }
    };

    searchProducts();
  }, [debouncedSearch, selectedStore?.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // If user clears the input, reset the product
    if (!query.trim()) {
      onChange({
        name: "",
        unitPrice: 0,
        taxRate: 0,
      });
    }
  };

  const handleSelectProduct = (product: Product) => {
    // Extract price (prefer sellingPrice, fallback to mrp, then costPrice)
    const unitPrice = product.sellingPrice || product.mrp || product.costPrice || 0;
    
    // Extract tax rate (taxPercentage in India backend)
    const taxRate = product.taxPercentage || 0;

    // Auto-populate name, price, and tax
    onChange({
      name: product.name,
      unitPrice: unitPrice,
      taxRate: taxRate,
      productId: product.id,
    });

    setSearchQuery(product.name);
    setShowDropdown(false);
    setProducts([]);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || products.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < products.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < products.length) {
          handleSelectProduct(products[selectedIndex]);
        } else if (products.length > 0) {
          handleSelectProduct(products[0]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        break;
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            if (products.length > 0 && searchQuery.length >= 1) {
              setShowDropdown(true);
            }
            onFocus?.();
          }}
          onBlur={() => {
            // Delay to allow dropdown click to register
            setTimeout(() => {
              setShowDropdown(false);
              onBlur?.();
            }, 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type product name to search"
          required={required}
          disabled={disabled || !selectedStore?.id}
          autoComplete="off"
          data-lpignore="true"
          data-form-type="other"
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && products.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {products.map((product, index) => {
            const price = product.sellingPrice || product.mrp || product.costPrice || 0;
            const taxRate = product.taxPercentage || 0;
            
            return (
              <div
                key={product.id}
                onClick={() => handleSelectProduct(product)}
                className={`px-4 py-3 cursor-pointer hover:bg-indigo-50 transition-colors ${
                  index === selectedIndex ? "bg-indigo-50" : ""
                } ${index > 0 ? "border-t border-gray-100" : ""}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 mt-1 space-x-3">
                      <span>₹{price.toFixed(2)}</span>
                      {taxRate > 0 && <span>• Tax: {taxRate}%</span>}
                      {product.quantity !== undefined && (
                        <span>• Stock: {product.quantity}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No results message */}
      {showDropdown && !loading && products.length === 0 && searchQuery.length >= 1 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm text-gray-500">
          No products found. You can still enter the product name manually.
        </div>
      )}
    </div>
  );
}

