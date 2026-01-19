/**
 * BusinessInformationSection component for managing store business information.
 * Handles display and editing of store details like name, address, contact info, etc.
 */
"use client";

import { useState, useEffect } from "react";
import { Building2, Save } from "lucide-react";
import { SectionWrapper } from "./SectionWrapper";
import { useAnalytics } from "@/hooks/useAnalytics";
import { storeService } from "@/services/store.service";
import { useStore } from "@/contexts/StoreContext";

export function BusinessInformationSection() {
  const { selectedStore, refreshStores } = useStore();
  const { trackButton, track, events } = useAnalytics(
    "Business Information Section",
    false
  );
  const [savingBusinessInfo, setSavingBusinessInfo] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [storeData, setStoreData] = useState<
    Partial<{
      name: string;
      address: string;
      phone: string;
      email: string;
      gstin: string;
      upiId: string;
    }>
  >({
    name: "",
    address: "",
    phone: "",
    email: "",
    gstin: "",
    upiId: "",
  });

  // Sync storeData when selectedStore changes
  useEffect(() => {
    if (selectedStore) {
      setStoreData({
        name: selectedStore.name || "",
        address: selectedStore.address || "",
        phone: selectedStore.phone || "",
        email: selectedStore.email || "",
        gstin: selectedStore.gstin || "",
        upiId: selectedStore.upiId || "",
      });
    }
  }, [selectedStore]);

  const handleStoreInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStoreData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveBusinessInfo = async () => {
    if (!selectedStore) return;

    setSavingBusinessInfo(true);
    setError("");
    setSuccess("");

    try {
      const updateData: Partial<typeof storeData> = {};

      if (storeData.name !== undefined && storeData.name.trim() !== "") {
        updateData.name = storeData.name.trim();
      }
      if (storeData.address !== undefined && storeData.address.trim() !== "") {
        updateData.address = storeData.address.trim();
      }
      if (storeData.phone !== undefined && storeData.phone.trim() !== "") {
        updateData.phone = storeData.phone.trim();
      }
      if (storeData.email !== undefined && storeData.email.trim() !== "") {
        updateData.email = storeData.email.trim();
      }
      if (storeData.gstin !== undefined && storeData.gstin.trim() !== "") {
        updateData.gstin = storeData.gstin.trim();
      }
      if (storeData.upiId !== undefined && storeData.upiId.trim() !== "") {
        updateData.upiId = storeData.upiId.trim();
      }

      if (Object.keys(updateData).length > 0) {
        trackButton("Save Business Information", {
          location: "business_information_section",
        });
        track(events.STORE_UPDATED, {
          fields_updated: Object.keys(updateData).join(","),
          fields_count: Object.keys(updateData).length,
        });
        await storeService.updateStore(selectedStore.id, updateData);
        await refreshStores();
        setSuccess("Business information saved successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Please fill in at least one field");
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      console.error("Failed to save business information:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save business information"
      );
      setTimeout(() => setError(""), 3000);
    } finally {
      setSavingBusinessInfo(false);
    }
  };

  if (!selectedStore) return null;

  return (
    <SectionWrapper
      title="Business Information"
      description={`Store: ${selectedStore.name}`}
      icon={Building2}
      gradientFrom="#46499e"
      gradientTo="#46499e"
      iconColor="#46499e"
    >
      {(error || success) && (
        <div className="mb-4">
          {error && (
            <div className="p-3 bg-[#ed4734]/10 border-l-4 border-[#ed4734] rounded text-sm text-[#ed4734]">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-[#46499e]/10 border-l-4 border-[#46499e] rounded text-sm text-[#46499e]">
              {success}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-semibold text-gray-900 mb-1"
          >
            Business Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={storeData.name || ""}
            onChange={handleStoreInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46499e] focus:border-[#46499e] text-sm"
            placeholder="Enter business name"
          />
        </div>
        <div>
          <label
            htmlFor="address"
            className="block text-sm font-semibold text-gray-900 mb-1"
          >
            Business Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={storeData.address || ""}
            onChange={handleStoreInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46499e] focus:border-[#46499e] text-sm"
            placeholder="Enter business address"
          />
        </div>
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-semibold text-gray-900 mb-1"
          >
            Phone
          </label>
          <input
            type="text"
            id="phone"
            name="phone"
            value={storeData.phone || ""}
            onChange={handleStoreInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46499e] focus:border-[#46499e] text-sm"
            placeholder="Enter phone number"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-gray-900 mb-1"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={storeData.email || ""}
            onChange={handleStoreInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46499e] focus:border-[#46499e] text-sm"
            placeholder="Enter email address"
          />
        </div>
        <div>
          <label
            htmlFor="gstin"
            className="block text-sm font-semibold text-gray-900 mb-1"
          >
            GSTIN
          </label>
          <input
            type="text"
            id="gstin"
            name="gstin"
            value={storeData.gstin || ""}
            onChange={handleStoreInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46499e] focus:border-[#46499e] text-sm"
            placeholder="Enter GSTIN"
          />
        </div>
        <div>
          <label
            htmlFor="upiId"
            className="block text-sm font-semibold text-gray-900 mb-1"
          >
            UPI ID
          </label>
          <input
            type="text"
            id="upiId"
            name="upiId"
            value={storeData.upiId || ""}
            onChange={handleStoreInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46499e] focus:border-[#46499e] text-sm"
            placeholder="Enter UPI ID"
          />
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-4">
        <button
          onClick={handleSaveBusinessInfo}
          disabled={savingBusinessInfo}
          className="px-5 py-2 bg-[#46499e] text-white rounded-lg hover:bg-[#46499e]/90 font-medium flex items-center space-x-2 disabled:opacity-50 transition-colors"
        >
          {savingBusinessInfo ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Business Information</span>
            </>
          )}
        </button>
      </div>
    </SectionWrapper>
  );
}
