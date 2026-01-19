/**
 * AddressLookupInput Component
 * 
 * Provides intelligent address lookup and auto-population:
 * - Pincode lookup → Auto-populates city, state
 * - City lookup → Auto-populates state (static mapping)
 * - Manual override always allowed
 */

"use client";

import { useState, useEffect } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { lookupPincode, getStateFromCity, AddressLookupResult } from "@/services/addressLookup.service";

export interface AddressInfo {
  street?: string;
  city?: string;
  postcode?: string;
  state?: string;
  country?: string;
}

interface AddressLookupInputProps {
  value: AddressInfo;
  onChange: (address: AddressInfo) => void;
  disabled?: boolean;
}

export default function AddressLookupInput({
  value,
  onChange,
  disabled = false,
}: AddressLookupInputProps) {
  const [pincodeLookupLoading, setPincodeLookupLoading] = useState(false);
  const [cityLookupLoading, setCityLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  // Handle pincode lookup
  const handlePincodeLookup = async (pincode: string) => {
    if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      return;
    }

    // Don't overwrite if city and state are already filled
    if (value.city && value.state) {
      return;
    }

    try {
      setPincodeLookupLoading(true);
      setLookupError("");
      
      const result = await lookupPincode(pincode);
      
      if (result) {
        onChange({
          ...value,
          postcode: pincode,
          city: result.city || value.city,
          state: result.state || value.state,
        });
      }
    } catch (error) {
      console.error("Pincode lookup error:", error);
      setLookupError("Failed to lookup pincode. Please enter manually.");
      setTimeout(() => setLookupError(""), 5000);
    } finally {
      setPincodeLookupLoading(false);
    }
  };

  // Handle city change - auto-populate state
  const handleCityChange = async (city: string) => {
    onChange({
      ...value,
      city,
    });

    // Only auto-populate state if it's not already set
    if (city && !value.state) {
      try {
        setCityLookupLoading(true);
        const state = getStateFromCity(city);
        if (state) {
          onChange({
            ...value,
            city,
            state,
          });
        }
      } catch (error) {
        console.error("City lookup error:", error);
      } finally {
        setCityLookupLoading(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      {lookupError && (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          {lookupError}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Street Address
        </label>
        <input
          type="text"
          value={value.street || ""}
          onChange={(e) =>
            onChange({
              ...value,
              street: e.target.value,
            })
          }
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Street address, building name"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Postal Code (Pincode)
          </label>
          <div className="relative">
            <input
              type="text"
              value={value.postcode || ""}
              onChange={(e) => {
                const pincode = e.target.value.replace(/\D/g, "").slice(0, 6);
                onChange({
                  ...value,
                  postcode: pincode,
                });
              }}
              onBlur={(e) => {
                if (e.target.value.length === 6) {
                  handlePincodeLookup(e.target.value);
                }
              }}
              disabled={disabled}
              maxLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="6-digit pincode"
            />
            {pincodeLookupLoading && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Enter pincode to auto-fill city and state
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <div className="relative">
            <input
              type="text"
              value={value.city || ""}
              onChange={(e) => handleCityChange(e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="City"
            />
            {cityLookupLoading && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Auto-fills state for major cities
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State
          </label>
          <input
            type="text"
            value={value.state || ""}
            onChange={(e) =>
              onChange({
                ...value,
                state: e.target.value,
              })
            }
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="State"
          />
        </div>
      </div>

      {value.country !== "IN" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <input
            type="text"
            value={value.country || ""}
            onChange={(e) =>
              onChange({
                ...value,
                country: e.target.value,
              })
            }
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Country"
          />
        </div>
      )}
    </div>
  );
}

