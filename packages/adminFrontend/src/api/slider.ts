// src/api/slidersApi.ts
import api from "./api";

export interface Slider {
  _id?: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | File | null;
  link?: string;
  createdAt?: string;
  updatedAt?: string;
}

// GET all sliders
export const getAllSliders = () => api.get("/sliders");

// GET a single slider by ID
export const getSliderById = (id: string) => api.get<Slider>(`/sliders/${id}`);

// CREATE a new slider (admin only)
// Supports FormData (multipart) when uploading images
export const createSlider = (data: Slider | FormData) => {
  const isFormData = data instanceof FormData;
  return api.post<Slider>("/sliders", data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
  });
};

// UPDATE a slider by ID (admin only)
// Supports FormData (multipart) when updating image
export const updateSlider = (id: string, data: Partial<Slider> | FormData) => {
  const isFormData = data instanceof FormData;
  return api.put<Slider>(`/sliders/${id}`, data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
  });
};

// DELETE a slider by ID (admin only)
export const deleteSlider = (id: string) => api.delete(`/sliders/${id}`);

export default {
  getAllSliders,
  getSliderById,
  createSlider,
  updateSlider,
  deleteSlider,
};
