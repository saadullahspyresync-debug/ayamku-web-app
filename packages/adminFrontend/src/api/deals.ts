// src/api/dealsApi.ts
import api from "./api";

export interface Deal {
  _id?: string;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  items?: string[]; // IDs of items included in the deal
  createdAt?: string;
  updatedAt?: string;
}

// GET all deals
export const getAllDeals = () => api.get("/deals");

// GET a single deal by ID
export const getDealById = (id: string) => api.get<Deal>(`/deals/${id}`);

// CREATE a new deal (admin only)
export const createDeal = (data: Deal | FormData) =>
  api.post<Deal>("/deals", data);

// UPDATE a deal by ID (admin only)
export const updateDeal = (id: string, data: Partial<Deal> | FormData) =>
  api.put<Deal>(`/deals/${id}`, data);

// DELETE a deal by ID (admin only)
export const deleteDeal = (id: string) => api.delete(`/deals/${id}`);

export default {
  getAllDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
};
