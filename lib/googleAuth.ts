"use client";

export interface GoogleUserInfo {
  sub: string; // Google user ID
  email: string;
  name: string;
  picture?: string;
}

export const getGoogleUserInfo = async (
  credential: string
): Promise<GoogleUserInfo> => {
  // Decode the JWT token to get user info
  // Note: In production, this should be verified on the backend
  const base64Url = credential.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(jsonPayload);
};
