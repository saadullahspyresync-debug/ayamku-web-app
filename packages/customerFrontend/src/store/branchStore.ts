import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Branch {
  branchId: string;
  name: string;
  timing: string;
  isActive: boolean;
  address?: string;
  businessHours: {
    open: string;
    close: string;
    friday: {
      open: string;
      close: string;
      isClosed: boolean;
    };
  };
}

interface BranchState {
  selectedBranch: Branch | null;
  branches: Branch[];
  isBranchModalOpen: boolean;
  setBranches: (branches: Branch[]) => void;
  setSelectedBranch: (branch: Branch) => void;
  setBranchModalOpen: (open: boolean) => void;
  clearSelectedBranch: () => void;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      selectedBranch: null,
      branches: [],
      isBranchModalOpen: false,
      setBranches: (branches) => set({ branches }),
      setSelectedBranch: (branch) => set({ selectedBranch: branch }),
      setBranchModalOpen: (open) => set({ isBranchModalOpen: open }),
      clearSelectedBranch: () => set({ selectedBranch: null }),
    }),
    { name: "ayamku-branch" }
  )
);