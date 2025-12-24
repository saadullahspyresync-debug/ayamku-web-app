import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "../../hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const verifySchema = z.object({
  code: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
});

type VerifyFormData = z.infer<typeof verifySchema>;

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmSignup, resendConfirmationCode } = useAuth();
  
  // Get email from navigation state or localStorage
  const userEmail = location.state?.email || localStorage.getItem("pendingVerificationEmail") || "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
  });

  const onSubmit = async (data: VerifyFormData) => {
    if (!userEmail) {
      toast({
        title: "Error",
        description: "Email not found. Please sign up again.",
        variant: "destructive",
      });
      navigate("/auth/signup");
      return;
    }

    try {
      await confirmSignup(userEmail, data.code);
      
      // Clear pending verification email
      localStorage.removeItem("pendingVerificationEmail");
      
      toast({
        title: "Email verified!",
        description: "You can now sign in with your account.",
      });
      
      navigate("/auth/login");
    } catch (err: any) {
      console.error("Verification error:", err);
      // Error toasts are already handled in AuthContext
    }
  };

  const handleResendCode = async () => {
    if (!userEmail) {
      toast({
        title: "Error",
        description: "Email not found. Please sign up again.",
        variant: "destructive",
      });
      navigate("/auth/signup");
      return;
    }

    try {
      await resendConfirmationCode(userEmail);
    } catch (err: any) {
      console.error("Resend code error:", err);
      // Error toasts are already handled in AuthContext
    }
  };

  if (!userEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Email not found</h2>
          <p className="text-gray-600 mb-4">Please sign up first</p>
          <Link to="/auth/signup">
            <Button className="bg-ayamku-primary hover:bg-red-600">
              Go to Sign Up
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div
          className="absolute inset-0 bg-cover bg-center m-12 rounded-[30px]"
          style={{ backgroundImage: 'url("/assets/images/auth-cover.png")' }}
        />
      </div>

      {/* Right Side - Verification */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <Link
            to="/auth/login"
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Login
          </Link>

          <div className="text-center flex items-center justify-center flex-col mb-8">
            <img
              src="/assets/icons/ayamku-logo.svg"
              alt="logo"
              className="mb-4"
            />
            <h1 className="text-2xl font-normal text-[32px] text-[#010F1C] mb-2">
              Verify Your Email
            </h1>
            <p className="text-gray-600 text-sm">
              We've sent a verification code to <strong>{userEmail}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                {...register("code")}
                className={errors.code ? "border-red-500" : ""}
                autoFocus
              />
              {errors.code && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.code.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-ayamku-primary hover:bg-red-600 text-white py-3"
            >
              {isSubmitting ? "Verifying..." : "Verify Email"}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">Didn't receive the code?</p>
              <button
                type="button"
                onClick={handleResendCode}
                className="text-sm text-ayamku-primary hover:underline font-medium"
              >
                Resend verification code
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;