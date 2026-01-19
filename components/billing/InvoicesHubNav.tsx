"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Receipt, ReceiptText, ScanLine } from "lucide-react";

type HubItem = {
  key: "invoices" | "quotes" | "credit-notes" | "scanned-bills";
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  activeWhen: (pathname: string) => boolean;
};

const HUB_ITEMS: HubItem[] = [
  {
    key: "invoices",
    label: "Invoices",
    href: "/invoices",
    icon: Receipt,
    activeWhen: (p) => p === "/invoices" || p.startsWith("/invoices/"),
  },
  {
    key: "quotes",
    label: "Quotes",
    href: "/quotes",
    icon: FileText,
    activeWhen: (p) => p === "/quotes" || p.startsWith("/quotes/"),
  },
  {
    key: "credit-notes",
    label: "Credit Notes",
    href: "/credit-notes",
    icon: ReceiptText,
    activeWhen: (p) => p === "/credit-notes" || p.startsWith("/credit-notes/"),
  },
  {
    key: "scanned-bills",
    label: "Scanned Bills",
    href: "/scanned-bills",
    icon: ScanLine,
    activeWhen: (p) => p === "/scanned-bills" || p.startsWith("/scanned-bills/"),
  },
];

/**
 * Invoices hub navigation
 * Modern segmented tabs that deep-link to existing pages (no functionality changes).
 */
export default function InvoicesHubNav() {
  const pathname = usePathname();

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-gray-900">Invoices</div>
            <div className="text-xs text-gray-500">
              Switch between invoices, quotes, credit notes, and scanned bills.
            </div>
          </div>
          <div className="inline-flex w-full sm:w-auto rounded-lg border border-gray-200 bg-gray-50 p-1 overflow-x-auto">
            {HUB_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.activeWhen(pathname);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={[
                    "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-700 hover:bg-white hover:text-gray-900",
                  ].join(" ")}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

