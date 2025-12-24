import { create } from "zustand";
import { persist } from "zustand/middleware";
// 👇 yahan import API
import { fetchBranches, Branch } from "../services/api";

interface DeliveryState {
  deliveryType: "delivery" | "online" | null;
  selectedCity: string;
  selectedBranch: string;
  isDeliveryModalOpen: boolean;
  setDeliveryType: (type: "delivery" | "online") => void;
  setSelectedCity: (city: string) => void;
  setSelectedBranch: (branch: string) => void;
  setDeliveryModalOpen: (open: boolean) => void;
  resetDeliverySelection: () => void;
  // ✅ optional: agar yahan se branches bhi fetch karna ho
  loadBranches?: () => Promise<Branch[]>; // <-- type sahi kar diya
}

export const useDeliveryStore = create<DeliveryState>()(
  persist(
    (set) => ({
      deliveryType: null,
      selectedCity: "",
      selectedBranch: "",
      isDeliveryModalOpen: true,
      setDeliveryType: (type) => set({ deliveryType: type }),
      setSelectedCity: (city) => set({ selectedCity: city }),
      setSelectedBranch: (branch) => set({ selectedBranch: branch }),
      setDeliveryModalOpen: (open) => set({ isDeliveryModalOpen: open }),
      resetDeliverySelection: () =>
        set({
          deliveryType: null,
          selectedCity: "",
          selectedBranch: "",
        }),
      // ✅ optional async action — agar store se hi API call karni hai
      loadBranches: async () => {
        try {
          const data = await fetchBranches(); // Branch[]
          // yahan tum data ko kahin save kar sakte ho agar store me branches rakhne ho
          return data;
        } catch (err) {
          console.error("Failed to fetch branches", err);
          return [];
        }
      },
    }),
    {
      name: "ayamku-delivery",
    }
  )
);
