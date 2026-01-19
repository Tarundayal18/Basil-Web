/**
 * Invoice Form Example
 * Shows how to conditionally render GST (India) vs VAT (EU) fields
 * Enterprise-grade implementation with country-aware UI
 */

'use client';

import React, { useState } from 'react';
import { useCountry } from '@/contexts/CountryContext';
import { useI18n } from '@/contexts/I18nContext';
import { GSTFields } from '@/components/tax/GSTFields';
import { VATFields } from '@/components/tax/VATFields';
import { apiClient } from '@/lib/api';

interface InvoiceItem {
  productId: string;
  quantity: number;
  price: number;
  taxAmount?: number;
  vatRate?: number;
  hsnCode?: string;
}

export function InvoiceFormExample() {
  const { country, isIN, isNL, isDE } = useCountry();
  const { t } = useI18n();

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  
  // India-specific GST state
  const [gstMode, setGstMode] = useState<'INTRA' | 'INTER'>('INTRA');
  const [hsnCode, setHsnCode] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState('');
  
  // EU-specific VAT state
  const [vatRate, setVatRate] = useState(isNL ? 21 : isDE ? 19 : 21);
  const [vatMode, setVatMode] = useState<'normal' | 'reverse_charge' | 'intra_eu_b2b' | 'export'>('normal');
  const [customerVatId, setCustomerVatId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Build request body based on country
      const requestBody: any = {
        customerName,
        customerPhone,
        items,
      };

      // Add country-specific fields
      if (isIN) {
        // India: GST fields
        requestBody.gstMode = gstMode;
        requestBody.hsnCode = hsnCode;
        requestBody.placeOfSupply = placeOfSupply;
      } else if (isNL || isDE) {
        // EU: VAT fields (simpler)
        requestBody.vatRate = vatRate;
        requestBody.vatMode = vatMode;
        if (vatMode === 'intra_eu_b2b') {
          requestBody.customerVatId = customerVatId;
        }
      }

      // API client automatically sends X-Country header
      const response = await apiClient.post('/shopkeeper/orders', requestBody);

      if (response.success) {
        alert(t('success.invoiceCreated'));
        // Reset form or navigate
      }
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      alert(t('errors.createFailed'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-800">
        {t('invoices.createInvoice')}
      </h2>

      {/* Common fields - shown for all countries */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('invoices.customerName')} *
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('invoices.customerPhone')}
          </label>
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* India: GST Fields (Complex) - Only shown for India */}
      {isIN && (
        <GSTFields
          gstMode={gstMode}
          onGstModeChange={setGstMode}
          hsnCode={hsnCode}
          onHsnCodeChange={setHsnCode}
          placeOfSupply={placeOfSupply}
          onPlaceOfSupplyChange={setPlaceOfSupply}
          showGSTBreakdown={false}
        />
      )}

      {/* EU: VAT Fields (Simple) - Only shown for NL/DE */}
      {(isNL || isDE) && (
        <VATFields
          vatRate={vatRate}
          onVatRateChange={setVatRate}
          vatMode={vatMode}
          onVatModeChange={setVatMode}
          customerVatId={customerVatId}
          onCustomerVatIdChange={setCustomerVatId}
          showVATBreakdown={false}
        />
      )}

      {/* Items section - common for all countries */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {t('invoices.items')}
        </h3>
        {/* Items list/management UI here */}
        <div className="text-sm text-gray-500">
          {t('invoices.items')} {t('common.loading')}...
        </div>
      </div>

      {/* Submit button */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          {t('invoices.createInvoice')}
        </button>
      </div>
    </form>
  );
}
