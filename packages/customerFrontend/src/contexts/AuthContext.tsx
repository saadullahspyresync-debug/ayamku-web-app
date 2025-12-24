import React, { createContext, useContext, useEffect, useState } from "react";
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
  role?: string; // ✅ added
}

interface AuthContextType {
  user: CognitoUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    fullName: string,
    phone?: string
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
  useEffect(() => {
    checkAuthState();
  }, []);

  // const checkAuthState = async () => {
  //   try {
  //     const currentUser = await getCurrentUser();
  //     const session = await fetchAuthSession();

  //     if (currentUser && session.tokens) {
  //       const userData: CognitoUser = {
  //         userId: currentUser.userId,
  //         username: currentUser.username,
  //         email: session.tokens.idToken?.payload.email as string,
  //         name: session.tokens.idToken?.payload.name as string,
  //         phone: session.tokens.idToken?.payload.phone as string,
  //         email_verified: session.tokens.idToken?.payload
  //           .email_verified as boolean,
  //       };
  //       setUser(userData);
  //       setIsAuthenticated(true);
  //     }
  //   } catch (error) {
  //     setUser(null);
  //     setIsAuthenticated(false);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();

      if (currentUser && session.tokens) {
        const idToken = session.tokens.idToken?.payload;

        const userGroups = idToken?.["cognito:groups"] || [];

        const userRole = Array.isArray(userGroups) ? userGroups[0] : null;

        const userData: CognitoUser = {
          userId: currentUser.userId,
          username: currentUser.username,
          email: idToken?.email as string,
          name: idToken?.name as string,
          phone: idToken?.phone_number as string,
          email_verified: idToken?.email_verified as boolean,
          // ✅ Add role here
          role: userRole || "Customer", // default fallback
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
  };

  const login = async (email: string, password: string) => {
    try {

      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password,
      });

      if (isSignedIn) {
        await checkAuthState();
        toast.success("Login successful!");
      } else if (nextStep.signInStep === "CONFIRM_SIGN_UP") {
        toast.error("Please verify your email first");
        throw new Error("CONFIRM_SIGN_UP_REQUIRED");
      }
    } catch (error) {
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

  const signup = async (
    email: string,
    password: string,
    fullName: string,
    phone?: string
  ) => {
    try {
      let formattedPhone: string | undefined;

      if (phone) {
      const digitsOnly = phone.replace(/\D/g, "");

      // Remove country code if already present
      const localNumber = digitsOnly.startsWith("673")
        ? digitsOnly.slice(3)
        : digitsOnly.startsWith("0")
        ? digitsOnly.slice(1)
        : digitsOnly;

      // Brunei local numbers must be exactly 7 digits
      if (localNumber.length !== 7) {
        throw new Error("Invalid Brunei phone number");
      }

      formattedPhone = `+673${localNumber}`;
      }


      const signUpInput: SignUpInput = {
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name: fullName,
            ...(formattedPhone && { phone_number: formattedPhone }),
          },
          autoSignIn: true,
        },
      };

      const { isSignUpComplete, userId, nextStep } = await signUp(signUpInput);

      if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        toast.success("Verification code sent to your email!");
      } else if (isSignUpComplete) {
        toast.success("Sign up complete!");
      }

      return { isSignUpComplete, userId, nextStep };
    } catch (error) {
      console.error("Signup error:", error);

      if (error.name === "UsernameExistsException") {
        toast.error("An account with this email already exists");
      } else if (error.name === "InvalidPasswordException") {
        toast.error("Password does not meet requirements");
      } else if (error.name === "InvalidParameterException") {
        toast.error("Invalid input parameters — check email or phone format");
      } else {
        toast.error(error.message || "Signup failed");
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
    } catch (error) {
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
    } catch (error) {
      console.error("Resend code error:", error);
      toast.error(error.message || "Failed to resend code");
      throw error;
    }
  };

  const forgotPassword = async (username: string) => {
    try {
      await resetPassword({ username });
      toast.success("Password reset code sent to your email!");
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
