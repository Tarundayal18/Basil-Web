import { apiClient } from "@/lib/api";

export type PermissionKey =
  | "CREATE_INVOICE"
  | "VIEW_REPORTS"
  | "MANAGE_USERS"
  | "MANAGE_PRODUCTS"
  | "MANAGE_CUSTOMERS"
  | "MANAGE_SETTINGS"
  | "VIEW_DASHBOARD"
  | "EXPORT_DATA"
  | "DELETE_DATA"
  | "MANAGE_SUBSCRIPTION"
  | "MANAGE_STORES"
  | "MANAGE_JOB_CARDS"
  | "MANAGE_CRM";

export interface RolePermissions {
  role: "OWNER" | "MANAGER" | "STAFF";
  permissions: Record<PermissionKey, boolean>;
  isCustomizable: boolean; // OWNER cannot be customized
}

export interface TenantRolesResponse {
  roles: Array<{
    role: "OWNER" | "MANAGER" | "STAFF";
    permissions: Record<PermissionKey, boolean>;
  }>;
}

export interface UpdateRolePermissionsRequest {
  permissions: Record<PermissionKey, boolean>;
}

export const tenantRolesService = {
  /**
   * List all roles and their permissions
   */
  async getTenantRoles(): Promise<TenantRolesResponse> {
    const response = await apiClient.get<TenantRolesResponse>(
      "/shopkeeper/tenant/roles"
    );
    return response.data!;
  },

  /**
   * Update role permissions (Owner only, cannot update OWNER role)
   */
  async updateRolePermissions(
    role: "MANAGER" | "STAFF",
    permissions: Record<PermissionKey, boolean>
  ): Promise<void> {
    await apiClient.put(`/shopkeeper/tenant/roles/${role}/permissions`, {
      permissions,
    });
  },
};
