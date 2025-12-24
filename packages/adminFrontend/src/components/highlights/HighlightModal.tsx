import React from "react";
import Modal from "../../components/Modal";
import { HighlightForm, Branch } from "./types";
import { ImageUpload } from "./ImageUpload";
import { BranchSelector } from "./BranchSelector";

type HighlightModalProps = {
  isOpen: boolean;
  onClose: () => void;
  highlightForm: HighlightForm;
  setHighlightForm: React.Dispatch<React.SetStateAction<HighlightForm>>;
  branches: Branch[];
  toggleBranch: (branchId: string) => void;
  onSave: () => void;
  isEditing: boolean;
  saving: boolean;
};

export const HighlightModal = ({
  isOpen,
  onClose,
  highlightForm,
  setHighlightForm,
  branches,
  toggleBranch,
  onSave,
  isEditing,
  saving,
}: HighlightModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="text-lg font-semibold mb-4">
        {isEditing ? "Edit Highlight" : "Add Highlight"}
      </h3>

      <div className="space-y-3">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            className="w-full border rounded-md p-2"
            placeholder="Enter title"
            value={highlightForm.title}
            onChange={(e) =>
              setHighlightForm({ ...highlightForm, title: e.target.value })
            }
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="w-full border rounded-md p-2"
            placeholder="Enter description"
            rows={3}
            value={highlightForm.description}
            onChange={(e) =>
              setHighlightForm({
                ...highlightForm,
                description: e.target.value,
              })
            }
          />
        </div>

        {/* Image Upload */}
        <div>
          <ImageUpload
            label="Highlight Image"
            preview={highlightForm.preview}
            onChange={(file, preview) =>
              setHighlightForm({ ...highlightForm, image: file, preview })
            }
          />
        </div>

        {/* Link URL */}
        <div>
          <label className="block text-sm font-medium mb-1">Link URL</label>
          <input
            className="w-full border rounded-md p-2"
            placeholder="Enter link URL"
            value={highlightForm.link}
            onChange={(e) =>
              setHighlightForm({ ...highlightForm, link: e.target.value })
            }
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Start Date
            </label>
            <input
              type="date"
              className="w-full border rounded-md p-2"
              value={highlightForm.startDate?.slice(0, 10) || ""}
              onChange={(e) =>
                setHighlightForm({
                  ...highlightForm,
                  startDate: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              className="w-full border rounded-md p-2"
              value={highlightForm.endDate?.slice(0, 10) || ""}
              onChange={(e) =>
                setHighlightForm({
                  ...highlightForm,
                  endDate: e.target.value,
                })
              }
            />
          </div>
        </div>

        {/* Branch Selector */}
        <div>
          <BranchSelector
            branches={branches}
            selectedBranchIds={highlightForm.branchIds}
            onToggle={toggleBranch}
          />
        </div>

        {/* Priority & Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <input
              type="number"
              className="w-full border rounded-md p-2"
              placeholder="Enter priority"
              value={highlightForm.priority}
              onChange={(e) =>
                setHighlightForm({
                  ...highlightForm,
                  priority: Number(e.target.value),
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              className="w-full border rounded-md p-2"
              value={highlightForm.status}
              onChange={(e) =>
                setHighlightForm({ ...highlightForm, status: e.target.value })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-5">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md disabled:opacity-50 transition"
        >
          {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Highlight"}
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
};
