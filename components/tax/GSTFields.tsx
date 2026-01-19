/**
 * GST Fields Component (India Only)
 * Displays GST-related fields for Indian invoices/orders
 * Only shown when country is India
 */

'use client';

import React from 'react';
import { useCountry } from '@/contexts/CountryContext';
import { useI18n } from '@/contexts/I18nContext';

interface GSTFieldsProps {
  gstMode?: 'INTRA' | 'INTER';
  onGstModeChange?: (mode: 'INTRA' | 'INTER') => void;
  hsnCode?: string;
  onHsnCodeChange?: (code: string) => void;
  placeOfSupply?: string;
  onPlaceOfSupplyChange?: (place: string) => void;
  supplierState?: string;
  onSupplierStateChange?: (state: string) => void;
  showGSTBreakdown?: boolean;
  gstBreakdown?: {
    cgst: number;
    sgst: number;
    igst: number;
    cess: number;
    totalTax: number;
  };
}

export function GSTFields({
  gstMode = 'INTRA',
  onGstModeChange,
  hsnCode,
  onHsnCodeChange,
  placeOfSupply,
  onPlaceOfSupplyChange,
  supplierState,
  onSupplierStateChange,
  showGSTBreakdown = false,
  gstBreakdown,
}: GSTFieldsProps) {
  const { isIN } = useCountry();
  const { t } = useI18n();

  // Only show for India
  if (!isIN) {
    return null;
  }

  return (
    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h3 className="text-lg font-semibold text-gray-800">
        {t('tax.gst')} {t('common.details')}
      </h3>

      {/* GST Mode Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('tax.gstMode')} *
        </label>
        <select
          value={gstMode}
          onChange={(e) => onGstModeChange?.(e.target.value as 'INTRA' | 'INTER')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="INTRA">{t('tax.intra')} ({t('tax.cgst')} + {t('tax.sgst')})</option>
          <option value="INTER">{t('tax.inter')} ({t('tax.igst')})</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {gstMode === 'INTRA'
            ? t('tax.intraDesc') || 'Same state - CGST and SGST apply'
            : t('tax.interDesc') || 'Different state - IGST applies'}
        </p>
      </div>

      {/* HSN Code */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('tax.hsnCode')} (HSN)
        </label>
        <input
          type="text"
          value={hsnCode || ''}
          onChange={(e) => onHsnCodeChange?.(e.target.value)}
          placeholder={t('tax.hsnCodePlaceholder') || 'Enter HSN code'}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Place of Supply */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('tax.placeOfSupply')}
        </label>
        <input
          type="text"
          value={placeOfSupply || ''}
          onChange={(e) => onPlaceOfSupplyChange?.(e.target.value)}
          placeholder={t('tax.placeOfSupplyPlaceholder') || 'Enter place of supply'}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Supplier State */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('tax.supplierState')}
        </label>
        <input
          type="text"
          value={supplierState || ''}
          onChange={(e) => onSupplierStateChange?.(e.target.value)}
          placeholder={t('tax.supplierStatePlaceholder') || 'Enter supplier state'}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* GST Breakdown */}
      {showGSTBreakdown && gstBreakdown && (
        <div className="mt-4 p-3 bg-white rounded border border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-2">{t('tax.gstBreakdown')}</h4>
          <div className="space-y-1 text-sm">
            {gstMode === 'INTRA' && (
              <>
                <div className="flex justify-between">
                  <span>{t('tax.cgst')}:</span>
                  <span className="font-medium">₹{gstBreakdown.cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('tax.sgst')}:</span>
                  <span className="font-medium">₹{gstBreakdown.sgst.toFixed(2)}</span>
                </div>
              </>
            )}
            {gstMode === 'INTER' && (
              <div className="flex justify-between">
                <span>{t('tax.igst')}:</span>
                <span className="font-medium">₹{gstBreakdown.igst.toFixed(2)}</span>
              </div>
            )}
            {gstBreakdown.cess > 0 && (
              <div className="flex justify-between">
                <span>{t('tax.cess')}:</span>
                <span className="font-medium">₹{gstBreakdown.cess.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="font-semibold">{t('tax.totalTax')}:</span>
              <span className="font-bold">₹{gstBreakdown.totalTax.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
