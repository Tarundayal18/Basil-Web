import { apiClient } from "@/lib/api";

export interface TenantUser {
  userId: string;
  role: "OWNER" | "MANAGER" | "STAFF";
  isActive: boolean;
  joinedAt: string;
  invitedBy?: string;
  user: {
    name?: string;
    email?: string;
    phone?: string;
  } | null;
}

export interface TenantUsersResponse {
  users: TenantUser[];
}

export interface InviteUserRequest {
  email?: string;
  phone?: string;
  role: "MANAGER" | "STAFF";
}

export interface UpdateUserRoleRequest {
  role: "OWNER" | "MANAGER" | "STAFF";
}

export const tenantUsersService = {
  /**
   * List all users in tenant
   */
  async getTenantUsers(): Promise<TenantUsersResponse> {
    const response = await apiClient.get<TenantUsersResponse>(
      "/shopkeeper/tenant/users"
    );
    return response.data!;
  },

  /**
   * Invite user to tenant by email or phone
   */
  async inviteUser(data: InviteUserRequest): Promise<void> {
    await apiClient.post("/shopkeeper/tenant/users/invite", data);
  },

  /**
   * Update user role in tenant
   */
  async updateUserRole(
    userId: string,
    role: "OWNER" | "MANAGER" | "STAFF"
  ): Promise<void> {
    await apiClient.put(`/shopkeeper/tenant/users/${userId}/role`, { role });
  },

  /**
   * Remove user from tenant
   */
  async removeUser(userId: string): Promise<void> {
    await apiClient.delete(`/shopkeeper/tenant/users/${userId}`);
  },

  /**
   * Accept invitation (for logged-in users)
   */
  async acceptInvitation(data: { invitationToken: string }): Promise<void> {
    await apiClient.post("/shopkeeper/tenant/users/accept-invitation", data);
  },
};
