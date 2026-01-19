"use client";

import { useState, useEffect, useRef } from "react";
import type { Product } from "@/services/inventory.service";

interface ProductListDesktopProps {
  items: Product[];
  selectedItems: string[];
  openMenuId: string | null;
  menuPosition: "top" | "bottom";
  onToggleSelect: (itemId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onEdit: (item: Product) => void;
  onOpenMenu: (itemId: string, position: "top" | "bottom") => void;
  onCloseMenu: () => void;
  onGenerateBarcode: (itemId: string) => void;
  onGenerateQRCode: (itemId: string) => void;
  onScanBarcode: (itemId: string) => void;
  onScanQRCode: (itemId: string) => void;
  onViewBarcode: (item: Product) => void;
  onViewQRCode: (item: Product) => void;
  onView: (item: Product) => void;
  onDelete: (itemId: string) => void;
}

/**
 * MenuButton component handles the actions menu button and menu positioning.
 * Uses fixed positioning to allow the menu to overflow outside the table container.
 */
function MenuButton({
  item,
  openMenuId,
  menuPosition,
  onOpenMenu,
  onCloseMenu,
  onView,
  onEdit,
  onGenerateBarcode,
  onScanBarcode,
  onViewBarcode,
  onGenerateQRCode,
  onScanQRCode,
  onViewQRCode,
  onDelete,
}: {
  item: Product;
  openMenuId: string | null;
  menuPosition: "top" | "bottom";
  onOpenMenu: (itemId: string, position: "top" | "bottom") => void;
  onCloseMenu: () => void;
  onView: (item: Product) => void;
  onEdit: (item: Product) => void;
  onGenerateBarcode: (itemId: string) => void;
  onScanBarcode: (itemId: string) => void;
  onViewBarcode: (item: Product) => void;
  onGenerateQRCode: (itemId: string) => void;
  onScanQRCode: (itemId: string) => void;
  onViewQRCode: (item: Product) => void;
  onDelete: (itemId: string) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<{
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  }>({});

  useEffect(() => {
    if (openMenuId === item.id && buttonRef.current) {
      const updateMenuPosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          const menuWidth = 192; // w-48 = 192px
          const menuHeight = 300; // approximate menu height
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceRight = window.innerWidth - rect.right;
          const spaceLeft = rect.left;

          const style: {
            top?: number;
            bottom?: number;
            left?: number;
            right?: number;
          } = {};

          // Vertical positioning
          if (menuPosition === "top" || spaceBelow < menuHeight) {
            style.bottom = window.innerHeight - rect.top + 8;
          } else {
            style.top = rect.bottom + 8;
          }

          // Horizontal positioning - align to button's right edge, allow overflow to the right
          // Use left positioning to allow natural overflow beyond the window edge
          style.left = rect.right;

          // Only flip to left if menu would overflow by more than 100px AND there's significantly more space on the left
          if (
            rect.right + menuWidth > window.innerWidth + 100 &&
            spaceLeft > spaceRight + 50
          ) {
            // Position menu to the left of the button
            style.left = rect.left - menuWidth;
          }

          setMenuStyle(style);
        }
      };

      updateMenuPosition();
      window.addEventListener("scroll", updateMenuPosition, true);
      window.addEventListener("resize", updateMenuPosition);

      return () => {
        window.removeEventListener("scroll", updateMenuPosition, true);
        window.removeEventListener("resize", updateMenuPosition);
      };
    }
  }, [openMenuId, item.id, menuPosition]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const spaceBelow = window.innerHeight - rect.bottom;
          onOpenMenu(item.id, spaceBelow < 250 ? "top" : "bottom");
        }}
        className="p-1 rounded hover:bg-gray-100"
        title="Actions"
      >
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </button>
      {openMenuId === item.id && (
        <>
          <div
            className="fixed w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200"
            style={menuStyle}
          >
            <div className="py-1">
              <button
                onClick={() => {
                  onView(item);
                  onCloseMenu();
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                View
              </button>
              <button
                onClick={() => {
                  onEdit(item);
                  onCloseMenu();
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Edit
              </button>
              {!item.barcode && (
                <>
                  <button
                    onClick={() => {
                      onGenerateBarcode(item.id);
                      onCloseMenu();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Generate Barcode
                  </button>
                  <button
                    onClick={() => {
                      onScanBarcode(item.id);
                      onCloseMenu();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Scan Barcode
                  </button>
                </>
              )}
              {item.barcode && (
                <button
                  onClick={() => {
                    onViewBarcode(item);
                    onCloseMenu();
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  View/Print Barcode
                </button>
              )}
              {!item.qrCode && (
                <>
                  <button
                    onClick={() => {
                      onGenerateQRCode(item.id);
                      onCloseMenu();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Generate QR Code
                  </button>
                  <button
                    onClick={() => {
                      onScanQRCode(item.id);
                      onCloseMenu();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Scan QR Code
                  </button>
                </>
              )}
              {item.qrCode && (
                <button
                  onClick={() => {
                    onViewQRCode(item);
                    onCloseMenu();
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  View/Print QR Code
                </button>
              )}
              <div className="border-t border-gray-200 my-1"></div>
              <button
                onClick={() => {
                  onDelete(item.id);
                  onCloseMenu();
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
          <div className="fixed inset-0 z-40" onClick={onCloseMenu} />
        </>
      )}
    </>
  );
}

export default function ProductListDesktop({
  items,
  selectedItems,
  openMenuId,
  menuPosition,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onEdit,
  onOpenMenu,
  onCloseMenu,
  onGenerateBarcode,
  onGenerateQRCode,
  onScanBarcode,
  onScanQRCode,
  onViewBarcode,
  onViewQRCode,
  onView,
  onDelete,
}: ProductListDesktopProps) {
  return (
    <div className="hidden md:block bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      onSelectAll();
                    } else {
                      onDeselectAll();
                    }
                  }}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                MRP
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost After GST
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Selling Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Selling After GST
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Profit (inc GST)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                GST
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => {
              return (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => onToggleSelect(item.id)}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.productId || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className={`font-medium ${
                      (item.quantity || 0) === 0
                        ? "text-red-900 font-semibold"
                        : (item.lowStockAlert && (item.quantity || 0) <= item.lowStockAlert)
                        ? "text-yellow-800 font-semibold"
                        : "text-gray-900"
                    }`}>
                      {item.name}
                      {(item.quantity || 0) === 0 && (
                        <span className="ml-2 text-xs text-red-600">⚠ Out</span>
                      )}
                      {item.lowStockAlert && (item.quantity || 0) > 0 && (item.quantity || 0) <= item.lowStockAlert && (
                        <span className="ml-2 text-xs text-yellow-600">⚠ Low</span>
                      )}
                    </div>
                    {(() => {
                      const categoryText = [
                        item.brand?.name,
                        item.category?.name,
                      ]
                        .filter(Boolean)
                        .join(" / ");
                      return categoryText ? (
                        <div className="text-xs text-gray-500 mt-1">
                          {categoryText}
                        </div>
                      ) : null;
                    })()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.mrp !== undefined && item.mrp !== null
                      ? `₹${item.mrp.toFixed(2)}`
                      : "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.costPriceBase !== undefined &&
                    item.costPriceBase !== null
                      ? `₹${item.costPriceBase.toFixed(2)}`
                      : "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.costPrice !== undefined && item.costPrice !== null
                      ? `₹${item.costPrice.toFixed(2)}`
                      : "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.sellingPriceBase !== undefined &&
                    item.sellingPriceBase !== null
                      ? `₹${item.sellingPriceBase.toFixed(2)}`
                      : "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.sellingPrice !== undefined &&
                    item.sellingPrice !== null
                      ? `₹${item.sellingPrice.toFixed(2)}`
                      : "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {(() => {
                      const costPrice = item.costPrice ?? 0;
                      const sellingPrice = item.sellingPrice ?? 0;
                      const profit = sellingPrice - costPrice;
                      return profit !== 0 ? `₹${profit.toFixed(2)}` : "-";
                    })()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.taxPercentage !== undefined &&
                    item.taxPercentage !== null
                      ? `${item.taxPercentage}%`
                      : "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {(item.quantity || 0) === 0 ? (
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700 border border-red-300">
                        {item.quantity || 0}
                      </span>
                    ) : (item.lowStockAlert && (item.quantity || 0) <= item.lowStockAlert) ? (
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-300">
                        {item.quantity || 0}
                      </span>
                    ) : (
                      <span className="text-gray-700 font-medium">
                        {item.quantity || 0}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    <MenuButton
                      item={item}
                      openMenuId={openMenuId}
                      menuPosition={menuPosition}
                      onOpenMenu={onOpenMenu}
                      onCloseMenu={onCloseMenu}
                      onView={onView}
                      onEdit={onEdit}
                      onGenerateBarcode={onGenerateBarcode}
                      onScanBarcode={onScanBarcode}
                      onViewBarcode={onViewBarcode}
                      onGenerateQRCode={onGenerateQRCode}
                      onScanQRCode={onScanQRCode}
                      onViewQRCode={onViewQRCode}
                      onDelete={onDelete}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
