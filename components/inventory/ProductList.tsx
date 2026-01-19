"use client";

import type { Product } from "@/services/inventory.service";
import ProductListMobile from "./ProductListMobile";
import ProductListDesktop from "./ProductListDesktop";

interface ProductListProps {
  items: Product[];
  selectedItems: string[];
  editingItem: Product | null;
  openMenuId: string | null;
  menuPosition: "top" | "bottom";
  onToggleSelect: (itemId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onEdit: (item: Product) => void;
  onUpdateItem: (item: Product, updates: Partial<Product>) => void;
  onSetEditingItem: (item: Product | null) => void;
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

export default function ProductList({
  items,
  selectedItems,
  editingItem,
  openMenuId,
  menuPosition,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onEdit,
  onUpdateItem,
  onSetEditingItem,
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
}: ProductListProps) {
  return (
    <>
      <ProductListMobile
        items={items}
        selectedItems={selectedItems}
        openMenuId={openMenuId}
        menuPosition={menuPosition}
        onToggleSelect={onToggleSelect}
        onEdit={onEdit}
        onOpenMenu={onOpenMenu}
        onCloseMenu={onCloseMenu}
        onGenerateBarcode={onGenerateBarcode}
        onGenerateQRCode={onGenerateQRCode}
        onScanBarcode={onScanBarcode}
        onScanQRCode={onScanQRCode}
        onViewBarcode={onViewBarcode}
        onViewQRCode={onViewQRCode}
        onView={onView}
        onDelete={onDelete}
      />
      <ProductListDesktop
        items={items}
        selectedItems={selectedItems}
        openMenuId={openMenuId}
        menuPosition={menuPosition}
        onToggleSelect={onToggleSelect}
        onSelectAll={onSelectAll}
        onDeselectAll={onDeselectAll}
        onEdit={onEdit}
        onOpenMenu={onOpenMenu}
        onCloseMenu={onCloseMenu}
        onGenerateBarcode={onGenerateBarcode}
        onGenerateQRCode={onGenerateQRCode}
        onScanBarcode={onScanBarcode}
        onScanQRCode={onScanQRCode}
        onViewBarcode={onViewBarcode}
        onViewQRCode={onViewQRCode}
        onView={onView}
        onDelete={onDelete}
      />
    </>
  );
}
