/**
 * CustomerSearchInput Component for Billing Page
 * 
 * Provides intelligent customer search with autocomplete functionality.
 * Searches by name or phone number and auto-populates all customer fields on selection.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { User, Phone, Mail } from "lucide-react";
import { customersService, Customer } from "@/services/customers.service";
import { useDebounce } from "@/hooks/useDebounce";

interface CustomerSearchInputProps {
  storeId: string;
  value: string;
  onChange: (value: string) => void;
  onCustomerSelect?: (customer: Customer) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  searchBy?: "name" | "phone";
}

export default function CustomerSearchInput({
  storeId,
  value,
  onChange,
  onCustomerSelect,
  placeholder = "Enter customer name",
  required = false,
  disabled = false,
  searchBy = "name",
}: CustomerSearchInputProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [customerSelected, setCustomerSelected] = useState(false); // Track if customer is selected
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cacheRef = useRef<Map<string, Customer[]>>(new Map());
  const selectedCustomerRef = useRef<Customer | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 150);

  // Sync searchQuery with value prop
  useEffect(() => {
    // Only sync if customer hasn't been selected (to prevent search restarting after selection)
    // Also check if the value actually changed to avoid unnecessary updates
    if (!customerSelected && value !== searchQuery) {
      setSearchQuery(value);
    }
  }, [value, customerSelected]);

  // Reset customerSelected when user starts typing new search
  useEffect(() => {
    // If search query changes and it's different from the selected customer's value, reset selection
    if (customerSelected && selectedCustomerRef.current) {
      const selectedValue = searchBy === "name" 
        ? selectedCustomerRef.current.name 
        : selectedCustomerRef.current.phone || "";
      
      if (searchQuery !== selectedValue) {
        setCustomerSelected(false);
        selectedCustomerRef.current = null;
      }
    }
  }, [searchQuery, searchBy, customerSelected]);

  // Search customers when query changes (but NOT if customer is already selected or disabled)
  useEffect(() => {
    // Don't search if component is disabled, customer is selected, or query is empty
    if (disabled || customerSelected || !debouncedSearch || debouncedSearch.length < 1) {
      if (disabled || customerSelected) {
        setCustomers([]);
        setShowDropdown(false);
      }
      return;
    }

    // Check cache first
    const cacheKey = `${storeId}-${debouncedSearch}`;
    if (cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey)!;
      setCustomers(cached);
      setShowDropdown(cached.length > 0);
      setSelectedIndex(-1);
      return;
    }

    const searchCustomers = async () => {
      try {
        setLoading(true);
        const response = await customersService.getCustomers({
          storeId,
          search: debouncedSearch,
          limit: 50, // Fetch more to allow better sorting
        });
        let results = response.data || [];
        
        // Sort results: names starting with search query first, then ascending order
        const searchLower = debouncedSearch.toLowerCase().trim();
        results = results.sort((a, b) => {
          const aName = (a.name || "").toLowerCase();
          const bName = (b.name || "").toLowerCase();
          const aStartsWith = aName.startsWith(searchLower);
          const bStartsWith = bName.startsWith(searchLower);
          
          // Names starting with search query come first
          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;
          
          // Both start with query or both don't - sort alphabetically
          return aName.localeCompare(bName);
        });
        
        // Limit to top 10 after sorting
        results = results.slice(0, 10);
        
        // Cache the results
        cacheRef.current.set(cacheKey, results);
        
        setCustomers(results);
        setShowDropdown(results.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error("Error searching customers:", error);
        setCustomers([]);
        setShowDropdown(false);
      } finally {
        setLoading(false);
      }
    };

    searchCustomers();
  }, [debouncedSearch, storeId, customerSelected, disabled]);

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
    onChange(query);
    // Reset customer selected state when user manually types (only if value actually changed)
    if (customerSelected && query !== (searchBy === "name" 
      ? selectedCustomerRef.current?.name 
      : selectedCustomerRef.current?.phone)) {
      setCustomerSelected(false);
      selectedCustomerRef.current = null;
      // Clear customers list when user starts new search
      setCustomers([]);
      setShowDropdown(false);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    // Mark customer as selected immediately to stop further searches
    setCustomerSelected(true);
    selectedCustomerRef.current = customer;
    
    // Update the input value
    if (searchBy === "name") {
      setSearchQuery(customer.name);
      onChange(customer.name);
    } else {
      setSearchQuery(customer.phone || "");
      onChange(customer.phone || "");
    }
    
    // Immediately hide dropdown and clear customers list
    setShowDropdown(false);
    setCustomers([]);
    setSelectedIndex(-1);
    
    // Call onCustomerSelect callback to populate all fields IMMEDIATELY
    // This must be called before blur to ensure the callback executes
    if (onCustomerSelect) {
      // Log for debugging
      console.log("Customer selected:", {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        gstin: customer.gstin,
        billingAddress: customer.billingAddress,
      });
      onCustomerSelect(customer);
    }
    
    // Blur input to stop any further interactions
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Don't handle keys if customer is selected
    if (customerSelected) {
      return;
    }

    if (!showDropdown || customers.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < customers.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < customers.length) {
          handleSelectCustomer(customers[selectedIndex]);
        } else if (customers.length > 0) {
          handleSelectCustomer(customers[0]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        break;
    }
  };

  const handleFocus = () => {
    // Don't show dropdown if disabled or customer is selected
    if (disabled || customerSelected) {
      setShowDropdown(false);
      return;
    }
    // Only show dropdown if there are customers and we have a search query
    if (customers.length > 0 && debouncedSearch.length >= 1) {
      setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    // Delay to allow dropdown click to register, but don't delay if customer is selected or disabled
    if (!customerSelected && !disabled) {
      setTimeout(() => {
        setShowDropdown(false);
      }, 200);
    } else {
      // Immediately hide if customer is selected or disabled
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type={searchBy === "phone" ? "tel" : "text"}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          data-lpignore="true"
          data-form-type="other"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
          </div>
        )}
      </div>

      {/* Dropdown - Only show if customer is NOT selected */}
      {showDropdown && customers.length > 0 && !customerSelected && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {customers.map((customer, index) => (
            <div
              key={customer.id}
              onClick={() => handleSelectCustomer(customer)}
              className={`px-4 py-3 cursor-pointer hover:bg-indigo-50 transition-colors ${
                index === selectedIndex ? "bg-indigo-50" : ""
              } ${index > 0 ? "border-t border-gray-100" : ""}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {customer.name}
                  </p>
                  <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                    {customer.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="h-3 w-3" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    {customer.email && (
                      <div className="flex items-center space-x-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {showDropdown && !loading && customers.length === 0 && debouncedSearch.length >= 1 && !customerSelected && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
          No customers found. Create a new customer.
        </div>
      )}
    </div>
  );
}
