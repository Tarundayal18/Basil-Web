import { apiClient } from "@/lib/api";

export interface UpdateProfileData {
  name?: string;
  email?: string;
  phone?: string;
}

export const profileService = {
  async updateProfile(data: UpdateProfileData): Promise<void> {
    await apiClient.put("/shopkeeper/profile", data);
  },
};

