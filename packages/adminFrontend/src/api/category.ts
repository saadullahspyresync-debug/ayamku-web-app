// src/api/categoriesApi.ts
import api from "./api";

export interface Category {
  _id?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// GET all categories
export const getAllCategories = () => api.get("/category");

// GET a single category by ID
export const getCategoryById = (id: string) => api.get<Category>(`/category/${id}`);

// CREATE a new category (admin only)
export const createCategory = (data: Category | FormData) =>
  api.post<Category>("/category", data);

// UPDATE a category by ID (admin only)
export const updateCategory = (id: string, data: Partial<Category> | FormData) =>
  api.put<Category>(`/category/${id}`, data);

// DELETE a category by ID (admin only)
export const deleteCategory = (id: string) => api.delete(`/category/${id}`);

export default {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
