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

// const defaultBranches: Branch[] = [
//   {
//     branchId: "1",
//     name: "Branch no 1",
//     timing: "09:00 - 18:00",
//     isActive: true,
//     businessHours: {
//       open: "09:00",
//       close: "18:00",
//       friday: {
//         open: "14:00",
//         close: "18:00",
//         isClosed: false, // ❌ change to true to simulate closed Fridays
//       },
//     },
//   },
//   {
//     branchId: "2",
//     name: "Branch no 2",
//     timing: "10:00 - 20:00",
//     isActive: true,
//     businessHours: {
//       open: "10:00",
//       close: "20:00",
//       friday: {
//         open: "15:00",
//         close: "20:00",
//         isClosed: false,
//       },
//     },
//   },
//   {
//     branchId: "3",
//     name: "Branch no 3",
//     timing: "08:00 - 22:00",
//     isActive: true,
//     businessHours: {
//       open: "08:00",
//       close: "22:00",
//       friday: {
//         open: "13:00",
//         close: "22:00",
//         isClosed: false,
//       },
//     },
//   },
//   {
//     branchId: "4",
//     name: "Branch no 4",
//     timing: "09:00 - 17:00",
//     isActive: true,
//     businessHours: {
//       open: "09:00",
//       close: "17:00",
//       friday: {
//         open: "Closed",
//         close: "Closed",
//         isClosed: true,
//       },
//     },
//   },
//   {
//     branchId: "5",
//     name: "Branch no 5",
//     timing: "10:00 - 23:00",
//     isActive: true,
//     businessHours: {
//       open: "10:00",
//       close: "23:00",
//       friday: {
//         open: "16:00",
//         close: "23:00",
//         isClosed: false,
//       },
//     },
//   },
//   {
//     branchId: "6",
//     name: "Branch no 6",
//     timing: "11:00 - 21:00",
//     isActive: true,
//     businessHours: {
//       open: "11:00",
//       close: "21:00",
//       friday: {
//         open: "Closed",
//         close: "Closed",
//         isClosed: true,
//       },
//     },
//   },
// ];


