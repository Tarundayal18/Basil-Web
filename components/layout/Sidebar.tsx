"use client";

import { useState, useEffect, useMemo, useRef, memo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useStore } from "@/contexts/StoreContext";
import { useCountry } from "@/contexts/CountryContext";
import { useI18n } from "@/contexts/I18nContext";
import { storeSettingsService } from "@/services/storeSettings.service";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Receipt,
  Settings,
  Crown,
  ClipboardList,
  Shield,
  Sparkles,
  Store,
  Contact2,
  FileCheck,
} from "lucide-react";

interface SidebarProps {
  sidebarOpen: boolean;
  isMobile: boolean;
  onNavigate: () => void;
}

// Define nav items structure - Reports label will be country-aware
const NAV_ITEMS_CONFIG_BASE = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, requiresJobCards: false, requiresAdmin: false, feature: null, countryAwareLabel: false },
  { href: "/jobcards", label: "Job Cards", icon: ClipboardList, requiresJobCards: true, requiresAdmin: false, feature: "JOB_CARDS", countryAwareLabel: false },
  { href: "/products", label: "Products", icon: Package, requiresJobCards: false, requiresAdmin: false, feature: "INVENTORY", countryAwareLabel: false },
  { href: "/billing", label: "Billing", icon: ShoppingCart, requiresJobCards: false, requiresAdmin: false, feature: "POS", countryAwareLabel: false },
  { href: "/invoices", label: "Invoices", icon: Receipt, requiresJobCards: false, requiresAdmin: false, feature: "POS", countryAwareLabel: false },
  { href: "/reports", label: "Reports", icon: FileText, requiresJobCards: false, requiresAdmin: false, feature: "GST_REPORTS", countryAwareLabel: false },
  { href: "/ai", label: "AI Features", icon: Sparkles, requiresJobCards: false, requiresAdmin: false, feature: null, countryAwareLabel: false },
  { href: "/crm", label: "CRM", icon: Contact2, requiresJobCards: false, requiresAdmin: false, feature: "CRM", countryAwareLabel: false },
  { href: "/add-store", label: "Workspace", icon: Store, requiresJobCards: false, requiresAdmin: false, feature: null, countryAwareLabel: false },
  { href: "/settings", label: "Settings", icon: Settings, requiresJobCards: false, requiresAdmin: false, feature: null, countryAwareLabel: false },
  { href: "/subscription", label: "Subscription", icon: Crown, requiresJobCards: false, requiresAdmin: false, feature: null, countryAwareLabel: false },
  { href: "/admin", label: "Admin Panel", icon: Shield, requiresJobCards: false, requiresAdmin: true, feature: null, countryAwareLabel: false },
] as const;

function normalizeTenantPermissions(raw: unknown): Record<string, boolean> {
  if (!raw) return {};
  if (Array.isArray(raw)) {
    return raw.reduce((acc: Record<string, boolean>, p) => {
      if (typeof p === "string" && p.trim()) acc[p.trim()] = true;
      return acc;
    }, {});
  }
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    return Object.keys(obj).reduce((acc: Record<string, boolean>, k) => {
      acc[k] = obj[k] === true;
      return acc;
    }, {});
  }
  return {};
}

