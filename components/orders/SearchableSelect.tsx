"use client";

import { useState, useEffect, useRef } from "react";
import { inventoryService, Product } from "@/services/inventory.service";
import { useProductSalesCount } from "@/hooks/useProductSalesCount";

interface ProductOption {
  id: string;
  name: string;
  sellingPrice?: number;
  mrp?: number;
  taxPercentage?: number;
  marginPercentage?: number;
  quantity: number;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  onProductSelect?: (product: ProductOption) => void;
  onAddNewProduct?: (productName: string) => void;
  placeholder?: string;
  className?: string;
  storeId?: string;
}

export default function SearchableSelect({
  value,
  onChange,
  onProductSelect,
  onAddNewProduct,
  placeholder = "Select...",
  className = "",
  storeId,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<Map<string, ProductOption[]>>(new Map());
  
  // Get product sales counts for sorting
  const { salesCounts } = useProductSalesCount(storeId);

  const selectedOption = options.find((opt) => opt.id === value);

  const fetchProducts = async (search: string = "") => {
    if (!storeId) {
      console.warn("Store ID is required to fetch products");
      setOptions([]);
      return;
    }

    const searchKey = search.trim().toLowerCase();
    const cacheKey = `${storeId}:${searchKey || "all"}`;

    // Check cache first and show immediately
    if (cacheRef.current.has(cacheKey)) {
      const cachedResults = cacheRef.current.get(cacheKey)!;
      setOptions(cachedResults);
      setLoading(false);
    }

    try {
      // Only show loading if we don't have cached results
      if (!cacheRef.current.has(cacheKey)) {
        setLoading(true);
      }

      const params: {
        limit: number;
        lastKey?: string;
        search?: string;
        storeId: string;
      } = {
        limit: 100,
        storeId,
      };
      // Allow search with 1 or more characters
      if (search.trim().length >= 1) {
        params.search = search.trim();
      }
      const response = await inventoryService.getInventory(params);
      if (response.data) {
        const productsData = response.data || [];
        if (Array.isArray(productsData)) {
          const mappedProducts = productsData.map((p: Product) => ({
            id: p.id,
            name: p.name,
            sellingPrice: p.sellingPrice,
            mrp: p.mrp,
            taxPercentage: p.taxPercentage,
            marginPercentage: p.marginPercentage,
            quantity: p.quantity,
          }));
          
          // Sort products by sales count (most sold first), then by name
          // Priority:
          // 1. Products starting with search term (if searching)
          // 2. Sales count (most sold first) - use salesCounts from hook
          // 3. Alphabetical order
          // Note: This initial sort uses available salesCounts, but will be re-sorted when salesCounts updates
          mappedProducts.sort((a, b) => {
            const aSalesCount = salesCounts.get(a.id) || 0;
            const bSalesCount = salesCounts.get(b.id) || 0;
            
            if (searchKey) {
              const aName = a.name.toLowerCase();
              const bName = b.name.toLowerCase();
              const searchLower = searchKey.toLowerCase();
              
              const aStartsWith = aName.startsWith(searchLower);
              const bStartsWith = bName.startsWith(searchLower);
              
              // If one starts with search term and the other doesn't, prioritize the one that starts
              if (aStartsWith && !bStartsWith) return -1;
              if (!aStartsWith && bStartsWith) return 1;
              
              // If both start with search term or both don't, sort by sales count first
              if (aSalesCount !== bSalesCount) {
                return bSalesCount - aSalesCount; // Most sold first
              }
              
              // If same sales count, sort alphabetically
              return aName.localeCompare(bName);
            } else {
              // If no search term, sort by sales count first (most sold first)
              if (aSalesCount !== bSalesCount) {
                return bSalesCount - aSalesCount; // Most sold first
              }
              
              // If same sales count, sort alphabetically
              return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
            }
          });
          
          // Cache the results
          cacheRef.current.set(cacheKey, mappedProducts);
          
          // Only update if this is still the current search
          if (searchTerm.trim().toLowerCase() === searchKey) {
            setOptions(mappedProducts);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
      // Don't clear options if we have cached results
      if (!cacheRef.current.has(cacheKey)) {
        setOptions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Sort options when salesCounts updates - this ensures proper sorting even if salesCounts loads after products
  useEffect(() => {
    if (options.length > 0) {
      // Create a stable sort function that prioritizes sales count
      const sortedOptions = [...options].sort((a, b) => {
        const aSalesCount = salesCounts.get(a.id) || 0;
        const bSalesCount = salesCounts.get(b.id) || 0;
        const searchKey = searchTerm.trim().toLowerCase();
        
        if (searchKey) {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          const searchLower = searchKey.toLowerCase();
          
          const aStartsWith = aName.startsWith(searchLower);
          const bStartsWith = bName.startsWith(searchLower);
          
          // If one starts with search term and the other doesn't, prioritize the one that starts
          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;
          
          // If both start with search term or both don't, sort by sales count first (descending)
          if (aSalesCount !== bSalesCount) {
            return bSalesCount - aSalesCount; // Most sold first
          }
          
          // If same sales count, sort alphabetically (ascending)
          return aName.localeCompare(bName);
        } else {
          // If no search term, sort by sales count first (descending - most sold first)
          if (aSalesCount !== bSalesCount) {
            return bSalesCount - aSalesCount; // Most sold first
          }
          
          // If same sales count, sort alphabetically (ascending)
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        }
      });
      
      // Always update to ensure correct order based on current salesCounts
      // Use a deep comparison to avoid unnecessary re-renders
      const orderChanged = sortedOptions.some((opt, idx) => opt.id !== options[idx]?.id);
      if (orderChanged) {
        setOptions(sortedOptions);
        // Update cache with sorted results
        const cacheKey = `${storeId}:${searchTerm.trim().toLowerCase() || "all"}`;
        cacheRef.current.set(cacheKey, sortedOptions);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesCounts, searchTerm]); // Re-sort when salesCounts updates or searchTerm changes

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (isOpen && storeId) {
      debounceTimerRef.current = setTimeout(() => {
        fetchProducts(searchTerm);
      }, 150); // Reduced from 300ms to 150ms for faster response
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm, isOpen, storeId]);

  // Load initial products when dropdown opens
  useEffect(() => {
    if (isOpen && !loading && storeId) {
      fetchProducts(searchTerm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, storeId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        if (value) {
          setSearchTerm("");
        }
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const handleSelect = (optionId: string) => {
    const selected = options.find((opt) => opt.id === optionId);
    onChange(optionId);
    if (selected && onProductSelect) {
      onProductSelect(selected);
    }
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      !isOpen &&
      (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")
    ) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }

    if (e.key === "Escape") {
      setIsOpen(false);
      setSearchTerm("");
      setHighlightedIndex(-1);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const maxIndex =
        options.length +
        (onAddNewProduct &&
        searchTerm.trim() &&
        !options.some(
          (opt) => opt.name.toLowerCase() === searchTerm.trim().toLowerCase()
        )
          ? 1
          : 0) -
        1;
      setHighlightedIndex((prev) => (prev < maxIndex ? prev + 1 : prev));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      const showAddNewOption =
        onAddNewProduct &&
        searchTerm.trim() &&
        !options.some(
          (opt) => opt.name.toLowerCase() === searchTerm.trim().toLowerCase()
        );
      const maxIndex = options.length + (showAddNewOption ? 1 : 0) - 1;
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      return;
    }

    if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      // Check if it's the "add new product" option
      const showAddNewOption =
        onAddNewProduct &&
        searchTerm.trim() &&
        !options.some(
          (opt) => opt.name.toLowerCase() === searchTerm.trim().toLowerCase()
        );
      if (options.length === 0 && highlightedIndex === 0 && showAddNewOption) {
        // Empty state with add new option
        onAddNewProduct(searchTerm.trim());
        setIsOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
        return;
      }
      if (highlightedIndex === options.length && showAddNewOption) {
        // Add new option at end of list
        onAddNewProduct(searchTerm.trim());
        setIsOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
        return;
      }
      if (highlightedIndex < options.length) {
        handleSelect(options[highlightedIndex].id);
      }
      return;
    }
  };

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className="relative cursor-pointer"
        onClick={() => {
          if (!isOpen) {
            setIsOpen(true);
            if (value && selectedOption && !searchTerm) {
              setSearchTerm(selectedOption.name);
            }
            setTimeout(() => {
              inputRef.current?.focus();
              if (inputRef.current) {
                inputRef.current.select();
              }
            }, 0);
          }
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : selectedOption?.name || ""}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsOpen(true);
            if (value && selectedOption && !searchTerm) {
              setSearchTerm(selectedOption.name);
            }
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.select();
              }
            }, 0);
          }}
          onBlur={(e) => {
            const relatedTarget = e.relatedTarget as Node;
            if (!containerRef.current?.contains(relatedTarget)) {
              setTimeout(() => {
                if (!containerRef.current?.contains(document.activeElement)) {
                  setIsOpen(false);
                  if (value) {
                    setSearchTerm("");
                  }
                }
              }, 150);
            }
          }}
          placeholder={placeholder}
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isOpen ? "transform rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="px-4 py-8 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-500 text-sm">Loading products...</p>
            </div>
          ) : options.length > 0 ? (
            <ul ref={listRef} className="py-1">
              {options.map((option, index) => (
                <li
                  key={option.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(option.id);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-4 py-2 cursor-pointer hover:bg-indigo-50 ${
                    highlightedIndex === index ? "bg-indigo-50" : ""
                  } ${value === option.id ? "bg-indigo-100 font-medium" : ""} ${
                    option.quantity === 0 ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">{option.name}</span>
                        {salesCounts.get(option.id) !== undefined && salesCounts.get(option.id)! > 0 && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                            🔥 {salesCounts.get(option.id)} sold
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Qty: {option.quantity}
                        {option.quantity === 0 && (
                          <span className="ml-2 text-red-600">
                            (Out of stock)
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-gray-500 text-sm ml-2">
                      ₹
                      {option.mrp?.toFixed(2) ||
                        option.sellingPrice?.toFixed(2) ||
                        "0.00"}
                    </span>
                  </div>
                </li>
              ))}
              {onAddNewProduct &&
                searchTerm.trim() &&
                !options.some(
                  (opt) =>
                    opt.name.toLowerCase() === searchTerm.trim().toLowerCase()
                ) && (
                  <li
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onAddNewProduct(searchTerm.trim());
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    onMouseEnter={() => setHighlightedIndex(options.length)}
                    className={`px-4 py-2 cursor-pointer hover:bg-green-50 border-t border-gray-200 ${
                      highlightedIndex === options.length ? "bg-green-50" : ""
                    }`}
                  >
                    <div className="flex items-center text-green-600">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      <span className="font-medium">
                        Add new product: &quot;{searchTerm.trim()}&quot;
                      </span>
                    </div>
                  </li>
                )}
            </ul>
          ) : (
            <ul ref={listRef} className="py-1">
              {onAddNewProduct && searchTerm.trim() ? (
                <li
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onAddNewProduct(searchTerm.trim());
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  onMouseEnter={() => setHighlightedIndex(0)}
                  className={`px-4 py-2 cursor-pointer hover:bg-green-50 ${
                    highlightedIndex === 0 ? "bg-green-50" : ""
                  }`}
                >
                  <div className="flex items-center text-green-600">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span className="font-medium">
                      Add new product: &quot;{searchTerm.trim()}&quot;
                    </span>
                  </div>
                </li>
              ) : (
                <li className="px-4 py-2 text-gray-500 text-sm">
                  {searchTerm.trim()
                    ? "No products found"
                    : "Type to search products..."}
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
