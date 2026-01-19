"use client";

import { useState, useEffect } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { tenantUsersService } from "@/services/tenantUsers.service";
import type { TenantUser } from "@/services/tenantUsers.service";

export default function TenantUsersPage() {
  const { trackButton } = useAnalytics("Tenant Users Page", false);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [userToUpdate, setUserToUpdate] = useState<TenantUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<"OWNER" | "MANAGER" | "STAFF">("STAFF");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState<"MANAGER" | "STAFF">("STAFF");
  const [isInviting, setIsInviting] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [userToRemove, setUserToRemove] = useState<TenantUser | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await tenantUsersService.getTenantUsers();
      setUsers(response.users || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load tenant users"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    const email = inviteEmail.trim();
    const phone = invitePhone.trim();
    if (!email && !phone) {
      setError("Email or phone is required");
      return;
    }

    setIsInviting(true);
    try {
      setError("");
      trackButton("Invite User", { location: "tenant_users_page" });
      await tenantUsersService.inviteUser({
        email: email || undefined,
        phone: phone || undefined,
        role: inviteRole,
      });
      setShowInviteModal(false);
      setInviteEmail("");
      setInvitePhone("");
      setInviteRole("STAFF");
      await fetchUsers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to invite user"
      );
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!userToUpdate) return;

    setIsUpdatingRole(true);
    try {
      setError("");
      trackButton("Update User Role", {
        location: "tenant_users_page",
        userId: userToUpdate.userId,
      });
      await tenantUsersService.updateUserRole(
        userToUpdate.userId,
        selectedRole
      );
      setShowRoleModal(false);
      setUserToUpdate(null);
      await fetchUsers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update user role"
      );
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleRemoveClick = (user: TenantUser) => {
    setUserToRemove(user);
    setShowRemoveModal(true);
  };

  const handleRemoveConfirm = async () => {
    if (!userToRemove) return;

    setIsRemoving(true);
    try {
      setError("");
      trackButton("Remove User", {
        location: "tenant_users_page",
        userId: userToRemove.userId,
      });
      await tenantUsersService.removeUser(userToRemove.userId);
      setShowRemoveModal(false);
      setUserToRemove(null);
      await fetchUsers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove user"
      );
    } finally {
      setIsRemoving(false);
    }
  };

  const handleRoleClick = (user: TenantUser) => {
    // OWNER role cannot be changed
    if (user.role === "OWNER") {
      setError("Owner role cannot be changed");
      return;
    }
    setUserToUpdate(user);
    setSelectedRole(user.role);
    setShowRoleModal(true);
    setError("");
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-purple-100 text-purple-800";
      case "MANAGER":
        return "bg-blue-100 text-blue-800";
      case "STAFF":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Team Members
          </h1>
          <p className="text-gray-600 mt-1">
            Manage users and their roles in your tenant
          </p>
        </div>
        <button
          onClick={() => {
            trackButton("Invite User", { location: "tenant_users_page" });
            setShowInviteModal(true);
            setError("");
          }}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
        >
          Invite User
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading team members...</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {users.map((user) => (
              <div
                key={user.userId}
                className="bg-white rounded-lg shadow-lg border border-gray-100 p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {user.user?.name || "Unknown User"}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {user.user?.email || "No email"}
                    </p>
                    {user.user?.phone && (
                      <p className="text-xs text-gray-400 mt-1">
                        {user.user.phone}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getRoleColor(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="mb-3">
                    <span className="text-sm text-gray-500">Joined:</span>
                    <p className="text-sm text-gray-900 font-medium">
                      {new Date(user.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {user.role !== "OWNER" && (
                      <>
                        <button
                          onClick={() => handleRoleClick(user)}
                          className="flex-1 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium border border-indigo-200"
                        >
                          Change Role
                        </button>
                        <button
                          onClick={() => handleRemoveClick(user)}
                          className="flex-1 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium border border-red-200"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <p className="text-gray-600">No users found. Invite users to get started.</p>
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined At
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.userId}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.user?.name || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {user.user?.email || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {user.user?.phone || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.joinedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex gap-2">
                          {user.role !== "OWNER" && (
                            <>
                              <button
                                onClick={() => handleRoleClick(user)}
                                className="px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
                              >
                                Change Role
                              </button>
                              <button
                                onClick={() => handleRemoveClick(user)}
                                className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                              >
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No users found. Invite users to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Invite User
            </h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-800 text-sm">
                {error}
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (optional)
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="user@example.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                If provided, an invitation email will be sent with a registration link.
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone (optional)
              </label>
              <input
                type="tel"
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="+91 9876543210"
              />
              <p className="mt-1 text-xs text-gray-500">
                If provided, an invitation WhatsApp message will be sent.
                Enter email or phone (at least one).
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as "MANAGER" | "STAFF")
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="STAFF">Staff</option>
                <option value="MANAGER">Manager</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Owner role can only be assigned during tenant creation.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail("");
                  setInvitePhone("");
                  setError("");
                }}
                disabled={isInviting}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInvite}
                disabled={isInviting || (!inviteEmail.trim() && !invitePhone.trim())}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInviting ? "Inviting..." : "Invite"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Role Modal */}
      {showRoleModal && userToUpdate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Update Role
            </h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-800 text-sm">
                {error}
              </div>
            )}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">
                  {userToUpdate.user?.name || userToUpdate.user?.email || "Unknown User"}
                </span>
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Current role: {userToUpdate.role}
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select New Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) =>
                  setSelectedRole(e.target.value as "OWNER" | "MANAGER" | "STAFF")
                }
                disabled={isUpdatingRole}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="STAFF">Staff</option>
                <option value="MANAGER">Manager</option>
                <option value="OWNER">Owner</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Owner has full access, Manager has limited permissions, Staff has basic access.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowRoleModal(false);
                  setUserToUpdate(null);
                  setError("");
                }}
                disabled={isUpdatingRole}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateRole}
                disabled={isUpdatingRole || selectedRole === userToUpdate.role}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingRole ? "Updating..." : "Update Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove User Modal */}
      {showRemoveModal && userToRemove && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Remove User
            </h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-800 text-sm">
                {error}
              </div>
            )}
            <p className="mb-4 text-gray-700">
              Are you sure you want to remove{" "}
              <span className="font-medium">
                {userToRemove.user?.name || userToRemove.user?.email || "this user"}
              </span>{" "}
              from the tenant? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowRemoveModal(false);
                  setUserToRemove(null);
                  setError("");
                }}
                disabled={isRemoving}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveConfirm}
                disabled={isRemoving}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRemoving ? "Removing..." : "Remove User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
