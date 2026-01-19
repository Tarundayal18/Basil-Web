/**
 * Country Selector Component
 * Allows users to switch between India (IN) and Netherlands (NL) regions
 */

'use client';

import React from 'react';
import { useCountry } from '@/contexts/CountryContext';
import { Country, getCountryName } from '@/lib/region-config';

export function CountrySelector() {
  const { country, setCountry, isNL, isIN, isDE } = useCountry();

  const handleCountryChange = (newCountry: Country) => {
    if (newCountry !== country) {
      // Confirm with user if they're switching regions (data won't be accessible)
      const confirmed = window.confirm(
        `Switch to ${getCountryName(newCountry)} region? This will change the API endpoint and you may need to log in again.`
      );
      
      if (confirmed) {
        setCountry(newCountry);
        // Clear auth token when switching regions (different auth endpoints)
        localStorage.removeItem('token');
        // Reload page to reinitialize with new region
        window.location.reload();
      }
    }
  };

  const getRegionName = () => {
    if (isIN) return '(Mumbai)';
    if (isNL) return '(EU - Frankfurt)';
    if (isDE) return '(EU - Frankfurt)';
    return '';
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">Region:</label>
      <div className="flex gap-2">
        <button
          onClick={() => handleCountryChange('IN')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            isIN
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          title="India - Mumbai region"
        >
          🇮🇳 India
        </button>
        <button
          onClick={() => handleCountryChange('NL')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            isNL
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          title="Netherlands - EU region"
        >
          🇳🇱 Netherlands
        </button>
        <button
          onClick={() => handleCountryChange('DE')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            isDE
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          title="Germany - EU region"
        >
          🇩🇪 Germany
        </button>
      </div>
      <span className="text-xs text-gray-500">
        {getRegionName()}
      </span>
    </div>
  );
}
