// src/api/pointsApi.ts
import api from "./api";

export interface PointsConfig {
  configId: string;
  conversionRate: number;
  minRedemptionPoints: number;
  pointsExpiryDays?: number;
  enabled: boolean;
  updatedAt: number;
  updatedBy: string;
}

export interface RedeemableItem {
  redeemableId: string;
  name: string;
  description: string;
  pointsCost: number;
  images: Array<{ url: string; alt?: string }>;
  branchId: string;
  branchName?: string;
  availableQuantity?: number;
  redeemedCount: number;
  expiresAt?: number;
  createdAt: number;
  updatedAt: number;
  status: string;
}

export interface RedemptionStats {
  totalRedemptions: number;
  totalPointsRedeemed: number;
  activeRedemptions: number;
  topRedeemableItems: Array<{
    redeemableId: string;
    name: string;
    redemptionCount: number;
    totalPointsSpent: number;
  }>;
  redemptionsByStatus: {
    pending: number;
    claimed: number;
    cancelled: number;
    expired: number;
  };
}

export interface PointsTransaction {
  transactionId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  type: "earn" | "redeem" | "expire" | "admin_adjust";
  points: number;
  balanceAfter: number;
  description: string;
  createdAt: number;
}

// ============ Points Config ============
export const getPointsConfig = () => 
  api.get("/admin/points/config");

export const updatePointsConfig = (data: Partial<PointsConfig>) =>
  api.put<PointsConfig>("/admin/points/config", data);

// ============ Redeemable Items ============
export const getAllRedeemables = (params?: { status?: string; branchId?: string }) =>
  api.get("/admin/redeemables", { params });

export const getRedeemableById = (id: string) =>
  api.get<RedeemableItem>(`/admin/redeemables/${id}`);

export const createRedeemable = (data: Partial<RedeemableItem>) =>
  api.post<RedeemableItem>("/admin/redeemables", data);

export const updateRedeemable = (id: string, data: Partial<RedeemableItem>) =>
  api.put<RedeemableItem>(`/admin/redeemables/${id}`, data);

export const deleteRedeemable = (id: string) =>
  api.delete(`/admin/redeemables/${id}`);

// ============ Redemption Stats & History ============
export const getRedemptionStats = () =>
  api.get("/admin/redemptions/stats");

export const getAllRedemptions = (params?: { 
  status?: string; 
  redeemableId?: string;
  startDate?: string;
  endDate?: string;
}) =>
  api.get("/admin/redemptions", { params });

export const getRedemptionsByItem = (redeemableId: string) =>
  api.get(`/admin/redemptions/item/${redeemableId}`);

// ============ Points Transactions ============
export const getPointsTransactions = (params?: {
  userId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}) =>
  api.get("/admin/points/transactions", { params });

export const adjustUserPoints = (data: {
  userId: string;
  points: number;
  reason: string;
}) =>
  api.post("/admin/points/adjust", data);

export default {
  getPointsConfig,
  updatePointsConfig,
  getAllRedeemables,
  getRedeemableById,
  createRedeemable,
  updateRedeemable,
  deleteRedeemable,
  getRedemptionStats,
  getAllRedemptions,
  getRedemptionsByItem,
  getPointsTransactions,
  adjustUserPoints,
};