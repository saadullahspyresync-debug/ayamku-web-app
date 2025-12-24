import { ComboItem } from "@/services/api";

export type Category = {
  categoryId: string;
  _id: string;
  name: string;
  description?: string;
};

export type Item = {
  itemId: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  isCombo: boolean;
  comboItems?: ComboItem[];
  images?: string[];
  loyaltyPoints: number;
  stockStatus: string;
  status: string;
  categoryId: Category | string;
  availableBranches: {
    _id: string;
    name: string;
    address?: string;
    status?: string;
  }[];
};