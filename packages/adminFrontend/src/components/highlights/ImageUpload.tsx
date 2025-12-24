import React from "react";

type ImageUploadProps = {
  label: string;
  preview?: string;
  onChange: (file: File, preview: string) => void;
};

export const ImageUpload = ({ label, preview, onChange }: ImageUploadProps) => {
  return (
    <div className="mb-2">
      <label className="block text-sm font-medium mb-1">{label}</label>
      {preview && (
        <img
          src={preview}
          alt="Preview"
          className="w-full h-32 object-cover rounded mb-2"
        />
      )}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onChange(file, URL.createObjectURL(file));
          }
        }}
      />
    </div>
  );
};