/**
 * CustomerSearchDropdown Component
 * 
 * Provides intelligent customer search with autocomplete functionality.
 * Searches by name or phone number and auto-populates all customer fields on selection.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Search, User, Phone, Mail } from "lucide-react";
import { customersService, Customer } from "@/services/customers.service";
import { useDebounce } from "@/hooks/useDebounce";
import { jobCardsService, CustomerInfo, VehicleInfo } from "@/services/jobCards.service";

interface CustomerSearchDropdownProps {
  storeId: string;
  value: CustomerInfo;
  onChange: (customer: CustomerInfo) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onVehicleLoad?: (vehicle: VehicleInfo | null) => void; // Callback to populate vehicle info
  required?: boolean;
  disabled?: boolean;
  searchBy?: "name" | "phone"; // Search by name or phone
}

export default function CustomerSearchDropdown({
  storeId,
  value,
  onChange,
  onFocus,
  onBlur,
  onVehicleLoad,
  required = false,
  disabled = false,
  searchBy = "name",
}: CustomerSearchDropdownProps) {
  // Initialize searchQuery from value prop
  const [searchQuery, setSearchQuery] = useState(() => {
    if (searchBy === "name") {
      return value.name || "";
    } else {
      return value.phone || "";
    }
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(searchQuery, 150);

  // Search customers when query changes
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 1) {
      setCustomers([]);
      setShowDropdown(false);
      return;
    }

    const searchCustomers = async () => {
      try {
        setLoading(true);
        const response = await customersService.getCustomers({
          storeId,
          search: debouncedSearch,
          limit: 10,
        });
        setCustomers(response.data || []);
        setShowDropdown(response.data && response.data.length > 0);
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
  }, [debouncedSearch, storeId]);

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

    // Update the corresponding field in form data (but don't trigger onChange if selecting from dropdown)
    // This is just for typing - selection is handled by handleSelectCustomer
    if (searchBy === "name") {
      onChange({
        ...value,
        name: query,
        // Preserve customerId if we're just editing the name
        customerId: query.trim() === value.name ? value.customerId : undefined,
      });
    } else if (searchBy === "phone") {
      onChange({
        ...value,
        phone: query,
        // Preserve customerId if we're just editing the phone
        customerId: query.trim() === value.phone ? value.customerId : undefined,
      });
    }
  };

  const handleSelectCustomer = async (customer: Customer) => {
    // Transform Customer to CustomerInfo format
    const customerInfo: CustomerInfo = {
      customerId: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: {
        country: "IN",
      },
    };

    onChange(customerInfo);
    if (searchBy === "name") {
      setSearchQuery(customer.name);
    } else {
      setSearchQuery(customer.phone || "");
    }
    setShowDropdown(false);
    setCustomers([]);
    inputRef.current?.blur();

    // Fetch vehicle info from previous job cards if customerId exists and callback is provided
    if (customer.id && onVehicleLoad) {
      try {
        const jobCardsResponse = await jobCardsService.getCustomerJobCards(
          customer.id,
          {
            storeId,
            limit: 10, // Get recent job cards
          }
        );

        // Find the most recent job card with vehicle info
        if (jobCardsResponse.items && jobCardsResponse.items.length > 0) {
          // Sort by createdAt desc to get most recent first
          const sortedJobCards = [...jobCardsResponse.items].sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
          });

          // Find first job card with vehicle info
          const jobCardWithVehicle = sortedJobCards.find(
            (jc) => jc.vehicle && (jc.vehicle.regNo || jc.vehicle.make || jc.vehicle.model)
          );

          if (jobCardWithVehicle && jobCardWithVehicle.vehicle) {
            onVehicleLoad(jobCardWithVehicle.vehicle);
          } else {
            onVehicleLoad(null);
          }
        } else {
          onVehicleLoad(null);
        }
      } catch (error) {
        console.error("Error fetching customer job cards for vehicle info:", error);
        // Don't block the flow if vehicle fetch fails
        if (onVehicleLoad) {
          onVehicleLoad(null);
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

  // Display current value in input - use searchQuery as source of truth
  const displayValue = searchQuery;

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type={searchBy === "phone" ? "tel" : "text"}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (customers.length > 0) setShowDropdown(true);
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
          placeholder={searchBy === "phone" ? "Enter phone number" : "Enter customer name"}
          required={required}
          disabled={disabled}
          autoComplete="off"
          data-lpignore="true"
          data-form-type="other"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && customers.length > 0 && (
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
      {showDropdown && !loading && customers.length === 0 && debouncedSearch.length >= 1 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
          No customers found. Create a new customer.
        </div>
      )}
    </div>
  );
}

