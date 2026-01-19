"use client";

/**
 * Header component that provides the top navigation bar with sidebar toggle and user menu.
 * Displays the application header with user information and navigation controls.
 */
import Link from "next/link";
import { useState } from "react";
import { Menu, X, LogOut, ChevronDown, Store } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { LanguageSelector } from "@/components/app/LanguageSelector";
import { useStore } from "@/contexts/StoreContext";

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

/**
 * Header component for the application layout.
 * @param sidebarOpen - Whether the sidebar is currently open
 * @param onToggleSidebar - Callback function to toggle the sidebar state
 */
export default function Header({ sidebarOpen, onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const { stores, selectedStore, selectStore } = useStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [storeMenuOpen, setStoreMenuOpen] = useState(false);
  const { trackButton, trackLink } = useAnalytics("Header", false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0 z-30">
      <div className="h-14 md:h-16 flex items-center justify-between px-4 md:px-6">
        {/* Left: Mobile menu toggle */}
        <button
          onClick={() => {
            trackButton("Sidebar Toggle", {
              is_open: !sidebarOpen,
              device: "mobile",
            });
            onToggleSidebar();
          }}
          className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 text-gray-600 lg:hidden touch-manipulation"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={() => {
            trackButton("Sidebar Toggle", {
              is_open: !sidebarOpen,
              device: "desktop",
            });
            onToggleSidebar();
          }}
          className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Right: Store selector, Language Selector & User menu */}
        <div className="flex items-center space-x-2 md:space-x-4 ml-auto">
          {/* Store Selector (only when multiple stores) */}
          {stores.length > 1 && (
            <div className="relative">
              <button
                onClick={() => {
                  trackButton("Store Menu Toggle", {
                    is_open: !storeMenuOpen,
                    store_count: stores.length,
                  });
                  setStoreMenuOpen(!storeMenuOpen);
                }}
                className="hidden md:flex items-center space-x-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
                aria-label="Store selector"
              >
                <Store className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900 max-w-40 truncate">
                  {selectedStore?.name || "Select store"}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
              </button>

              {storeMenuOpen && (
                <>
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-3 py-2 text-xs font-medium text-gray-500">
                      Stores
                    </div>
                    {stores.map((s) => {
                      const active = s.id === selectedStore?.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            trackButton("Select Store", {
                              store_id: s.id,
                              store_name: s.name,
                              previous_store_id: selectedStore?.id,
                            });
                            selectStore(s.id);
                            setStoreMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm ${
                            active
                              ? "bg-indigo-50 text-indigo-700"
                              : "text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">{s.name}</span>
                            {active && (
                              <span className="text-xs font-medium">Selected</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setStoreMenuOpen(false)}
                  />
                </>
              )}
            </div>
          )}

          {/* Language Selector */}
          <div className="hidden md:block">
            <LanguageSelector />
          </div>
          
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => {
                trackButton("User Menu Toggle", { is_open: !userMenuOpen });
                setUserMenuOpen(!userMenuOpen);
              }}
              className="flex items-center space-x-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
              aria-label="User menu"
            >
              <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-xs md:text-sm flex-shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                  {user?.name || "User"}
                </span>
                <span className="text-xs text-gray-500">Shopkeeper</span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500 hidden md:block flex-shrink-0" />
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link
                    href="/profile"
                    onClick={() => {
                      trackLink("Profile", "/profile", {
                        location: "header_menu",
                      });
                      setUserMenuOpen(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => {
                      trackLink("Settings", "/settings", {
                        location: "header_menu",
                      });
                      setUserMenuOpen(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                  >
                    Settings
                  </Link>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={() => {
                      trackButton("Logout", { location: "header_menu" });
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 active:bg-gray-100 flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setUserMenuOpen(false)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
