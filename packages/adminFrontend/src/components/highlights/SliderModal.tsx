import React from "react";
import Modal from "../../components/Modal";
import { SliderForm, Branch } from "./types";
import { ImageUpload } from "./ImageUpload";
import { BranchSelector } from "./BranchSelector";

type SliderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  sliderForm: SliderForm;
  setSliderForm: React.Dispatch<React.SetStateAction<SliderForm>>;
  branches: Branch[];
  toggleBranch: (branchId: string) => void;
  onSave: () => void;
  isEditing: boolean;
  saving: boolean;
};

export const SliderModal = ({
  isOpen,
  onClose,
  sliderForm,
  setSliderForm,
  branches,
  toggleBranch,
  onSave,
  isEditing,
  saving,
}: SliderModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="text-lg font-semibold mb-3">
        {isEditing ? "Edit Slider" : "Add Slider"}
      </h3>

      {/* Title */}
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          className="w-full border p-2 rounded"
          placeholder="Enter title"
          value={sliderForm.title}
          onChange={(e) =>
            setSliderForm({ ...sliderForm, title: e.target.value })
          }
        />
      </div>

      {/* Image Upload */}
      <ImageUpload
        label="Slider Image"
        preview={sliderForm.preview}
        onChange={(file, preview) =>
          setSliderForm({ ...sliderForm, imageUrl: file, preview })
        }
      />

      {/* External URL */}
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">External URL</label>
        <input
          className="w-full border p-2 rounded"
          placeholder="Enter external link"
          value={sliderForm.externalUrl}
          onChange={(e) =>
            setSliderForm({ ...sliderForm, externalUrl: e.target.value })
          }
        />
      </div>

      {/* Branch Selector */}
      <div className="mb-2">
        <BranchSelector
          branches={branches}
          selectedBranchIds={sliderForm.branchIds}
          onToggle={toggleBranch}
        />
      </div>

      {/* Order & Status */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="block text-sm font-medium mb-1">Order</label>
          <input
            type="number"
            className="border p-2 w-full rounded"
            placeholder="Order"
            value={sliderForm.order}
            onChange={(e) =>
              setSliderForm({ ...sliderForm, order: Number(e.target.value) })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            className="border p-2 w-full rounded"
            value={sliderForm.status}
            onChange={(e) =>
              setSliderForm({ ...sliderForm, status: e.target.value })
            }
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-1 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Slider"}
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
};
