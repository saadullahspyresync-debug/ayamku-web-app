// src/api/itemsApi.ts
import api from "./api";

export interface Item {
  _id?: string;
  name: string;
  description?: string;
  price: string | number;
  category?: string;
  images?: string[];
  stock?: number | string;
  isCombo?: boolean;
  comboItems?: string[];
  loyaltyPoints?: number;
  createdAt?: string;
  updatedAt?: string;
}

// GET all items
export const getAllItems = () => api.get("/items");

// GET a single item by ID
export const getItemById = (id: string) => api.get<Item>(`/items/${id}`);

// CREATE a new item (admin only)
// Pass second argument as true if sending FormData
export const createItem = (data: Item | FormData, isFormData = false) =>
  api.post<Item>("/items", data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
  });

// UPDATE an item by ID (admin only)
// Pass second argument as true if sending FormData
export const updateItem = (id: string, data: Partial<Item> | FormData, isFormData = false) =>
  api.patch<Item>(`/items/${id}`, data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
  });

// DELETE an item by ID (admin only)
export const deleteItem = (id: string) => api.delete(`/items/${id}`);

export default {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
};
