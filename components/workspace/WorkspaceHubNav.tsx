"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ShieldCheck, Store, Users } from "lucide-react";

type HubItem = {
  key: "company" | "add-store" | "team" | "roles";
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  activeWhen: (pathname: string) => boolean;
};

const HUB_ITEMS: HubItem[] = [
  {
    key: "company",
    label: "Company & Invoicing",
    href: "/add-store",
    icon: Building2,
    activeWhen: (p) =>
      p === "/add-store" ||
      p === "/business-profile" ||
      p.startsWith("/business-profile/"),
  },
  {
    key: "add-store",
    label: "Add Store",
    href: "/add-store/new",
    icon: Store,
    activeWhen: (p) => p === "/add-store/new" || p.startsWith("/add-store/new/"),
  },
  {
    key: "team",
    label: "Team Members",
    href: "/tenant-users",
    icon: Users,
    activeWhen: (p) => p === "/tenant-users" || p.startsWith("/tenant-users/"),
  },
  {
    key: "roles",
    label: "Roles & Permissions",
    href: "/tenant-roles",
    icon: ShieldCheck,
    activeWhen: (p) => p === "/tenant-roles" || p.startsWith("/tenant-roles/"),
  },
];

/**
 * Workspace hub navigation (similar UX as Invoices hub)
 * Keeps routes intact; provides a single, consistent sub-navigation.
 */
export default function WorkspaceHubNav() {
  const pathname = usePathname();

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-gray-900">Workspace</div>
            <div className="text-xs text-gray-500">
              Manage stores, team members, and roles.
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

