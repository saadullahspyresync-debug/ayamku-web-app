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
    <div className="mb-3">
      <p className="text-sm font-medium mb-1">Visible in Branches:</p>
      <div className="flex flex-wrap gap-2">
        {branches.map((b) => (
          <button
            key={b._id}
            type="button"
            onClick={() => onToggle(b.branchId)}
            className={`px-3 py-1 border rounded ${
              selectedBranchIds.includes(b.branchId)
                ? "bg-yellow-500 text-white"
                : "bg-gray-100"
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>
    </div>
  );
};