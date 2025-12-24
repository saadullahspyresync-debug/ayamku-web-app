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
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export interface CognitoUser {
  userId: string;
  username: string;
  email?: string;
  phone?: string;
  name?: string;
  email_verified?: boolean;
  phoneNumberVerified?: boolean;
  role: string | null;
}

interface AuthContextType {
  user: CognitoUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    options?: { isAdminOnly?: boolean }
  ) => Promise<void>;
  signup: (
    email: string,
    password: string,
    fullName: string,
    role?: "Admin" | "Customer"
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
      const session = await fetchAuthSession();

      if (currentUser && session.tokens) {
        const idToken = session.tokens.idToken?.payload;

        const userGroups = idToken?.["cognito:groups"] || [];

        const userRole = Array.isArray(userGroups) ? userGroups[0] : null;

        // src/AuthContext.tsx

        if (!Array.isArray(userGroups) || !userGroups.includes("Admin")) {
          await signOut(); // Immediately sign the user out
          // ✅ THIS LINE SHOWS THE ERROR POP-UP
          toast.error(
            "Access Denied. You do not have administrator privileges."
          );
          throw new Error("ADMIN_ACCESS_REQUIRED"); // This stops execution
        }

        const userData: CognitoUser = {
          userId: currentUser.userId,
          username: currentUser.username,
          email: idToken?.email as string,
          name: idToken?.name as string,
          phone: idToken?.phone_number as string,
          email_verified: idToken?.email_verified as boolean,
          // ✅ Add role here
          role: (userRole as string | null) || "Customer", // default fallback
        };

        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  const login = async (
    email: string,
    password: string,
    options?: { isAdminOnly?: boolean }
  ) => {
    try {
      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password,
      });

      if (isSignedIn) {
        // ✅ If this is an admin-only login, perform the group check
        if (options?.isAdminOnly) {
          const session = await fetchAuthSession();
          const userGroups =
            session.tokens?.idToken?.payload?.["cognito:groups"] || [];

          // If the user is not in the "Admin" group, deny access
          if (!Array.isArray(userGroups) || !userGroups.includes("Admin")) {
            await signOut(); // Immediately sign the user out
            toast.error(
              "Access Denied. You do not have administrator privileges."
            );
            throw new Error("ADMIN_ACCESS_REQUIRED");
          }
        }

        // If the check passes (or isn't required), proceed to set the user state
        await checkAuthState();
        toast.success("Login successful!");
      } else if (nextStep.signInStep === "CONFIRM_SIGN_UP") {
        toast.error("Please verify your email first");
        throw new Error("CONFIRM_SIGN_UP_REQUIRED");
      }
    } catch (error: any) {
      // Avoid showing a generic error if we threw our custom admin error
      if (error.message === "ADMIN_ACCESS_REQUIRED") {
        throw error;
      }

      console.error("Login error:", error);

      if (error.name === "UserNotConfirmedException") {
        toast.error("Please verify your email first");
        throw new Error("CONFIRM_SIGN_UP_REQUIRED");
      } else if (error.name === "NotAuthorizedException") {
        toast.error("Incorrect email or password");
      } else if (error.name === "UserNotFoundException") {
        toast.error("User not found");
      } else {
        toast.error(error.message || "Login failed");
      }
      throw error;
    }
  };

  // const login = async (email: string, password: string) => {
  //   try {

  //     const { isSignedIn, nextStep } = await signIn({
  //       username: email,
  //       password,
  //     });

  //     if (isSignedIn) {
  //       await checkAuthState();
  //       toast.success("Login successful!");
  //     } else if (nextStep.signInStep === "CONFIRM_SIGN_UP") {
  //       toast.error("Please verify your email first");
  //       throw new Error("CONFIRM_SIGN_UP_REQUIRED");
  //     }
  //   } catch (error: any) {
  //     console.error("Login error:", error);

  //     if (error.name === "UserNotConfirmedException") {
  //       toast.error("Please verify your email first");
  //       throw new Error("CONFIRM_SIGN_UP_REQUIRED");
  //     } else if (error.name === "NotAuthorizedException") {
  //       toast.error("Incorrect email or password");
  //     } else if (error.name === "UserNotFoundException") {
  //       toast.error("User not found");
  //     } else {
  //       toast.error(error.message || "Login failed");
  //     }
  //     throw error;
  //   }
  // };

  const signup = async (
    email: string,
    password: string,
    fullName: string,
    role: "Admin" | "Customer" = "Customer"
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
            "custom:role": role, // ✅ attach custom attribute
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

  // const signup = async (
  //   email: string,
  //   password: string,
  //   fullName: string,
  //   phone?: string
  // ) => {
  //   try {
  //     // ✅ Ensure phone number is in E.164 format (e.g., +923001234567)
  //     let formattedPhone: string | undefined = undefined;
  //     if (phone) {
  //       const digitsOnly = phone.replace(/\D/g, ""); // remove non-numeric
  //       if (digitsOnly.startsWith("0")) {
  //         formattedPhone = `+92${digitsOnly.slice(1)}`; // assumes Pakistan numbers
  //       } else if (!digitsOnly.startsWith("92")) {
  //         formattedPhone = `+${digitsOnly}`; // add plus if missing
  //       } else {
  //         formattedPhone = `+${digitsOnly}`;
  //       }
  //     }

  //     const signUpInput: SignUpInput = {
  //       username: email,
  //       password,
  //       options: {
  //         userAttributes: {
  //           email,
  //           name: fullName,
  //           ...(formattedPhone && { phone_number: formattedPhone }),
  //         },
  //         autoSignIn: true,
  //       },
  //     };

  //     const { isSignUpComplete, userId, nextStep } = await signUp(signUpInput);

  //     if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
  //       toast.success("Verification code sent to your email!");
  //     } else if (isSignUpComplete) {
  //       toast.success("Sign up complete!");
  //     }

  //     return { isSignUpComplete, userId, nextStep };
  //   } catch (error: any) {
  //     console.error("Signup error:", error);

  //     if (error.name === "UsernameExistsException") {
  //       toast.error("An account with this email already exists");
  //     } else if (error.name === "InvalidPasswordException") {
  //       toast.error("Password does not meet requirements");
  //     } else if (error.name === "InvalidParameterException") {
  //       toast.error("Invalid input parameters — check email or phone format");
  //     } else {
  //       toast.error(error.message || "Signup failed");
  //     }
  //     throw error;
  //   }
  // };

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
