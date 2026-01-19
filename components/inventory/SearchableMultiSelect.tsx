/**
 * This file contains the SearchableMultiSelect component which provides
 * a searchable dropdown with multiple selection capability for categories.
 */

"use client";

import { useState, useEffect, useRef } from "react";

interface Option {
  id: string;
  name: string;
}

interface SearchableMultiSelectProps {
  options: Option[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  placeholder?: string;
  className?: string;
  loading?: boolean;
}

/**
 * SearchableMultiSelect provides a searchable dropdown with multiple selection.
 * Users can search through options and select/deselect multiple items.
 */
export default function SearchableMultiSelect({
  options,
  selectedIds,
  onChange,
  placeholder = "Select...",
  className = "",
  loading = false,
}: SearchableMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected options for display
  const selectedOptions = options.filter((opt) => selectedIds.includes(opt.id));

  /**
   * Handles clicking outside the dropdown to close it.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Handles toggling selection of an option.
   * @param optionId - The ID of the option to toggle
   */
  const handleToggle = (optionId: string) => {
    if (selectedIds.includes(optionId)) {
      onChange(selectedIds.filter((id) => id !== optionId));
    } else {
      onChange([...selectedIds, optionId]);
    }
  };

  /**
   * Handles keyboard navigation.
   * @param e - The keyboard event
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      !isOpen &&
      (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")
    ) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }

    if (e.key === "Escape") {
      setIsOpen(false);
      setSearchTerm("");
      setHighlightedIndex(-1);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const maxIndex = filteredOptions.length - 1;
      setHighlightedIndex((prev) => (prev < maxIndex ? prev + 1 : prev));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      return;
    }

    if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      if (highlightedIndex < filteredOptions.length) {
        handleToggle(filteredOptions[highlightedIndex].id);
      }
      return;
    }
  };

  /**
   * Scrolls highlighted item into view.
   */
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  /**
   * Removes a selected option.
   * @param optionId - The ID of the option to remove
   * @param e - The mouse event
   */
  const handleRemove = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter((id) => id !== optionId));
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className="relative cursor-pointer min-h-[42px]"
        onClick={() => {
          if (!isOpen) {
            setIsOpen(true);
            setTimeout(() => {
              inputRef.current?.focus();
            }, 0);
          }
        }}
      >
        <div className="flex flex-wrap gap-1 p-2 border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 bg-white min-h-[42px]">
          {selectedOptions.length > 0 ? (
            <>
              {selectedOptions.map((option) => (
                <span
                  key={option.id}
                  className="inline-flex items-center px-2 py-1 text-sm bg-indigo-100 text-indigo-800 rounded-md"
                >
                  {option.name}
                  <button
                    type="button"
                    onClick={(e) => handleRemove(option.id, e)}
                    className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-indigo-200 focus:outline-none"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </span>
              ))}
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsOpen(true);
                  setHighlightedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  setIsOpen(true);
                }}
                placeholder={
                  selectedOptions.length > 0 ? "" : placeholder
                }
                className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
              />
            </>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
                setHighlightedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                setIsOpen(true);
              }}
              placeholder={placeholder}
              className="flex-1 outline-none bg-transparent text-sm"
            />
          )}
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isOpen ? "transform rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="px-4 py-8 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-500 text-sm">Loading...</p>
            </div>
          ) : filteredOptions.length > 0 ? (
            <ul ref={listRef} className="py-1">
              {filteredOptions.map((option, index) => {
                const isSelected = selectedIds.includes(option.id);
                return (
                  <li
                    key={option.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleToggle(option.id);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-4 py-2 cursor-pointer hover:bg-indigo-50 ${
                      highlightedIndex === index ? "bg-indigo-50" : ""
                    } ${isSelected ? "bg-indigo-100 font-medium" : ""}`}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggle(option.id)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-3"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-gray-900">{option.name}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              {searchTerm.trim() ? "No categories found" : "No categories available"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

