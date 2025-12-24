// src/api/branch.ts
import api from "./api"; // your Axios instance

export interface Branch {
  _id?: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  createdAt?: string;
  updatedAt?: string;
}

// --- Admin Branch APIs ---

// Create a new branch (admin only)
export const createBranch = (data: Branch) => api.post("/branch", data);

// Get all branches (public)
export const getAllBranches = () => api.get("/branch");

// Get a single branch by ID (public)
export const getBranchById = (id: string) => api.get(`/branch/${id}`);

// Update a branch (admin only)
export const updateBranch = (id: string, data: Partial<Branch>) =>
  api.put<Branch>(`/branch/${id}`, data);

// Delete a branch (admin only)
export const deleteBranch = (id: string) => api.delete(`/branch/${id}`);

export default {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
};
