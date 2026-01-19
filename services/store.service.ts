import { apiClient } from "@/lib/api";

export interface Store {
  id: string;
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  upiId?: string;
  isActive: boolean;
}

export interface StoreResponse {
  id: string;
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  upiId?: string;
  isActive: boolean;
}

export const storeService = {
  async getStores(): Promise<Store[]> {
    const response = await apiClient.get<StoreResponse[]>("/shopkeeper/stores");
    return (response.data as StoreResponse[]).map((store) => ({
      id: store.id,
      name: store.name,
      logo: store.logo,
      address: store.address,
      phone: store.phone,
      email: store.email,
      gstin: store.gstin,
      upiId: store.upiId,
      isActive: store.isActive,
    }));
  },

  async updateStore(storeId: string, data: Partial<Store>): Promise<Store> {
    const response = await apiClient.put<StoreResponse>(
      `/shopkeeper/stores/${storeId}`,
      data
    );
    if (!response.data) {
      throw new Error("Failed to update store");
    }
    return {
      id: response.data.id,
      name: response.data.name,
      logo: response.data.logo,
      address: response.data.address,
      phone: response.data.phone,
      email: response.data.email,
      gstin: response.data.gstin,
      upiId: response.data.upiId,
      isActive: response.data.isActive,
    };
  },
};
