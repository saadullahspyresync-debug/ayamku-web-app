// src/api/promotionsApi.ts
import api from "./api";

export interface Promotion {
  _id?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  discount?: number;
  branchIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// GET all promotions
export const getAllPromotions = () => api.get("/promotions");

// GET a single promotion by ID
export const getPromotionById = (id: string) => api.get<Promotion>(`/promotions/${id}`);

// CREATE a new promotion (admin only)
export const createPromotion = (data: Promotion | FormData) =>
  api.post<Promotion>("/promotions", data);

// UPDATE a promotion by ID (admin only)
export const updatePromotion = (id: string, data: Partial<Promotion> | FormData) =>
  api.put<Promotion>(`/promotions/${id}`, data);

// DELETE a promotion by ID (admin only)
export const deletePromotion = (id: string) => api.delete(`/promotions/${id}`);

export default {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
};
