import { create } from "zustand";
import { persist } from "zustand/middleware";

import { loginUser, logoutUser, getUserProfile } from "../services/api";

export interface User {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void; // ✅ User object + token
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      // ✅ Store me user + token save karo
      login: (user: User, token: string) => {
        localStorage.setItem("token", token); // token save
        set({ user, isAuthenticated: true });
      },

      // ✅ API se logout
      logout: async () => {
        try {
          await logoutUser();
        } catch (err) {
          console.error("Logout API failed", err);
        }
        localStorage.removeItem("token");

        set({ user: null, isAuthenticated: false });
      },

      // ✅ locally user update karo
      updateUser: (userData: Partial<User>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),

      // ✅ optional: user profile refresh karo
      fetchProfile: async () => {
        try {
          const user: User = await getUserProfile(); // type-safe
          set({ user, isAuthenticated: true });
        } catch (err) {
          console.error("Failed to fetch profile", err);
        }
      },
    }),
    {
      name: "ayamku-auth",
    }
  )
);
