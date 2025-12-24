// src/services/api.ts
import { fetchAuthSession } from "aws-amplify/auth";
import axios, { AxiosResponse } from "axios";

// ✅ Backend ka URL (Change this based on your environment)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  // "https://e4girjfm00.execute-api.us-east-1.amazonaws.com"; // development
  "https://ec661icza2.execute-api.us-east-1.amazonaws.com"; // local devs-venture-dev-machine

// ✅ Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true", // 👈 add this line
  },
});

// 🔑 Authorization token interceptor
api.interceptors.request.use(async (config) => {
  // const token = localStorage.getItem("token");
  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken?.toString();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// -------------------- AUTH --------------------
export interface User {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Login
export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const res: AxiosResponse<AuthResponse> = await api.post("/auth/login", {
    email,
    password,
  });
  return res.data;
};

// Register
export const registerUser = async (data: {
  fullName: string;
  email: string;
  password: string;
  mobileNumber: string;
}): Promise<AuthResponse> => {
  const res: AxiosResponse<AuthResponse> = await api.post(
    "/auth/register",
    data
  );
  return res.data;
};

export const syncUser = async (data): Promise<AuthResponse> => {
  const res: AxiosResponse<AuthResponse> = await api.post(
    "/auth/syncUser",
    data
  );
  return res.data;
};

// Forgot Password (request reset link)
export const forgotPassword = async (
  email: string
): Promise<{ success: boolean }> => {
  const res: AxiosResponse<{ success: boolean }> = await api.post(
    "/auth/forgot-password",
    { email }
  );
  return res.data;
};

// Reset Password
export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<{ success: boolean }> => {
  const res: AxiosResponse<{ success: boolean }> = await api.post(
    "/auth/reset-password",
    { token, password: newPassword }
  );
  return res.data;
};

// Get current user profile
export const getUserProfile = async (): Promise<User> => {
  const res: AxiosResponse<User> = await api.get("/auth/me");
  return res.data;
};

// Logout
export const logoutUser = async (): Promise<{ success: boolean }> => {
  const res: AxiosResponse<{ success: boolean }> = await api.post(
    "/auth/logout"
  );
  return res.data;
};

// -------------------- BRANCHES --------------------
// export interface Branch {
//   branchId: string;
//   name: string;
//   address: string;
//   contactNumber: string;
//   status: string;
//   businessHours: {
//     open: string;
//     close: string;
//     friday: {
//       open: string;
//       close: string;
//       isClosed: boolean;
//     };
//   };
//   services: {
//     dineIn: boolean;
//     pickup: boolean;
//   };
//   coordinates: {
//     lat: number | null;
//     lng: number | null;
//   };
//   createdAt: string;
//   updatedAt: string;
// }

export interface Branch {
  branchId: string;
  _id: string;
  name: string;
  address: string;
  contactNumber: string;
  status: string;
  businessHours: {
    open: string;
    close: string;
    friday: {
      open: string;
      close: string;
      isClosed: boolean;
    };
  };
  services: {
    dineIn: boolean;
    pickup: boolean;
  };
  coordinates: {
    lat: number | null;
    lng: number | null;
  };
  createdAt: string;
  updatedAt: string;
}

// Response type from backend
interface BranchResponse {
  success: boolean;
  code: string;
  message: string;
  data: Branch[];
  meta: unknown;
}

// Get all branches
// src/services/api.ts

// export const fetchBranches = async (): Promise<Branch[]> => {
//   const res: AxiosResponse<{ data: Branch[] }> = await api.get("/branch");

//   const normalizedBranches: Branch[] = res.data.data.map((b) => ({
//     branchId: b.branchId,
//     name: b.name ?? "Unnamed Branch",
//     address: b.address ?? "Not specified",
//     contactNumber: b.contactNumber ?? "",
//     status: b.status ?? "inactive",
//     businessHours: {
//       open: b.businessHours?.open ?? "09:00",
//       close: b.businessHours?.close ?? "18:00",
//       friday: {
//         open: b.businessHours?.friday?.open ?? "14:00",
//         close: b.businessHours?.friday?.close ?? "18:00",
//         isClosed: b.businessHours?.friday?.isClosed ?? false,
//       },
//     },
//     services: {
//       dineIn: b.services?.dineIn ?? false,
//       pickup: b.services?.pickup ?? false,
//     },
//     coordinates: {
//       lat: b.coordinates?.lat ?? null,
//       lng: b.coordinates?.lng ?? null,
//     },
//     createdAt: b.createdAt ?? new Date().toISOString(),
//     updatedAt: b.updatedAt ?? new Date().toISOString(),
//   }));

//   return normalizedBranches;
// };
export const fetchBranches = async (): Promise<Branch[]> => {
  const res: AxiosResponse<BranchResponse> = await api.get("/branch");

  // ✅ Normalize backend data → store format
  const normalizedBranches: Branch[] = res.data.data.map((b) => ({
    branchId: b.branchId || b._id,
    id: b.branchId || b._id,
    name: b.name,
    timing: `${b.businessHours?.open || "N/A"} - ${
      b.businessHours?.close || "N/A"
    }`,
    isActive:
      b.status === "active" || b.status === "ACTIVE" || b.status === "1",
    address: b.address || "Not specified",
    businessHours: {
      open: b.businessHours?.open || "09:00",
      close: b.businessHours?.close || "18:00",
      friday: {
        open: b.businessHours?.friday?.open || "14:00",
        close: b.businessHours?.friday?.close || "18:00",
        isClosed:
          typeof b.businessHours?.friday?.isClosed === "boolean"
            ? b.businessHours.friday.isClosed
            : false, // default: open on Friday
      },
    },
  }));

  return normalizedBranches;
};

// Get branch by id
export const fetchBranchById = async (id: string): Promise<Branch | null> => {
  const res: AxiosResponse<{ success?: boolean; data: Branch }> =
    await api.get(`/branch/${id}`);

  return res.data.data ?? null;
};

// -------------------- ITEMS --------------------
export interface ComboItem {
  name: string;
  itemId: string; // ObjectId reference to another Item
  quantity: number;
}

// export interface Item {
//   _id: string;
//   name: string;
//   description?: string;
//   categoryId: string;   // ObjectId reference to Category
//   price: number;
//   stock: number;
//   isCombo: boolean;
//   comboItems: ComboItem[];
//   images: string[];
//   loyaltyPoints: number;
//   stockStatus: "in-stock" | "out-of-stock";
//   status: "active" | "inactive";
//   availableBranches: string[]; // Array of Branch IDs
//   createdAt?: string;
//   updatedAt?: string;
// }

// ✅ Response from backend (for list endpoints)
interface ItemResponse {
  success: boolean;
  code: string;
  message: string;
  data: Item[];
  meta?: unknown;
}

// ✅ Get all items
export const fetchItems = async (): Promise<Item[]> => {
  const res: AxiosResponse<ItemResponse> = await api.get("/item");
  return res.data.data;
};

// ✅ Types
export interface Category {
  categoryId: string;
  _id: string;
  name: string;
  description?: string;
  totalItems?: number;
}

export interface Item {
  itemId: string;
  // _id: string;
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
}

export interface BranchItemsResponse {
  success: boolean;
  message: string;
  data: {
    items: Item[];
    categories: Category[];
  };
}

// types/points.ts (recommended place to store these)

export interface Redemption {
  redemptionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  redeemableId: string;
  redeemableName: string;
  pointsCost: number;
  status: "pending" | "claimed" | "expired";
  branchId?: string;
  redeemedAt: number;
  expiresAt: number;
}

export interface PointsTransaction {
  transactionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: "earn" | "redeem";
  points: number;
  balanceAfter: number;
  description: string;
  redeemableId?: string;
  redemptionId?: string;
  createdAt: number;
}

export interface RedeemResponseData {
  userId: string;
  totalPoints: number;
  transactions: PointsTransaction[];
  redemptions: Redemption[];
}

export interface RedeemResponse {
  success: boolean;
  data: RedeemResponseData;
}

// ✅ Fetch items available for a specific branch
export const fetchBranchItems = async (
  branchId: string
): Promise<BranchItemsResponse["data"]> => {
  const res: AxiosResponse<BranchItemsResponse> = await api.get(
    `/items/branch/${branchId}`
  );
  return res.data.data; // returns { items, categories }
};

export const fetchCategories = async (): Promise<Category[]> => {
  const res: AxiosResponse<{ success: boolean; data: Category[] }> =
    await api.get("/category");
  return res.data.data;
};

// ✅ Get single item by ID
export const fetchItemById = async (id: string): Promise<Item> => {
  const res: AxiosResponse<{ success: boolean; data: Item }> = await api.get(
    `/items/${id}`
  );
  return res.data.data;
};

// -------------------- CART / ORDER --------------------

export interface Item {
  itemId: string;
  price: number;
  quantity: number;
}

export interface Address {
  street?: string;
  city?: string;
  postalCode?: string;
  province?: string;
  [key: string]: string | undefined;
}

export interface Order {
  orderId: string;
  userId: string;
  items: Item[];
  totalPrice: number;
  paymentMethod: "cash" | "card" | "wallet" | string;
  status: "pending" | "completed" | "cancelled" | string;
  createdAt: number;
  updatedAt: number;
  orderType: "dine-in" | "pickup" | string;
  branchId: string
}

// Save cart
export const saveCart = async (
  cartItems: Item[]
): Promise<{ success: boolean; cart: Item[] }> => {
  const res: AxiosResponse<{ success: boolean; cart: Item[] }> = await api.post(
    "/cart",
    { items: cartItems }
  );
  return res.data;
};

// Place an order
export const placeOrder = async (
  order: Order
): Promise<{ success: boolean; order: Order }> => {
  const res: AxiosResponse<{ success: boolean; order: Order }> = await api.post(
    "/orders",
    order
  );
  return res.data;
};

// Fetch user orders
export const fetchOrders = async (): Promise<Order[]> => {
  const res: AxiosResponse<Order[]> = await api.get("/orders");
  return res.data;
};

export const getMyOrders = async (): Promise<Order[]> => {
  const res: AxiosResponse<{ message: string; orders: Order[] }> =
    await api.get("/orders/my");
  return res.data.orders; // ✅ only return the array
};

// -------------------- DEALS --------------------
export const fetchDeals = async (): Promise<Item[]> => {
  const res: AxiosResponse<{ success: boolean; data: Item[] }> = await api.get(
    "/deals"
  );
  return res.data.data;
};

// ----- Promotions --------
export const fetchPromotions = async (): Promise<Item[]> => {
  const res: AxiosResponse<{ success: boolean; data: Item[] }> = await api.get(
    "/promotions"
  );
  return res.data.data;
};

// -------------------- CONTACT --------------------
export interface ContactMessage {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  status?: "pending" | "new" | "in_progress" | "resolved";
}



// ======================
// POINTS & REDEEMABLES (USER)
// ======================

// 🎁 Redeemable Item type
export interface RedeemableItem {
  redemptionId: string;
  _id: string;
  name: string;
  description?: string;
  requiredPoints: number;
  image?: string;
  stock?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  status: string;
}

// ✅ 1. Get all available redeemable items
export const fetchRedeemables = async (
  branchId: string
): Promise<RedeemableItem[]> => {
  const res: AxiosResponse<{ success: boolean; data: RedeemableItem[] }> =
    await api.get(`/redeemables/${branchId}`);
  return res.data.data;
};

// ✅ 2. Get user’s points balance and transaction history
export interface PointsBalance {
  userId: string;
  totalPoints: number;
  earnedPoints: number;
  redeemedPoints: number;
  transactions?: {
    id: string;
    type: "earn" | "redeem" | "adjust";
    points: number;
    description?: string;
    createdAt: string;
  }[];
}

export interface PointsConfig {
  configId: string;
  conversionRate: number;
  minRedemptionPoints: number;
  pointsExpiryDays?: number;
  enabled: boolean;
  updatedAt: number;
  updatedBy: string;
}

export const fetchPointsBalance = async (): Promise<PointsBalance> => {
  const res: AxiosResponse<{ success: boolean; data: PointsBalance }> =
    await api.get("/points/balance");
  return res.data?.data;
};

// ✅ 3. Redeem an item using points
export const redeemPointsForItem = async (
  redeemableId: string
): Promise<RedeemResponse> => {
  const res: AxiosResponse<RedeemResponse> = await api.post("/points/redeem", {
    redeemableId,
  });
  return res.data;
};

// ============ Points Config ============
export const getPointsConfig = async () => {
  const res: AxiosResponse<{ success: boolean; data: PointsConfig }> =
    await api.get("/admin/points/config");
  return res.data.data;
};

export const getMyRedemptions = async (): Promise<RedeemableItem[]> => {
  const res: AxiosResponse<{ success: boolean; data: RedeemableItem[] }> =
    await api.get("/points/my-redemptions");
  return res.data.data;
};

export const updateRedemptionStatus = async (
  redemptionId: string,
  status: string
): Promise<{ success: boolean }> => {
  const res: AxiosResponse<{ success: boolean }> = await api.post(
    "/redemptions/update-status",
    { redemptionId, status }
  );
  return res.data;
};

export interface Slider {
  _id: string;
  title: string;
  image: string;
  link: string;
  createdAt: string;
  updatedAt: string;
}

// ===== HomePage Sliders =====
export const fetchSliders = async (): Promise<Slider[]> => {
  const res: AxiosResponse<{ success: boolean; data: Slider[] }> =
    await api.get("/sliders");
  return res.data.data;
};

// ===== Seasonal Highlights =====
export const fetchSeasonalHighlights = async (): Promise<Highlight[]> => {
  const res: AxiosResponse<{ success: boolean; data: Highlight[] }> =
    await api.get("/highlights");
  return res.data.data;
};

// -------------------- CONTACT --------------------
export interface ContactMessage {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string; // Add this field
  message: string;
}

export const sendContactMessage = async (
  data: ContactMessage
): Promise<{ success: boolean; message?: string }> => {
  const res: AxiosResponse<{ success: boolean; message?: string }> = await api.post(
    "/contact",
    data
  );
  return res.data;
};

export default api;
