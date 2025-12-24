// src/api/seasonalHighlightsApi.ts
import api from "./api";

export interface SeasonalHighlight {
  _id?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// GET all seasonal highlights
export const getAllSeasonalHighlights = () => api.get("/highlights");

// GET a single seasonal highlight by ID
export const getSeasonalHighlightById = (id: string) => api.get<SeasonalHighlight>(`/highlights/${id}`);

// CREATE a new seasonal highlight (admin only)
// Supports FormData (multipart)
export const createSeasonalHighlight = (data: SeasonalHighlight | FormData) => {
  const isFormData = data instanceof FormData;
  return api.post<SeasonalHighlight>("/highlights", data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
  });
};

// UPDATE a seasonal highlight by ID (admin only)
// Supports FormData (multipart)
export const updateSeasonalHighlight = (id: string, data: Partial<SeasonalHighlight> | FormData) => {
  const isFormData = data instanceof FormData;
  return api.put<SeasonalHighlight>(`/highlights/${id}`, data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
  });
};

// DELETE a seasonal highlight by ID (admin only)
export const deleteSeasonalHighlight = (id: string) => api.delete(`/highlights/${id}`);

export default {
  getAllSeasonalHighlights,
  getSeasonalHighlightById,
  createSeasonalHighlight,
  updateSeasonalHighlight,
  deleteSeasonalHighlight,
};
