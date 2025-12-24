// src/api/uploadApi.ts
import api from "./api";

// Define the expected response shape from backend
export interface UploadResponse {
  files: string[]; // or `imageUrls` depending on your backend
}

/**
 * Upload multiple images to S3
 * @param files - Array of image files to upload
 * @returns Promise<string[]> - Array of uploaded image URLs
 */
export const uploadImagesToS3 = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();

  // ✅ append each file under the key 'images'
  for (const file of files) {
    formData.append("images", file);
  }

  const { data } = await api.post<UploadResponse>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data.files; // or `data.imageUrls` if your backend uses that
};

export default uploadImagesToS3;
