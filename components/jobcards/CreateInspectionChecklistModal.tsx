/**
 * Create Inspection Checklist Modal
 * Allows creating a new inspection checklist for a job card
 */

"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { jobCardsService } from "@/services/jobCards.service";

interface CreateInspectionChecklistModalProps {
  jobCardId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateInspectionChecklistModal({
  jobCardId,
  isOpen,
  onClose,
  onSuccess,
}: CreateInspectionChecklistModalProps) {
  const [checklistName, setChecklistName] = useState("");
  const [checklistVersion, setChecklistVersion] = useState("");
  const [items, setItems] = useState<
    Array<{ checkpointName: string; category?: string }>
  >([
    { checkpointName: "", category: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddItem = () => {
    setItems([...items, { checkpointName: "", category: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: "checkpointName" | "category",
    value: string
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!checklistName.trim()) {
      setError("Checklist name is required");
      return;
    }

    const validItems = items.filter(
      (item) => item.checkpointName.trim().length > 0
    );

    if (validItems.length === 0) {
      setError("At least one checkpoint is required");
      return;
    }

    try {
      setLoading(true);
      await jobCardsService.createInspectionChecklist(jobCardId, {
        checklistName: checklistName.trim(),
        checklistVersion: checklistVersion.trim() || undefined,
        items: validItems.map((item) => ({
          checkpointName: item.checkpointName.trim(),
          category: item.category?.trim() || undefined,
        })),
      });

      // Reset form
      setChecklistName("");
      setChecklistVersion("");
      setItems([{ checkpointName: "", category: "" }]);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create checklist");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Create Inspection Checklist
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Checklist Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Checklist Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={checklistName}
                onChange={(e) => setChecklistName(e.target.value)}
                required
                placeholder="e.g., Standard Service Checklist"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Version */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Version (Optional)
              </label>
              <input
                type="text"
                value={checklistVersion}
                onChange={(e) => setChecklistVersion(e.target.value)}
                placeholder="e.g., v1.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Checkpoints <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center space-x-1 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Checkpoint</span>
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-2 p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={item.checkpointName}
                        onChange={(e) =>
                          handleItemChange(index, "checkpointName", e.target.value)
                        }
                        placeholder="Checkpoint name (e.g., Engine Oil Level)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        value={item.category || ""}
                        onChange={(e) =>
                          handleItemChange(index, "category", e.target.value)
                        }
                        placeholder="Category (e.g., Engine, Brakes, Suspension)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="mt-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Checklist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
