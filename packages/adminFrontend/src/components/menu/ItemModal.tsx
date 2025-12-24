import React from "react";
import Modal from "../../components/Modal";
import { ItemForm, Category, Branch } from "./types";
import { ImageUploadMultiple } from "./ImageUploadMultiple";
import { BranchSelector } from "./BranchSelector";

type ItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  form: ItemForm;
  setForm: React.Dispatch<React.SetStateAction<ItemForm>>;
  categories: Category[];
  branches: Branch[];
  onSave: () => void;
  isEditing: boolean;
};

export const ItemModal = ({
  isOpen,
  onClose,
  form,
  setForm,
  categories,
  branches,
  onSave,
  isEditing,
}: ItemModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="text-lg font-semibold mb-4">
        {isEditing ? "Edit Item" : "Add Item"}
      </h3>

      {/* Item Name */}
      <div className="mb-3">
        <label htmlFor="itemName" className="block text-sm font-medium mb-1">
          Item Name
        </label>
        <input
          id="itemName"
          type="text"
          className="w-full border p-2 rounded"
          placeholder="Item Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>

      {/* Category */}
      <div className="mb-3">
        <label htmlFor="category" className="block text-sm font-medium mb-1">
          Category
        </label>
        <select
          id="category"
          className="w-full border p-2 rounded"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          <option value="">Select Active Category</option>
          {categories.map((c) => (
            <option key={c.categoryId} value={c.categoryId}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price */}
      <div className="mb-3">
        <label htmlFor="price" className="block text-sm font-medium mb-1">
          Price
        </label>
        <input
          id="price"
          type="number"
          className="w-full border p-2 rounded"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
      </div>

      {/* Description */}
      <div className="mb-3">
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          id="description"
          className="w-full border p-2 rounded"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
        />
      </div>

      {/* Images */}
      <div className="mb-3">
        <ImageUploadMultiple
          images={form.images}
          existingImages={form.existingImages}
          onImagesChange={(images) => setForm({ ...form, images })}
          onExistingImagesChange={(existingImages) =>
            setForm({ ...form, existingImages })
          }
        />
      </div>

      {/* Branches */}
      <div className="mb-3">
        <BranchSelector
          branches={branches}
          selectedBranchIds={form.branches}
          onToggle={(branchId) => {
            setForm((prev) => ({
              ...prev,
              branches: prev.branches.includes(branchId)
                ? prev.branches.filter((b) => b !== branchId)
                : [...prev.branches, branchId],
            }));
          }}
        />
      </div>

      {/* Stock Status & Status */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label htmlFor="stockStatus" className="block text-sm font-medium mb-1">
            Stock Status
          </label>
          <select
            id="stockStatus"
            className="w-full border p-2 rounded"
            value={form.stockStatus}
            onChange={(e) => setForm({ ...form, stockStatus: e.target.value })}
          >
            <option value="in-stock">In Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1">
            Status
          </label>
          <select
            id="status"
            className="w-full border p-2 rounded"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={onSave}
          className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded transition"
        >
          {isEditing ? "Save Changes" : "Add"}
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
