import React from "react";
import Modal from "../../components/Modal";
import { CategoryForm } from "./types";

type CategoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  form: CategoryForm;
  setForm: React.Dispatch<React.SetStateAction<CategoryForm>>;
  onSave: () => void;
  isEditing: boolean;
};

export const CategoryModal = ({
  isOpen,
  onClose,
  form,
  setForm,
  onSave,
  isEditing,
}: CategoryModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="text-lg font-semibold mb-4">
        {isEditing ? "Edit Category" : "Add Category"}
      </h3>

      {/* Name */}
      <div className="mb-3">
        <label htmlFor="categoryName" className="block text-sm font-medium mb-1">
          Category Name
        </label>
        <input
          id="categoryName"
          type="text"
          className="w-full border p-2 rounded"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>

      {/* Description */}
      <div className="mb-3">
        <label htmlFor="categoryDescription" className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          id="categoryDescription"
          className="w-full border p-2 rounded"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
        />
      </div>

      {/* Image Upload */}
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Upload Category Image</label>
        <input
          type="file"
          accept="image/*"
          className="w-full border p-2 rounded"
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              image: e.target.files?.[0] || null,
            }))
          }
        />
        <div className="mt-2 flex gap-2 flex-wrap">
          {form.image && form.image instanceof File ? (
            <img
              src={URL.createObjectURL(form.image)}
              alt="new"
              className="w-24 h-24 object-cover rounded"
            />
          ) : form.existingImage ? (
            <img
              src={form.existingImage}
              alt="existing"
              className="w-24 h-24 object-cover rounded"
            />
          ) : null}
        </div>
      </div>

      {/* Status */}
      <div className="mb-3">
        <label htmlFor="categoryStatus" className="block text-sm font-medium mb-1">
          Status
        </label>
        <select
          id="categoryStatus"
          className="w-full border p-2 rounded"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={onSave}
          className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded transition"
        >
          {isEditing ? "Save Changes" : "Add Category"}
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 rounded transition"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
};
