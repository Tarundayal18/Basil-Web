/**
 * VAT Fields Component (EU Only - NL & Germany)
 * Simple VAT fields for European invoices/orders
 * Shown only for NL and DE, hides GST complexity
 */

'use client';

import React from 'react';
import { useCountry } from '@/contexts/CountryContext';
import { useI18n } from '@/contexts/I18nContext';

interface VATFieldsProps {
  vatRate?: number;
  onVatRateChange?: (rate: number) => void;
  vatMode?: 'normal' | 'reverse_charge' | 'intra_eu_b2b' | 'export';
  onVatModeChange?: (mode: 'normal' | 'reverse_charge' | 'intra_eu_b2b' | 'export') => void;
  customerVatId?: string;
  onCustomerVatIdChange?: (vatId: string) => void;
  showVATBreakdown?: boolean;
  vatBreakdown?: {
    subtotal: number;
    vatAmount: number;
    total: number;
  };
}

export function VATFields({
  vatRate = 21,
  onVatRateChange,
  vatMode = 'normal',
  onVatModeChange,
  customerVatId,
  onCustomerVatIdChange,
  showVATBreakdown = false,
  vatBreakdown,
}: VATFieldsProps) {
  const { country, isNL, isDE } = useCountry();
  const { t } = useI18n();

  // Only show for EU countries (NL or DE)
  if (!isNL && !isDE) {
    return null;
  }

  // Get country-specific VAT rates
  const availableRates = isNL 
    ? [0, 9, 21]  // Netherlands rates
    : [0, 7, 19]; // Germany rates

  const defaultRate = isNL ? 21 : 19;

  return (
    <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
      <h3 className="text-lg font-semibold text-gray-800">
        {t('tax.vat')} {t('common.details')}
      </h3>

      {/* VAT Rate Selection - Simple and clean */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('tax.vatRate')} *
        </label>
        <select
          value={vatRate || defaultRate}
          onChange={(e) => onVatRateChange?.(parseFloat(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {availableRates.map((rate) => (
            <option key={rate} value={rate}>
              {rate}% {rate === 0 ? `(${t('tax.zeroRated')})` : rate === (isNL ? 9 : 7) ? `(${t('tax.reducedRate')})` : `(${t('tax.standardRate')})`}
            </option>
          ))}
        </select>
      </div>

      {/* VAT Mode Selection (only for reverse charge or intra-EU B2B) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('tax.vatMode')}
        </label>
        <select
          value={vatMode}
          onChange={(e) => onVatModeChange?.(e.target.value as any)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="normal">{t('tax.normal')}</option>
          <option value="reverse_charge">{t('tax.reverseCharge')}</option>
          <option value="intra_eu_b2b">{t('tax.intraEUB2B')}</option>
          <option value="export">{t('tax.export')}</option>
        </select>
      </div>

      {/* Customer VAT ID (required for intra-EU B2B) */}
      {(vatMode === 'intra_eu_b2b') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('tax.customerVATID')} *
          </label>
          <input
            type="text"
            value={customerVatId || ''}
            onChange={(e) => onCustomerVatIdChange?.(e.target.value)}
            placeholder={isNL ? 'NL123456789B01' : 'DE123456789'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            {isNL 
              ? 'Format: NL + 9 digits + B + 2 digits'
              : 'Format: DE + 9 digits'}
          </p>
        </div>
      )}

      {/* Simple VAT Breakdown - Much simpler than GST */}
      {showVATBreakdown && vatBreakdown && (
        <div className="mt-4 p-3 bg-white rounded border border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-2">{t('tax.vatBreakdown')}</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>{t('invoices.subtotal')}:</span>
              <span className="font-medium">€{vatBreakdown.subtotal.toFixed(2)}</span>
            </div>
            {vatMode === 'normal' && vatRate > 0 && (
              <div className="flex justify-between">
                <span>{t('tax.vat')} ({vatRate}%):</span>
                <span className="font-medium">€{vatBreakdown.vatAmount.toFixed(2)}</span>
              </div>
            )}
            {(vatMode === 'reverse_charge' || vatMode === 'intra_eu_b2b' || vatMode === 'export') && (
              <div className="flex justify-between text-green-600">
                <span>{t('tax.vatExempt')}:</span>
                <span className="font-medium">€0.00</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="font-semibold">{t('invoices.grandTotal')}:</span>
              <span className="font-bold">€{vatBreakdown.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
