// src/api/authApi.ts
import api from "./api";

// ---------- Interfaces ----------
export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UserProfile {
  _id?: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetVerify {
  email: string;
  otp: string;
  newPassword: string;
}

// ---------- Public routes ----------
export const register = (data: RegisterData) => api.post("/auth/register", data);

export const login = (data: LoginData) => api.post("/auth/login", data);

export const logout = () => api.post("/auth/logout");

export const refreshToken = () => api.post("/auth/refresh");

// ---------- Password reset ----------
export const requestPasswordReset = (email: string) =>
  api.post("/auth/password-reset/request", { email });

export const verifyOtp = (email: string, otp: string, newPassword: string) =>
  api.post("/auth/password-reset/verify", { email, otp, newPassword });

// ---------- Protected routes ----------
export const getProfile = () => api.get<UserProfile>("/auth/me");

export const updateProfile = (data: Partial<UserProfile>) =>
  api.put<UserProfile>("/auth/me", data);

export const getAdminData = () => api.get("/auth/admin");

export default {
  register,
  login,
  logout,
  refreshToken,
  requestPasswordReset,
  verifyOtp,
  getProfile,
  updateProfile,
  getAdminData,
};
