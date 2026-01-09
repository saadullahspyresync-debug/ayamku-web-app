import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  signUp,
  signIn,
  signOut,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
  getCurrentUser,
  fetchAuthSession,
  resendSignUpCode,
  type SignUpInput,
  type SignInInput,
  type ConfirmSignUpInput,
  type ResetPasswordInput,
  type ConfirmResetPasswordInput,
} from "aws-amplify/auth";
import { toast } from "sonner";
import { authMe } from "../api/branchManager";

export type UserRole = "Admin" | "Branch_Manager" | "Customer";

export interface CognitoUser {
  userId: string;
  username: string;
  email?: string;
  phone?: string;
  name?: string;
  email_verified?: boolean;
  phoneNumberVerified?: boolean;
  role: UserRole;
  branchId?: string;
}

interface AuthContextType {
  user: CognitoUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    options?: { allowAdminPanel?: boolean }
  ) => Promise<{ status: "SIGNED_IN" | "NEW_PASSWORD_REQUIRED" }>;
  signup: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ isSignUpComplete: boolean; userId?: string; nextStep?: any }>;
  logout: () => Promise<void>;
  confirmSignup: (username: string, code: string) => Promise<void>;
  resendConfirmationCode: (username: string) => Promise<void>;
  forgotPassword: (username: string) => Promise<void>;
  confirmForgotPassword: (
    username: string,
    code: string,
    newPassword: string
  ) => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  refreshUser: () => Promise<void>;
  checkAuthState: () => Promise<CognitoUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<CognitoUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount

  const checkAuthState = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession({ forceRefresh: true });

      if (!currentUser || !session.tokens) {
        setUser(null);
        setIsAuthenticated(false);
        return null;
      }

      const idToken = session.tokens.idToken?.payload;
      const groups: string[] = Array.isArray(idToken?.["cognito:groups"])
        ? idToken?.["cognito:groups"].filter(
            (g): g is string => typeof g === "string"
          )
        : [];

      let role: "Admin" | "Branch_Manager" | "Customer" = "Customer";
      if (groups.includes("Admin")) role = "Admin";
      else if (groups.includes("Branch_Manager")) role = "Branch_Manager";

      let branchId: string | undefined = undefined;
      if(groups.includes("Branch_Manager")) {
        branchId = idToken?.["custom:branchId"] as string;
      }

      const userData: CognitoUser = {
        userId: currentUser.userId,
        username: currentUser.username,
        email: idToken?.email as string,
        name: idToken?.name as string,
        phone: idToken?.phone_number as string,
        email_verified: idToken?.email_verified as boolean,
        role,
        branchId,
      };

      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } 
    catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      return null;
    } 
    finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  // const login = async (
  //   email: string,
  //   password: string,
  //   options?: { allowAdminPanel?: boolean }    
  //   ): Promise<{ status: "SIGNED_IN" | "NEW_PASSWORD_REQUIRED" }> => {
  //     try {
  //       const response = await signIn({
  //         username: email,
  //         password,
  //       });

  //       const { isSignedIn, nextStep } = response;

  //       // First time login for branch manager
  //       if (nextStep?.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
  //         return { status: "NEW_PASSWORD_REQUIRED" };
  //       }

  //       // Normal login
  //       if (isSignedIn) {
  //         if (options?.allowAdminPanel) {
  //           const session = await fetchAuthSession();
  //           const rawGroups =   session.tokens?.idToken?.payload?.["cognito:groups"];
  //           const groups: string[] = Array.isArray(rawGroups)
  //             ? rawGroups.filter(
  //                 (g): g is string => typeof g === "string"
  //               )
  //             : [];
  //           const allowed = groups.includes("Admin") || groups.includes("Branch_Manager");
  //           if (!allowed) {
  //             await signOut();
  //             throw new Error("ADMIN_ACCESS_REQUIRED");
  //           }            
  //         }

  //         const user = await checkAuthState();
  //         if (!user) {
  //           throw new Error("AUTH_STATE_NOT_READY");
  //         }

  //         return { status: "SIGNED_IN" };
  //       }

  //       throw new Error("UNKNOWN_LOGIN_STATE");
  //     } 
  //     catch (error) {
  //       console.error("Login error:", error);
  //       throw error;
  //     }
  // };

 const login = async (
  email: string,
  password: string,
  options?: { allowAdminPanel?: boolean }
): Promise<{ status: "SIGNED_IN" | "NEW_PASSWORD_REQUIRED" }> => {
  try {
    const response = await signIn({
      username: email,
      password,
    });

    const { isSignedIn, nextStep } = response;

    // First-time password reset
    if (
      nextStep?.signInStep ===
      "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED"
    ) {
      return { status: "NEW_PASSWORD_REQUIRED" };
    }

    if (!isSignedIn) {
      throw new Error("SIGN_IN_FAILED");
    }

    /* ================= ROLE CHECK (OPTIONAL UI FILTER) ================= */
    if (options?.allowAdminPanel) {
      const session = await fetchAuthSession();
      const rawGroups =
        session.tokens?.idToken?.payload?.["cognito:groups"];

      const groups: string[] = Array.isArray(rawGroups)
        ? rawGroups.filter((g): g is string => typeof g === "string")
        : [];

      const allowed =
        groups.includes("Admin") || groups.includes("Branch_Manager");

      if (!allowed) {
        await signOut();
        throw new Error("ADMIN_ACCESS_REQUIRED");
      }
    }

    /* ================= 🔥 GATEKEEPER API ================= */
    try {
      await authMe(); // 👈 AUTHORITATIVE CHECK
    } 
    catch {
      await signOut();
      throw new Error("ACCOUNT_DISABLED");
    }

    /* ================= FINAL AUTH STATE ================= */
    const user = await checkAuthState();
    if (!user) {
      throw new Error("AUTH_STATE_NOT_READY");
    }

    return { status: "SIGNED_IN" };
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};


  const signup = async (
    email: string,
    password: string,
    fullName: string,
  ) => {
    try {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) throw new Error("Email is required.");

      const signUpInput: SignUpInput = {
        username: trimmedEmail,
        password,
        options: {
          userAttributes: {
            email: trimmedEmail,
            name: fullName.trim(),
            "custom:role": "Customer", // ✅ attach custom attribute
          },
          autoSignIn: true,
        },
      };

      const { isSignUpComplete, userId, nextStep } = await signUp(signUpInput);

      if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        toast.success("A verification code has been sent to your email!");
      } else if (isSignUpComplete) {
        toast.success("Sign up complete!");
      }

      return { isSignUpComplete, userId, nextStep };
    } catch (error: any) {
      console.error("Signup error:", error);

      if (error.name === "UsernameExistsException") {
        toast.error("An account with this email already exists.");
      } else if (error.name === "InvalidPasswordException") {
        toast.error("Password does not meet requirements.");
      } else if (error.name === "InvalidParameterException") {
        toast.error("Invalid input parameters — check your email format.");
      } else {
        toast.error(error.message || "Signup failed.");
      }

      throw error;
    }
  };

  const confirmSignup = async (username: string, code: string) => {
    try {
      await confirmSignUp({
        username,
        confirmationCode: code,
      });
      toast.success("Email verified successfully!");
    } catch (error: any) {
      console.error("Confirmation error:", error);

      if (error.name === "CodeMismatchException") {
        toast.error("Invalid verification code");
      } else if (error.name === "ExpiredCodeException") {
        toast.error("Verification code expired");
      } else {
        toast.error(error.message || "Verification failed");
      }
      throw error;
    }
  };

  const resendConfirmationCode = async (username: string) => {
    try {
      await resendSignUpCode({ username });
      toast.success("Verification code resent!");
    } catch (error: any) {
      console.error("Resend code error:", error);
      toast.error(error.message || "Failed to resend code");
      throw error;
    }
  };

  const forgotPassword = async (username: string) => {
    try {
      await resetPassword({ username });
      toast.success("Password reset code sent to your email!");
    } catch (error: any) {
      console.error("Forgot password error:", error);

      if (error.name === "UserNotFoundException") {
        toast.error("User not found");
      } else if (error.name === "LimitExceededException") {
        toast.error("Too many attempts. Please try again later");
      } else {
        toast.error(error.message || "Failed to send reset code");
      }
      throw error;
    }
  };

  const confirmForgotPassword = async (
    username: string,
    code: string,
    newPassword: string
  ) => {
    try {
      await confirmResetPassword({
        username,
        confirmationCode: code,
        newPassword,
      });
      toast.success("Password reset successful!");
    } catch (error: any) {
      console.error("Reset password error:", error);

      if (error.name === "CodeMismatchException") {
        toast.error("Invalid reset code");
      } else if (error.name === "ExpiredCodeException") {
        toast.error("Reset code expired");
      } else if (error.name === "InvalidPasswordException") {
        toast.error("Password does not meet requirements");
      } else {
        toast.error(error.message || "Password reset failed");
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      setIsAuthenticated(false);
      toast.success("Logged out successfully");
    } catch (error: any) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
      throw error;
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.accessToken?.toString() || null;
    } catch (error) {
      console.error("Failed to get access token:", error);
      return null;
    }
  };

  const refreshUser = async () => {
    await checkAuthState();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
        confirmSignup,
        resendConfirmationCode,
        forgotPassword,
        confirmForgotPassword,
        getAccessToken,
        refreshUser,
        checkAuthState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