function Sidebar({
  sidebarOpen,
  isMobile,
  onNavigate,
}: SidebarProps) {
  // DON'T use usePathname here - it causes re-renders on navigation
  // Pathname will be handled in NavItem component
  const { trackLink } = useAnalytics("Sidebar", false);
  const { selectedStore } = useStore();
  const { isIN, isNL, isDE } = useCountry();
  const { t } = useI18n();
  
  // Use state for visibility to ensure proper React updates
  const [itemVisibility, setItemVisibility] = useState<Record<string, boolean>>({});
  
  // Refs for storing values that don't need to trigger re-renders
  const isAdminRef = useRef(false);
  const featuresRef = useRef<Record<string, { allowed: boolean; limitValue?: number | null; currentUsage?: number }>>({});
  const enableJobCardsRef = useRef(false);
  const tenantRoleRef = useRef<"OWNER" | "MANAGER" | "STAFF" | null>(null);
  const tenantPermissionsRef = useRef<Record<string, boolean>>({});
  
  // Refs for preventing unnecessary fetches and caching
  const fetchingRef = useRef(false);
  const lastStoreIdRef = useRef<string | undefined>(undefined);
  const settingsCacheRef = useRef<Map<string, boolean>>(new Map());
  const lastFeaturesStringRef = useRef<string>("");
  const initializedRef = useRef(false);
  const visibilityUpdateTimeoutRef = useRef<number | null>(null);
  
  // Stabilize store ID
  const storeId = selectedStore?.id;

  // Calculate visibility - memoized to prevent unnecessary recalculations
  // Use useRef to store the function to avoid dependency issues
  const calculateVisibilityRef = useRef(() => {
    const visibility: Record<string, boolean> = {};
    const isAdmin = isAdminRef.current;
    const features = featuresRef.current;
    const enableJobCards = enableJobCardsRef.current;
    const tenantRole = tenantRoleRef.current;
    const tenantPermissions = tenantPermissionsRef.current;
    
    // Get country-aware feature name for reports
    const reportsFeature = isIN ? "GST_REPORTS" : (isNL || isDE) ? "VAT_REPORTS" : "GST_REPORTS";
    
    // Permission mapping: sidebar href -> permission key
    // If a route requires a permission, it will be checked against tenant role permissions
    // Routes without a permission mapping are always visible (e.g., profile, business-profile)
    const hrefToPermission: Record<string, string> = {
      "/dashboard": "VIEW_DASHBOARD",
      "/billing": "CREATE_INVOICE",
      "/invoices": "CREATE_INVOICE",
      "/products": "MANAGE_PRODUCTS",
      "/reports": "VIEW_REPORTS",
      "/crm": "MANAGE_CRM",
      // Workspace hub: visible if user can manage stores OR manage users
      "/add-store": "MANAGE_STORES",
      "/settings": "MANAGE_SETTINGS",
      "/subscription": "MANAGE_SUBSCRIPTION",
      "/jobcards": "MANAGE_JOB_CARDS",
      "/scanned-bills": "MANAGE_PRODUCTS", // Scanned bills relate to product management
    };
    
    NAV_ITEMS_CONFIG_BASE.forEach((item) => {
      // Admins see ALL sidebar items
      if (isAdmin) {
        visibility[item.href] = true;
        return;
      }
      
      // Hide admin-only items for non-admins
      if (item.requiresAdmin) {
        visibility[item.href] = false;
        return;
      }
      
      // If user has tenant role, check tenant permissions.
      // If permissions aren't loaded (empty), don't hide the entire sidebar.
      if (tenantRole && Object.keys(tenantPermissions || {}).length > 0) {
        const requiredPermission = hrefToPermission[item.href];
        if (requiredPermission) {
          // Workspace hub: allow either MANAGE_STORES or MANAGE_USERS
          const hasPermission =
            item.href === "/add-store"
              ? tenantPermissions["MANAGE_STORES"] === true ||
                tenantPermissions["MANAGE_USERS"] === true
              : tenantPermissions[requiredPermission] === true;
          if (!hasPermission) {
            visibility[item.href] = false;
            return;
          }
        }
      }
      
      // Job Cards: Show ONLY if (store settings enabled) OR (JOB_CARDS feature allowed)
      if (item.requiresJobCards) {
        visibility[item.href] = enableJobCards || features[item.feature || ""]?.allowed === true;
        return;
      }
      
      // Feature-based items: Show if feature has access (country-aware for reports)
      if (item.feature) {
        // Reports: Use country-aware feature name (GST_REPORTS for India, VAT_REPORTS for EU)
        // But allow either feature for backward compatibility
        const featureToCheck = item.href === "/reports" ? reportsFeature : item.feature;
        visibility[item.href] = features[featureToCheck]?.allowed === true || features[item.feature]?.allowed === true || features["REPORTS"]?.allowed === true; // Check both for backward compatibility
        return;
      }
      
      // Items without feature requirements are always visible
      visibility[item.href] = true;
    });
    
    // Use setTimeout instead of requestAnimationFrame for more reliable updates in production
    if (visibilityUpdateTimeoutRef.current !== null) {
      clearTimeout(visibilityUpdateTimeoutRef.current);
    }
    
    visibilityUpdateTimeoutRef.current = window.setTimeout(() => {
      setItemVisibility(prev => {
        // Only update if actually changed
        const prevStr = JSON.stringify(prev);
        const newStr = JSON.stringify(visibility);
        if (prevStr !== newStr) {
          return visibility;
        }
        return prev;
      });
      visibilityUpdateTimeoutRef.current = null;
    }, 0);
  });

  const calculateVisibility = useCallback(() => {
    calculateVisibilityRef.current();
  }, []);

  // Initialize and load admin status, features, and tenant role/permissions from localStorage ONCE on mount
  useEffect(() => {
    if (initializedRef.current) return;
    
    const adminStatus = localStorage.getItem("isAdmin") === "true";
    const featuresStr = localStorage.getItem("userFeatures") || "{}";
    const tenantRoleStr = localStorage.getItem("tenantRole");
    const tenantPermissionsStr = localStorage.getItem("tenantPermissions") || "{}";
    
    isAdminRef.current = adminStatus;
    lastFeaturesStringRef.current = featuresStr;
    
    try {
      featuresRef.current = JSON.parse(featuresStr);
    } catch (e) {
      console.error("Error parsing features:", e);
      featuresRef.current = {};
    }
    
    if (tenantRoleStr && ["OWNER", "MANAGER", "STAFF"].includes(tenantRoleStr)) {
      tenantRoleRef.current = tenantRoleStr as "OWNER" | "MANAGER" | "STAFF";
    }
    
    try {
      tenantPermissionsRef.current = normalizeTenantPermissions(JSON.parse(tenantPermissionsStr));
    } catch (e) {
      console.error("Error parsing tenant permissions:", e);
      tenantPermissionsRef.current = {};
    }
    
    // Calculate initial visibility
    calculateVisibility();
    initializedRef.current = true;
  }, [calculateVisibility]);

  // Fetch store settings for Job Cards
  useEffect(() => {
    // Skip if store hasn't changed and we already have a cached value
    if (storeId === lastStoreIdRef.current) {
      if (storeId && settingsCacheRef.current.has(storeId)) {
        const cachedValue = settingsCacheRef.current.get(storeId)!;
        // Only update if changed
        if (cachedValue !== enableJobCardsRef.current) {
          enableJobCardsRef.current = cachedValue;
          calculateVisibility();
        }
        return;
      }
      if (!fetchingRef.current) {
        return;
      }
    }
    
    // Prevent concurrent fetches
    if (fetchingRef.current) {
      return;
    }

    const fetchStoreSettings = async () => {
      if (!storeId) {
        if (enableJobCardsRef.current !== false) {
          enableJobCardsRef.current = false;
          calculateVisibility();
        }
        lastStoreIdRef.current = undefined;
        return;
      }

      lastStoreIdRef.current = storeId;
      fetchingRef.current = true;

      try {
        // Check cache first
        if (settingsCacheRef.current.has(storeId)) {
          const cached = settingsCacheRef.current.get(storeId)!;
          if (cached !== enableJobCardsRef.current) {
            enableJobCardsRef.current = cached;
            calculateVisibility();
          }
          fetchingRef.current = false;
          return;
        }

        const settings = await storeSettingsService.getStoreSettings(storeId);
        const jobCardsEnabled = settings.enableJobCards ?? false;
        
        // Only update if changed
        if (jobCardsEnabled !== enableJobCardsRef.current) {
          settingsCacheRef.current.set(storeId, jobCardsEnabled);
          enableJobCardsRef.current = jobCardsEnabled;
          calculateVisibility();
        } else {
          // Still cache it
          settingsCacheRef.current.set(storeId, jobCardsEnabled);
        }
      } catch (error) {
        console.error("Failed to fetch store settings:", error);
        const defaultValue = false;
        if (defaultValue !== enableJobCardsRef.current) {
          settingsCacheRef.current.set(storeId, defaultValue);
          enableJobCardsRef.current = defaultValue;
          calculateVisibility();
        }
      } finally {
        fetchingRef.current = false;
      }
    };

    fetchStoreSettings();
  }, [storeId, calculateVisibility]);

  // Listen to localStorage changes for features, admin status, and tenant role/permissions
  useEffect(() => {
    if (!initializedRef.current) return;
    
    const handleStorageChange = (e?: StorageEvent | CustomEvent) => {
      // Handle both native StorageEvent and custom events
      let key: string | null = null;
      if (e instanceof StorageEvent) {
        key = e.key;
        // Only react to relevant changes
        if (key !== "userFeatures" && key !== "isAdmin" && key !== "tenantRole" && key !== "tenantPermissions") {
          return;
        }
      } else if (e instanceof CustomEvent && e.detail) {
        key = e.detail.key;
        // Only react to relevant changes
        if (key !== "userFeatures" && key !== "isAdmin" && key !== "tenantRole" && key !== "tenantPermissions") {
          return;
        }
      }
      
      const adminStatus = localStorage.getItem("isAdmin") === "true";
      const featuresStr = localStorage.getItem("userFeatures") || "{}";
      const tenantRoleStr = localStorage.getItem("tenantRole");
      const tenantPermissionsStr = localStorage.getItem("tenantPermissions") || "{}";
      
      // Check what changed
      const adminChanged = adminStatus !== isAdminRef.current;
      const featuresChanged = featuresStr !== lastFeaturesStringRef.current;
      const tenantRoleChanged = tenantRoleStr !== (tenantRoleRef.current || "");
      const tenantPermissionsChanged =
        tenantPermissionsStr !== JSON.stringify(tenantPermissionsRef.current);
      
      if (adminChanged || featuresChanged || tenantRoleChanged || tenantPermissionsChanged) {
        isAdminRef.current = adminStatus;
        lastFeaturesStringRef.current = featuresStr;
        
        try {
          featuresRef.current = JSON.parse(featuresStr);
        } catch (e) {
          console.error("Error parsing features:", e);
          featuresRef.current = {};
        }
        
        if (tenantRoleStr && ["OWNER", "MANAGER", "STAFF"].includes(tenantRoleStr)) {
          tenantRoleRef.current = tenantRoleStr as "OWNER" | "MANAGER" | "STAFF";
        } else {
          tenantRoleRef.current = null;
        }
        
        try {
          tenantPermissionsRef.current = normalizeTenantPermissions(JSON.parse(tenantPermissionsStr));
        } catch (e) {
          console.error("Error parsing tenant permissions:", e);
          tenantPermissionsRef.current = {};
        }
        
        calculateVisibility();
      }
    };

    // Listen to storage events (cross-tab communication)
    window.addEventListener("storage", handleStorageChange as EventListener);
    
    // Also listen to custom events if other parts of the app update localStorage
    window.addEventListener("localStorageChange", handleStorageChange as EventListener);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange as EventListener);
      window.removeEventListener("localStorageChange", handleStorageChange as EventListener);
    };
  }, [calculateVisibility]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (visibilityUpdateTimeoutRef.current !== null) {
        clearTimeout(visibilityUpdateTimeoutRef.current);
      }
    };
  }, []);

  // Memoize nav items (stable)
  const navItems = useMemo(() => NAV_ITEMS_CONFIG_BASE, []);

  return (
    <aside
      className={`${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } ${
        sidebarOpen ? "w-64" : "w-64 lg:w-20"
      } bg-white shadow-lg transition-all duration-300 fixed left-0 top-0 h-screen z-40 border-r border-gray-200 lg:relative lg:z-auto flex-shrink-0`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200">
          <div className="flex items-center justify-center lg:justify-start w-full">
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 relative">
              <Image
                src="/logo.png"
                alt="BASIL Logo"
                width={60}
                height={60}
                className="object-contain"
                priority
              />
            </div>
            {sidebarOpen && (
              <h1 className="text-xl font-bold text-gray-900 ml-3 whitespace-nowrap">
                BASIL
              </h1>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              // Use state-based visibility (stable - only updates when needed)
              const shouldShow = itemVisibility[item.href] ?? true;
              
              // Early return if item should be hidden
              if (!shouldShow) {
                return null;
              }
              
              return (
                <NavItem
                  key={item.href}
                  item={item}
                  sidebarOpen={sidebarOpen}
                  isMobile={isMobile}
                  onNavigate={onNavigate}
                  trackLink={trackLink}
                />
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

// Separate component for nav items to prevent full sidebar re-renders
// This component handles pathname internally to isolate re-renders
// Not memoized because we want it to re-render when pathname changes (for active state)
const NavItem = ({
  item,
  sidebarOpen,
  isMobile,
  onNavigate,
  trackLink,
}: {
  item: {
    href: string;
    label: string;
    icon: React.ComponentType<any>;
    requiresJobCards: boolean;
    requiresAdmin: boolean;
    feature: string | null;
    countryAwareLabel: boolean;
    labelKey?: string;
  };
  sidebarOpen: boolean;
  isMobile: boolean;
  onNavigate: () => void;
  trackLink: (label: string, href: string, options?: any) => void;
}) => {
  const Icon = item.icon;
  const pathname = usePathname(); // Move usePathname here to isolate re-renders
  
  // Calculate active state directly with special handling for specific routes
  const active = (() => {
    if (item.href === "/dashboard") {
      return pathname === "/dashboard";
    }
    // Special handling for /jobcards to match all jobcard routes
    if (item.href === "/jobcards") {
      return pathname.startsWith("/jobcards");
    }
    // Special handling for /admin to match admin routes
    if (item.href === "/admin") {
      return pathname.startsWith("/admin");
    }
    // Exact match for CRM to avoid matching /customers
    if (item.href === "/crm") {
      return pathname === "/crm" || pathname.startsWith("/crm/");
    }
    // Exact match for AI to avoid matching other routes
    if (item.href === "/ai") {
      return pathname === "/ai" || pathname.startsWith("/ai/");
    }
    // Workspace hub (route is /add-store for backward compatibility)
    if (item.href === "/add-store") {
      return (
        pathname === "/add-store" ||
        pathname.startsWith("/add-store/") ||
        pathname === "/business-profile" ||
        pathname.startsWith("/business-profile/") ||
        pathname === "/tenant-users" ||
        pathname.startsWith("/tenant-users/") ||
        pathname === "/tenant-roles" ||
        pathname.startsWith("/tenant-roles/")
      );
    }
    // Invoices hub: highlight Invoices for related billing documents pages
    if (item.href === "/invoices") {
      return (
        pathname === "/invoices" ||
        pathname.startsWith("/invoices/") ||
        pathname === "/quotes" ||
        pathname.startsWith("/quotes/") ||
        pathname === "/credit-notes" ||
        pathname.startsWith("/credit-notes/") ||
        pathname === "/scanned-bills" ||
        pathname.startsWith("/scanned-bills/")
      );
    }
    return pathname.startsWith(item.href);
  })();
  
  return (
    <li>
      <Link
        href={item.href}
        onClick={(e) => {
          trackLink(item.label, item.href, { location: "sidebar" });
          
          // Force reload if clicking on AI Features when already on that page
          if (item.href === "/ai" && active) {
            e.preventDefault();
            window.location.href = "/ai";
            return;
          }
          
          if (isMobile) {
            onNavigate();
          }
        }}
        data-tour={
          item.href === "/dashboard"
            ? "dashboard"
            : item.href.replace("/", "")
        }
        className={`flex items-center ${
          sidebarOpen
            ? "justify-start space-x-3 px-3"
            : "justify-center px-2"
        } py-2.5 rounded-lg transition-colors ${
          active
            ? "bg-indigo-50 text-indigo-600 font-medium"
            : "text-gray-700 hover:bg-gray-50"
        }`}
        title={!sidebarOpen ? item.label : undefined}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {sidebarOpen && (
          <span className="text-sm whitespace-nowrap">
            {item.label}
          </span>
        )}
      </Link>
    </li>
  );
};

NavItem.displayName = "NavItem";

// Memoize the component with custom comparison to prevent unnecessary re-renders
export default memo(Sidebar, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.sidebarOpen === nextProps.sidebarOpen &&
    prevProps.isMobile === nextProps.isMobile
  );
});
