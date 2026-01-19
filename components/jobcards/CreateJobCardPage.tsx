"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import {
  jobCardsService,
  CreateJobCardInput,
  JobCardPriority,
  VehicleInfo,
} from "@/services/jobCards.service";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useStore } from "@/contexts/StoreContext";
import CustomerSearchDropdown from "./CustomerSearchDropdown";
import AddressLookupInput from "./AddressLookupInput";
import VehicleRegistrationInput from "./VehicleRegistrationInput";
import CustomerHistoryWidget from "./CustomerHistoryWidget";

// Service types for service centers (generic names but car service center focused)
const SERVICE_TYPES = [
  "Regular Service",
  "Oil Change",
  "Engine Repair",
  "Transmission Service",
  "Brake Service",
  "AC Service",
  "Electrical Repair",
  "Tire Service",
  "Battery Replacement",
  "Diagnostic Check",
  "Body Repair",
  "Paint Job",
  "Wheel Alignment",
  "Exhaust Repair",
  "Suspension Service",
  "Other",
];

const FUEL_LEVELS = ["Full", "3/4", "1/2", "1/4", "Empty", "Not Applicable"];

export default function CreateJobCardPage() {
  const router = useRouter();
  const { trackButton } = useAnalytics("Create Job Card Page", false);
  const { selectedStore } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<CreateJobCardInput & {
    vehicle?: VehicleInfo;
    complaints?: string;
  }>({
    title: "",
    customer: {
      name: "",
      phone: "",
      email: "",
      address: {
        country: "IN",
      },
    },
    vehicle: {
      regNo: "",
      make: "",
      model: "",
      year: undefined,
      odometer: undefined,
      fuelLevel: "",
    },
    serviceType: "",
    serviceDescription: "",
    complaints: "",
    priority: "MEDIUM",
    location: "",
    notes: "",
    scheduledDate: "",
    scheduledTime: "",
    estimatedDuration: undefined,
    estimatedCost: undefined,
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("customer.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        customer: {
          ...prev.customer,
          [field]: value,
        },
      }));
    } else if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        customer: {
          ...prev.customer,
          address: {
            ...prev.customer.address || { country: "IN" },
            [field]: value,
          },
        },
      }));
    } else if (name.startsWith("vehicle.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        vehicle: {
          ...prev.vehicle || {},
          [field]: field === "year" || field === "odometer" 
            ? (value === "" ? undefined : Number(value))
            : value === "" ? undefined : value,
        },
      }));
      
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? undefined : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!formData.customer.name || !formData.customer.name.trim()) {
      setError("Customer name is required");
      return;
    }
    if (!formData.customer.phone || !formData.customer.phone.trim()) {
      setError("Customer phone is required");
      return;
    }

    try {
      setLoading(true);
      trackButton("Create Job Card", { location: "create_job_card_page" });
      
      // Combine complaints with serviceDescription if both exist
      const serviceDescription = formData.complaints
        ? `${formData.complaints}${formData.serviceDescription ? `\n\n${formData.serviceDescription}` : ""}`
        : formData.serviceDescription;
      
      const submitData: CreateJobCardInput = {
        ...formData,
        serviceDescription,
        // Include vehicle info (backend will extract supported fields)
        vehicle: formData.vehicle,
      };
      
      const jobCard = await jobCardsService.createJobCard(submitData);
      
      // Vehicle history is automatically stored in job cards (backend storage)
      // No need to save separately - it will be available when querying job cards
      
      router.push(`/jobcards/${jobCard.jobCardId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job card");
    } finally {
      setLoading(false);
    }
  };

  const priorityOptions: JobCardPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

  return (
    <div className="p-6">
      <button
        onClick={() => router.push("/jobcards")}
        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Job Cards
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Job Card</h1>
        <p className="text-gray-600 mt-1">
          Create a new service job card with customer and service details
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Customer Information
          </h2>
          <div className="space-y-4">
            {/* Name and Phone Fields with Search */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                {selectedStore ? (
                  <CustomerSearchDropdown
                    storeId={selectedStore.id}
                    value={formData.customer}
                    onChange={(customer) =>
                      setFormData((prev) => ({
                        ...prev,
                        customer,
                      }))
                    }
                    onVehicleLoad={(vehicle) => {
                      // Populate vehicle info from previous job cards
                      if (vehicle) {
                        setFormData((prev) => ({
                          ...prev,
                          vehicle: {
                            ...prev.vehicle,
                            ...vehicle,
                          },
                        }));
                      }
                    }}
                    searchBy="name"
                    required
                    disabled={loading}
                  />
                ) : (
                  <input
                    type="text"
                    name="customer.name"
                    value={formData.customer.name}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    autoComplete="off"
                    placeholder="Enter customer name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Start typing to search existing customers
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                {selectedStore ? (
                  <CustomerSearchDropdown
                    storeId={selectedStore.id}
                    value={formData.customer}
                    onChange={(customer) =>
                      setFormData((prev) => ({
                        ...prev,
                        customer: {
                          ...prev.customer,
                          ...customer,
                          name: customer.name || prev.customer.name, // Preserve name if phone search doesn't populate it
                        },
                      }))
                    }
                    onVehicleLoad={(vehicle) => {
                      // Populate vehicle info from previous job cards
                      if (vehicle) {
                        setFormData((prev) => ({
                          ...prev,
                          vehicle: {
                            ...prev.vehicle,
                            ...vehicle,
                          },
                        }));
                      }
                    }}
                    searchBy="phone"
                    required
                    disabled={loading}
                  />
                ) : (
                  <input
                    type="tel"
                    name="customer.phone"
                    value={formData.customer.phone || ""}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    autoComplete="off"
                    placeholder="Enter phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Start typing to search existing customers
                </p>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="customer.email"
                value={formData.customer.email || ""}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="customer@example.com"
              />
            </div>

            {/* Address Lookup */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <AddressLookupInput
                value={formData.customer.address || { country: "IN" }}
                onChange={(address) =>
                  setFormData((prev) => ({
                    ...prev,
                    customer: {
                      ...prev.customer,
                      address: {
                        ...prev.customer.address,
                        ...address,
                      },
                    },
                  }))
                }
                disabled={loading}
              />
            </div>

            {/* Customer History Intelligence Widget */}
            {formData.customer.customerId && selectedStore && (
              <div className="mt-4">
                <CustomerHistoryWidget
                  customerId={formData.customer.customerId}
                  storeId={selectedStore.id}
                  onJobCardSelect={(jobCardId) => {
                    // Navigate to job card detail (optional)
                    // router.push(`/jobcards/${jobCardId}`);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Vehicle Information
          </h2>
          <VehicleRegistrationInput
            value={formData.vehicle || {}}
            onChange={(vehicle) =>
              setFormData((prev) => ({
                ...prev,
                vehicle,
              }))
            }
            disabled={loading}
            showSuggestions={true}
          />
        </div>

        {/* Service Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Service Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Type
              </label>
              <select
                name="serviceType"
                value={formData.serviceType || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select service type</option>
                {SERVICE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Complaints / Requested Work
              </label>
              <textarea
                name="complaints"
                value={formData.complaints || ""}
                onChange={handleInputChange}
                rows={3}
                placeholder="Describe the customer's complaints or requested work..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Description / Additional Details
              </label>
              <textarea
                name="serviceDescription"
                value={formData.serviceDescription || ""}
                onChange={handleInputChange}
                rows={3}
                placeholder="Additional service details, diagnosis notes, etc..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {priorityOptions.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location || ""}
                  onChange={handleInputChange}
                  placeholder="Service location"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Scheduling */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Scheduling
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled Date
              </label>
              <input
                type="date"
                name="scheduledDate"
                value={formData.scheduledDate || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled Time
              </label>
              <input
                type="time"
                name="scheduledTime"
                value={formData.scheduledTime || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Estimates */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Estimates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Duration (minutes)
              </label>
              <input
                type="number"
                name="estimatedDuration"
                value={formData.estimatedDuration || ""}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Cost (₹)
              </label>
              <input
                type="number"
                name="estimatedCost"
                value={formData.estimatedCost || ""}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes || ""}
              onChange={handleInputChange}
              rows={4}
              placeholder="Any additional information about this job..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/jobcards")}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? "Creating..." : "Create Job Card"}
          </button>
        </div>
      </form>
    </div>
  );
}

