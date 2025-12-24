import React from "react";
import { Branch } from "./types";

type BranchSelectorProps = {
  branches: Branch[];
  selectedBranchIds: string[];
  onToggle: (branchId: string) => void;
};

export const BranchSelector = ({
  branches,
  selectedBranchIds,
  onToggle,
}: BranchSelectorProps) => {
  return (
    <div className="mb-2">
      <label className="font-medium text-sm">Available at Branches:</label>
      <div className="flex flex-wrap gap-2 mt-2">
        {branches.map((b) => (
          <button
            key={b.branchId || b._id}
            type="button"
            onClick={() => onToggle(b._id || b.branchId)}
            className={`px-3 py-1 border rounded ${
              selectedBranchIds.includes(b._id || b.branchId)
                ? "bg-yellow-500 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>
    </div>
  );
};