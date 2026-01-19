"use client";

import { useState, useEffect } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { tenantRolesService, type RolePermissions, type PermissionKey } from "@/services/tenantRoles.service";

const PERMISSION_LABELS: Record<PermissionKey, string> = {
  CREATE_INVOICE: "Create Invoices",
  VIEW_REPORTS: "View Reports",
  MANAGE_USERS: "Manage Users",
  MANAGE_PRODUCTS: "Manage Products",
  MANAGE_CUSTOMERS: "Manage Customers",
  MANAGE_SETTINGS: "Manage Settings",
  VIEW_DASHBOARD: "View Dashboard",
  EXPORT_DATA: "Export Data",
  DELETE_DATA: "Delete Data",
  MANAGE_SUBSCRIPTION: "Manage Subscription",
  MANAGE_STORES: "Manage Stores",
  MANAGE_JOB_CARDS: "Manage Job Cards",
  MANAGE_CRM: "Manage CRM",
};

export default function TenantRolesPage() {
  const { trackButton, track } = useAnalytics("Tenant Roles Page", false);
  const [roles, setRoles] = useState<RolePermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editedRole, setEditedRole] = useState<"MANAGER" | "STAFF" | null>(null);
  const [localPermissions, setLocalPermissions] = useState<Record<PermissionKey, boolean> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await tenantRolesService.getTenantRoles();
      
      // Mark OWNER as not customizable, others as customizable
      const rolesWithCustomizable: RolePermissions[] = response.roles.map((role) => ({
        role: role.role,
        permissions: role.permissions,
        isCustomizable: role.role !== "OWNER",
      }));
      
      setRoles(rolesWithCustomizable);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load roles"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (role: "MANAGER" | "STAFF") => {
    const roleData = roles.find((r) => r.role === role);
    if (roleData) {
      setEditedRole(role);
      setLocalPermissions({ ...roleData.permissions });
      setSuccess("");
      setError("");
      trackButton("Edit Role Permissions", { role, location: "tenant_roles_page" });
    }
  };

  const handleCancelEdit = () => {
    setEditedRole(null);
    setLocalPermissions(null);
    setSuccess("");
    setError("");
  };

  const handlePermissionToggle = (permission: PermissionKey) => {
    if (!localPermissions) return;
    setLocalPermissions({
      ...localPermissions,
      [permission]: !localPermissions[permission],
    });
  };

  const handleSavePermissions = async () => {
    if (!editedRole || !localPermissions) return;

    setIsSaving(true);
    try {
      setError("");
      setSuccess("");
      trackButton("Save Role Permissions", { role: editedRole, location: "tenant_roles_page" });
      
      await tenantRolesService.updateRolePermissions(editedRole, localPermissions);
      
      // Update local state
      const updatedRoles = roles.map((r) =>
        r.role === editedRole
          ? { ...r, permissions: localPermissions }
          : r
      );
      setRoles(updatedRoles);
      
      setSuccess(`Permissions for ${editedRole} role updated successfully`);
      setEditedRole(null);
      setLocalPermissions(null);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update role permissions"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "MANAGER":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "STAFF":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "OWNER":
        return "Full system access. Cannot be modified.";
      case "MANAGER":
        return "Can manage most aspects of the business. Permissions can be customized.";
      case "STAFF":
        return "Limited access for day-to-day operations. Permissions can be customized.";
      default:
        return "";
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Roles & Permissions
        </h1>
        <p className="text-gray-600 mt-1">
          Manage permissions for each role in your tenant (Owner only)
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg shadow-sm text-green-800">
          {success}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading roles...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {roles.map((roleData) => {
            const isEditing = editedRole === roleData.role;
            const permissions = isEditing && localPermissions
              ? localPermissions
              : roleData.permissions;

            return (
              <div
                key={roleData.role}
                className={`bg-white rounded-lg shadow-lg border-2 ${getRoleColor(roleData.role)}`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold mb-1">{roleData.role}</h2>
                      <p className="text-sm opacity-75">
                        {getRoleDescription(roleData.role)}
                      </p>
                    </div>
                    {roleData.isCustomizable && !isEditing && (
                      <button
                        onClick={() => handleEditRole(roleData.role as "MANAGER" | "STAFF")}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                      >
                        Edit Permissions
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(Object.keys(permissions) as PermissionKey[]).map((permission) => (
                          <label
                            key={permission}
                            className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={permissions[permission]}
                              onChange={() => handlePermissionToggle(permission)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="ml-3 text-sm font-medium text-gray-700">
                              {PERMISSION_LABELS[permission]}
                            </span>
                          </label>
                        ))}
                      </div>
                      <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all duration-200 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSavePermissions}
                          disabled={isSaving}
                          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSaving ? "Saving..." : "Save Permissions"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(Object.keys(permissions) as PermissionKey[]).map((permission) => (
                        <div
                          key={permission}
                          className={`flex items-center p-3 rounded-lg ${
                            permissions[permission]
                              ? "bg-green-50 text-green-800"
                              : "bg-red-50 text-red-800"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full mr-3 ${
                            permissions[permission] ? "bg-green-500" : "bg-red-500"
                          }`}></span>
                          <span className="text-sm font-medium">
                            {PERMISSION_LABELS[permission]}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
