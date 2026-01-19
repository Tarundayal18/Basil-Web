/**
 * VehicleRegistrationInput Component
 * 
 * Provides intelligent vehicle registration number parsing:
 * - Parses Indian registration numbers (XX##YY#### format)
 * - Extracts state code (MH, KA, DL, etc.)
 * - Detects vehicle type (2W/4W) - heuristic
 * - Suggests make/model based on registration pattern
 * - Integrates with vehicle history for auto-population
 * - Manual override always allowed
 */

"use client";

import { useState, useEffect } from "react";
import { Car, Loader2, AlertCircle } from "lucide-react";
import {
  parseVehicleRegistration,
  getVehicleSuggestions,
  VehicleRegistrationParseResult,
} from "@/services/vehicleRegistration.service";
import {
  getVehicleByRegistration,
} from "@/services/vehicleHistory.service";

import { VehicleInfo } from "@/services/jobCards.service";

interface VehicleRegistrationInputProps {
  value: VehicleInfo;
  onChange: (vehicle: VehicleInfo) => void;
  disabled?: boolean;
  showSuggestions?: boolean;
}

export default function VehicleRegistrationInput({
  value,
  onChange,
  disabled = false,
  showSuggestions = true,
}: VehicleRegistrationInputProps) {
  const [parseResult, setParseResult] = useState<VehicleRegistrationParseResult | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ make: string; model: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [parseError, setParseError] = useState("");
  const [historyEntry, setHistoryEntry] = useState<VehicleInfo | null>(null);

  // Check vehicle history and parse registration when regNo changes
  useEffect(() => {
    if (!value.regNo || value.regNo.length < 8) {
      setHistoryEntry(null);
      setParseResult(null);
      setSuggestions([]);
      return;
    }

    // Always parse registration number first (for state code, vehicle type)
    const normalizedRegNo = value.regNo.trim().toUpperCase().replace(/\s/g, "");
    const parseResult = parseVehicleRegistration(normalizedRegNo);
    setParseResult(parseResult);

    // Auto-populate state code and vehicle type from parsing (for first-time cars)
    if (parseResult && (!value.make || !value.model)) {
      // Only auto-populate if fields are empty (user hasn't manually entered)
      const updates: Partial<typeof value> = {};
      
      // Parse registration for state/vehicle type detection (always works)
      if (parseResult.state && !value.make) {
        // State code detected - this helps with lookup but doesn't populate make/model directly
      }
      
      // Always try to get suggestions even for first-time cars
      if (showSuggestions && parseResult) {
        const vehicleSuggestions = getVehicleSuggestions(parseResult);
        setSuggestions(vehicleSuggestions);
      }
    }

    // Check vehicle history from backend (for existing vehicles)
    const checkHistory = async () => {
      if (!value.regNo) {
        setHistoryEntry(null);
        return;
      }

      try {
        setLoading(true);
        setParseError("");
        const history = await getVehicleByRegistration(value.regNo);
        if (history) {
          setHistoryEntry(history);
          // Auto-populate from history if fields are empty
          if (!value.make || !value.model) {
            onChange({
              ...value,
              make: history.make || value.make,
              model: history.model || value.model,
              vin: history.vin || value.vin,
            });
          }
        } else {
          setHistoryEntry(null);
        }
      } catch (error) {
        console.error("Registration parsing/history error:", error);
        setParseError("Failed to fetch vehicle history");
        setTimeout(() => setParseError(""), 5000);
      } finally {
        setLoading(false);
      }
    };

    checkHistory();
  }, [value.regNo, showSuggestions]);

  const handleRegNoChange = (regNo: string) => {
    // Normalize: uppercase, remove spaces
    const normalized = regNo.trim().toUpperCase().replace(/\s/g, "");
    onChange({
      ...value,
      regNo: normalized,
    });
  };

  const handleSuggestionSelect = (make: string, model: string) => {
    onChange({
      ...value,
      make,
      model,
    });
    setSuggestions([]);
  };

  const handleHistorySelect = () => {
    if (historyEntry) {
      onChange({
        ...value,
        make: historyEntry.make,
        model: historyEntry.model,
        vin: historyEntry.vin,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Registration Number Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Registration Number <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Car className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={value.regNo || ""}
            onChange={(e) => handleRegNoChange(e.target.value)}
            disabled={disabled}
            maxLength={13}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed uppercase"
            placeholder="MH12AB1234"
          />
          {loading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
            </div>
          )}
        </div>
        {parseError && (
          <div className="mt-1 flex items-center space-x-1 text-sm text-yellow-600">
            <AlertCircle className="h-4 w-4" />
            <span>{parseError}</span>
          </div>
        )}
        {parseResult?.state && (
          <p className="mt-1 text-xs text-gray-500">
            Detected state: <span className="font-medium">{parseResult.state}</span>
            {parseResult.vehicleType && ` | Type: ${parseResult.vehicleType}`}
          </p>
        )}
      </div>

      {/* Vehicle History Entry */}
      {historyEntry && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Vehicle found in previous job cards
              </p>
              {(historyEntry.make || historyEntry.model) && (
                <button
                  type="button"
                  onClick={handleHistorySelect}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Fill details: {historyEntry.make || ""} {historyEntry.model || ""}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Make and Model */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Make/Brand
          </label>
          <input
            type="text"
            value={value.make || ""}
            onChange={(e) =>
              onChange({
                ...value,
                make: e.target.value,
              })
            }
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="e.g., Maruti Suzuki, Hyundai"
          />
          {parseResult?.suggestedMake && !value.make && (
            <p className="mt-1 text-xs text-gray-500">
              Suggested: {parseResult.suggestedMake}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model
          </label>
          <input
            type="text"
            value={value.model || ""}
            onChange={(e) =>
              onChange({
                ...value,
                model: e.target.value,
              })
            }
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="e.g., Swift, i20"
          />
          {parseResult?.suggestedModel && !value.model && (
            <p className="mt-1 text-xs text-gray-500">
              Suggested: {parseResult.suggestedModel}
            </p>
          )}
        </div>
      </div>

      {/* Make/Model Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && !value.make && !value.model && (
        <div className="border border-gray-200 rounded-lg shadow-sm bg-white p-3 max-h-40 overflow-auto">
          <p className="text-xs font-medium text-gray-700 mb-2">
            Suggested make/model combinations:
          </p>
          <div className="space-y-1">
            {suggestions.slice(0, 5).map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionSelect(suggestion.make, suggestion.model)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded border border-gray-200 hover:border-indigo-300 transition-colors"
              >
                <span className="font-medium">{suggestion.make}</span>{" "}
                <span className="text-gray-600">{suggestion.model}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* VIN, Year, Odometer, Fuel Level */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            VIN (Chassis Number)
          </label>
          <input
            type="text"
            value={value.vin || ""}
            onChange={(e) =>
              onChange({
                ...value,
                vin: e.target.value,
              })
            }
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed uppercase"
            placeholder="17-character VIN"
            maxLength={17}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year
          </label>
          <input
            type="number"
            value={value.year || ""}
            onChange={(e) =>
              onChange({
                ...value,
                year: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            disabled={disabled}
            min="1900"
            max={new Date().getFullYear() + 1}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="e.g., 2020"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Odometer Reading (km)
          </label>
          <input
            type="number"
            value={value.odometer || ""}
            onChange={(e) =>
              onChange({
                ...value,
                odometer: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            disabled={disabled}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Current odometer reading"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fuel Level
          </label>
          <select
            value={value.fuelLevel || ""}
            onChange={(e) =>
              onChange({
                ...value,
                fuelLevel: e.target.value || undefined,
              })
            }
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select fuel level</option>
            <option value="Full">Full</option>
            <option value="3/4">3/4</option>
            <option value="1/2">1/2</option>
            <option value="1/4">1/4</option>
            <option value="Empty">Empty</option>
            <option value="Not Applicable">Not Applicable</option>
          </select>
        </div>
      </div>
    </div>
  );
}

