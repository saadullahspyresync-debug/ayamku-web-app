import React from "react";

type ImageUploadMultipleProps = {
  images: File[];
  existingImages: string[];
  onImagesChange: (images: File[]) => void;
  onExistingImagesChange: (existingImages: string[]) => void;
};

export const ImageUploadMultiple = ({
  images,
  existingImages,
  onImagesChange,
  onExistingImagesChange,
}: ImageUploadMultipleProps) => {
  return (
    <div className="mb-2">
      <label className="font-medium text-sm mb-1">Upload Images:</label>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => onImagesChange([...images, ...Array.from(e.target.files || [])])}
        className="w-full border p-2 rounded"
      />

      {existingImages.length > 0 && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {existingImages.map((img, idx) => (
            <div key={`existing-${idx}`} className="relative">
              <img
                src={img}
                alt="existing"
                className="w-20 h-20 object-cover rounded"
              />
              <button
                type="button"
                onClick={() =>
                  onExistingImagesChange(existingImages.filter((_, i) => i !== idx))
                }
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {images.map((img, idx) => (
            <div key={`new-${idx}`} className="relative">
              <img
                src={URL.createObjectURL(img)}
                alt="preview"
                className="w-20 h-20 object-cover rounded"
              />
              <button
                type="button"
                onClick={() => onImagesChange(images.filter((_, i) => i !== idx))}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};