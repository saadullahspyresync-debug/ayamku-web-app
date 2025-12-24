import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "../../hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z
  .object({
    code: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [userEmail, setUserEmail] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { forgotPassword, confirmForgotPassword } = useAuth();

  const {
    register: registerForgot,
    handleSubmit: handleSubmitForgot,
    formState: { errors: forgotErrors, isSubmitting: isForgotSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: resetErrors, isSubmitting: isResetSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onForgotPasswordSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPassword(data.email);
      setUserEmail(data.email);
      setStep("reset");
      toast({
        title: "Reset code sent!",
        description: "Check your email for password reset instructions.",
      });
    } catch (err: any) {
      console.error("Forgot password error:", err);
      // Error toasts are already handled in AuthContext
    }
  };

  const onResetPasswordSubmit = async (data: ResetPasswordFormData) => {
    try {
      await confirmForgotPassword(userEmail, data.code, data.newPassword);
      toast({
        title: "Password reset successful!",
        description: "Your password has been updated. Please login with your new password.",
      });
      navigate("/auth/login");
    } catch (err: any) {
      console.error("Reset password error:", err);
      // Error toasts are already handled in AuthContext
    }
  };

  const handleResendCode = async () => {
    try {
      await forgotPassword(userEmail);
      toast({
        title: "Code resent!",
        description: "A new reset code has been sent to your email.",
      });
    } catch (err: any) {
      console.error("Resend code error:", err);
    }
  };

  if (step === "reset") {
    return (
      <div className="min-h-screen flex">
        {/* Left Side */}
        <div className="hidden lg:block lg:w-1/2 relative">
          <div
            className="absolute inset-0 bg-cover bg-center m-12 rounded-[30px]"
            style={{
              backgroundImage:
                'url("/assets/images/auth-cover.png")',
            }}
          />
        </div>

        {/* Right Side - Reset Password */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md">
            <button
              onClick={() => setStep("request")}
              className="inline-flex items-center text-gray-600 hover:text-ayamku-primary mb-6"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back
            </button>

            <div className="text-center flex items-center justify-center flex-col mb-8">
              <img
                src="/assets/icons/ayamku-logo.svg"
                alt="logo"
                className="mb-4"
              />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Reset Password
              </h1>
              <p className="text-gray-600">
                Enter the code sent to <strong>{userEmail}</strong> and your new password
              </p>
            </div>

            <form onSubmit={handleSubmitReset(onResetPasswordSubmit)} className="space-y-4">
              {/* Verification Code */}
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Verification Code
                </label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  {...registerReset("code")}
                  className={resetErrors.code ? "border-red-500" : ""}
                />
                {resetErrors.code && (
                  <p className="text-red-500 text-sm mt-1">
                    {resetErrors.code.message}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  New Password
                </label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter your Password"
                    {...registerReset("newPassword")}
                    className={`pr-10 ${resetErrors.newPassword ? "border-red-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {resetErrors.newPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {resetErrors.newPassword.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Min 8 characters with uppercase, lowercase, number & special character
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your Password"
                    {...registerReset("confirmPassword")}
                    className={`pr-10 ${
                      resetErrors.confirmPassword ? "border-red-500" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
                {resetErrors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {resetErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isResetSubmitting}
                className="w-full bg-ayamku-primary hover:bg-red-600 text-white py-3 mt-6"
              >
                {isResetSubmitting ? "Resetting..." : "Reset Password"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-sm text-ayamku-primary hover:underline"
                >
                  Resend reset code
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Food Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div
          className="absolute inset-0 bg-cover bg-center m-12 rounded-[30px]"
          style={{
            backgroundImage:
              'url("/assets/images/auth-cover.png")',
          }}
        />
      </div>

      {/* Right Side - Forgot Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <Link
              to="/auth/login"
              className="inline-flex items-center text-gray-600 hover:text-ayamku-primary mb-4"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back
            </Link>

            <div className="text-center flex items-center justify-center flex-col">
              <img
                src="/assets/icons/ayamku-logo.svg"
                alt="logo"
                className="mb-4"
              />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Forget Password
              </h1>
              <p className="text-gray-600">
                Enter your email address and we will send you an email with
                instructions to reset your password
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitForgot(onForgotPasswordSubmit)} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...registerForgot("email")}
                className={forgotErrors.email ? "border-red-500" : ""}
              />
              {forgotErrors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {forgotErrors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isForgotSubmitting}
              className="w-full bg-ayamku-primary hover:bg-red-600 text-white py-3"
            >
              {isForgotSubmitting ? "Sending..." : "Continue"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;