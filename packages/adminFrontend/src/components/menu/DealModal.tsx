import React from "react";
import Modal from "../../components/Modal";
import { DealForm, MenuItem, Category, Branch } from "./types";
import { ImageUploadMultiple } from "./ImageUploadMultiple";
import { BranchSelector } from "./BranchSelector";
import { ComboItemSelector } from "./ComboItemsSelector";

type DealModalProps = {
  isOpen: boolean;
  onClose: () => void;
  form: DealForm;
  setForm: React.Dispatch<React.SetStateAction<DealForm>>;
  menuItems: MenuItem[];
  categories: Category[];
  branches: Branch[];
  onSave: () => void;
  isEditing: boolean;
};

export const DealModal = ({
  isOpen,
  onClose,
  form,
  setForm,
  menuItems,
  categories,
  branches,
  onSave,
  isEditing,
}: DealModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="text-lg font-semibold mb-4">
        {isEditing ? "Edit Deal" : "Add Deal"}
      </h3>

      {/* Deal Name */}
      <div className="mb-3">
        <label htmlFor="dealName" className="block text-sm font-medium mb-1">
          Deal Name
        </label>
        <input
          id="dealName"
          type="text"
          className="w-full border p-2 rounded"
          placeholder="Deal Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>

      {/* Category */}
      <div className="mb-3">
        <label htmlFor="dealCategory" className="block text-sm font-medium mb-1">
          Category
        </label>
        <select
          id="dealCategory"
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
        <label htmlFor="dealPrice" className="block text-sm font-medium mb-1">
          Deal Price
        </label>
        <input
          id="dealPrice"
          type="number"
          className="w-full border p-2 rounded"
          placeholder="Deal Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
      </div>

      {/* Description */}
      <div className="mb-3">
        <label htmlFor="dealDescription" className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          id="dealDescription"
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
          existingImages={form.existingImages.map((img) =>
            typeof img === "string" ? img : img.url
          )}
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
          selectedBranchIds={form.availableBranches}
          onToggle={(branchId) => {
            setForm((prev) => ({
              ...prev,
              availableBranches: prev.availableBranches.includes(branchId)
                ? prev.availableBranches.filter((b) => b !== branchId)
                : [...prev.availableBranches, branchId],
            }));
          }}
        />
      </div>

      {/* Combo Items */}
      <div className="mb-3">
        <ComboItemSelector
          menuItems={menuItems}
          categories={categories}
          comboItems={form.comboItems}
          onComboItemsChange={(comboItems) => setForm({ ...form, comboItems })}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={onSave}
          className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded transition"
        >
          {isEditing ? "Save Changes" : "Add Deal"}
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
