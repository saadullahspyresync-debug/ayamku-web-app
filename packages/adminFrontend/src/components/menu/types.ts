export type Category = {
  _id: string;
  categoryId: string;
  name: string;
  description: string;
  status: string;
  image?: string;
};

export type MenuItem = {
  _id: string;
  itemId: string;
  name: string;
  categoryId: string | { _id: string; name: string };
  price: number;
  description: string;
  stock: number;
  loyaltyPoints: number;
  stockStatus: string;
  status: string;
  images?: Array<{ url: string }>;
  availableBranches?: string[];
};

export type Deal = {
  _id: string;
  itemId: string;
  name: string;
  categoryId: string | { _id: string; name: string };
  price: number;
  description: string;
  images?: Array<{ url: string }>;
  comboItems?: Array<{
    itemId: string;
    name: string;
    quantity: number;
  }>;
  availableBranches?: string[];
  status: string;
  active?: boolean;
};

export type Branch = {
  _id: string;
  branchId: string;
  name: string;
};

export type ItemForm = {
  name: string;
  category: string;
  price: string | number;
  description: string;
  stock: string;
  loyaltyPoints: number;
  stockStatus: string;
  status: string;
  images: File[];
  existingImages: string[];
  branches: string[];
};

export type CategoryForm = {
  name: string;
  description: string;
  status: string;
  image?: File | null;
  existingImage?: string | null;
};

export type DealForm = {
  name: string;
  category: string;
  price: string;
  description: string;
  comboItems: Array<{
    itemId: string;
    name: string;
    quantity: number;
  }>;
  availableBranches: string[];
  active: boolean;
  images: File[];
  existingImages: Array<{ url: string } | string>;
};