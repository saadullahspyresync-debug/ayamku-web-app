import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "../../hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const signUpSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    mobileNumber: z
      .string()
      .min(7, "Mobile number must be at least 7 digits"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, 
  {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

const verifySchema = z.object({
  code: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
});

type VerifyFormData = z.infer<typeof verifySchema>;

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signup, confirmSignup, resendConfirmationCode, isAuthenticated } = useAuth();
  const [step, setStep] = useState<"signup" | "verify">("signup");
  const [userEmail, setUserEmail] = useState("");

  const {
    register: registerSignup,
    handleSubmit: handleSubmitSignup,
    formState: { errors: signupErrors, isSubmitting: isSignupSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const {
    register: registerVerify,
    handleSubmit: handleSubmitVerify,
    formState: { errors: verifyErrors, isSubmitting: isVerifySubmitting },
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
  });

  if (isAuthenticated) return <Navigate to="/" replace />;

  const onSignupSubmit = async (data: SignUpFormData) => {
    try {
      const result = await signup(
        data.email,
        data.password,
        data.fullName,
        data.mobileNumber
      );

      setUserEmail(data.email);

      if (result.nextStep?.signUpStep === "CONFIRM_SIGN_UP") {
        setStep("verify");
        toast({
          title: "Verification code sent!",
          description: "Please check your email for the verification code.",
        });
      } else if (result.isSignUpComplete) {
        toast({
          title: "Account created successfully!",
          description: "You can now sign in.",
        });
        navigate("/auth/login");
      }
    } catch (err) {
      console.error("Signup error:", err);
      // Error toasts are already handled in AuthContext
    }
  };

  const onVerifySubmit = async (data: VerifyFormData) => {
    try {
      await confirmSignup(userEmail, data.code);
      toast({
        title: "Email verified!",
        description: "You can now sign in with your account.",
      });
      navigate("/auth/login");
    } catch (err) {
      console.error("Verification error:", err);
      // Error toasts are already handled in AuthContext
    }
  };

  const handleResendCode = async () => {
    try {
      await resendConfirmationCode(userEmail);
    } catch (err) {
      console.error("Resend code error:", err);
      // Error toasts are already handled in AuthContext
    }
  };

  if (step === "verify") {
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

            <form onSubmit={handleSubmitVerify(onVerifySubmit)} className="space-y-6">
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
                  {...registerVerify("code")}
                  className={verifyErrors.code ? "border-red-500" : ""}
                />
                {verifyErrors.code && (
                  <p className="text-red-500 text-sm mt-1">
                    {verifyErrors.code.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isVerifySubmitting}
                className="w-full bg-ayamku-primary hover:bg-red-600 text-white py-3"
              >
                {isVerifySubmitting ? "Verifying..." : "Verify Email"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-sm text-ayamku-primary hover:underline"
                >
                  Resend verification code
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep("signup")}
                  className="text-sm text-gray-600 hover:underline"
                >
                  Back to signup
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
      {/* Left Side */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div
          className="absolute inset-0 bg-cover bg-center m-12 rounded-[30px]"
          style={{ backgroundImage: 'url("/assets/images/auth-cover.png")' }}
        />
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center flex items-center justify-center flex-col">
            <img
              src="/assets/icons/ayamku-logo.svg"
              alt="logo"
              className="mb-2"
            />
            <h1 className="text-2xl font-normal text-[32px] text-[#010F1C] mb-4">
              Create an Account
            </h1>

            <div className="flex justify-center space-x-2 mb-6 border p-2 rounded-[10px]">
              <Link to="/auth/login">
                <Button variant="ghost" className="text-gray-600 min-w-40">
                  Sign In
                </Button>
              </Link>
              <Button className="bg-ayamku-primary text-white rounded-[6px] min-w-40">
                Sign Up
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmitSignup(onSignupSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full name
              </label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your Full name"
                {...registerSignup("fullName")}
                className={signupErrors.fullName ? "border-red-500" : ""}
              />
              {signupErrors.fullName && (
                <p className="text-red-500 text-sm mt-1">
                  {signupErrors.fullName.message}
                </p>
              )}
            </div>

            {/* Mobile Number */}
            <div>
              <label
                htmlFor="mobileNumber"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Mobile number
              </label>
              <Input
                id="mobileNumber"
                type="tel"
                placeholder="1234567"
                {...registerSignup("mobileNumber")}
                className={signupErrors.mobileNumber ? "border-red-500" : ""}
              />
              {signupErrors.mobileNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {signupErrors.mobileNumber.message}
                </p>
              )}
              {/* <p className="text-xs text-gray-500 mt-1">
                Format: 03001234567 (Pakistan numbers)
              </p> */}
            </div>

            {/* Email */}
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
                {...registerSignup("email")}
                className={signupErrors.email ? "border-red-500" : ""}
              />
              {signupErrors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {signupErrors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your Password"
                  {...registerSignup("password")}
                  className={`pr-10 ${signupErrors.password ? "border-red-500" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {signupErrors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {signupErrors.password.message}
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
                  placeholder="Re-enter your Password"
                  {...registerSignup("confirmPassword")}
                  className={`pr-10 ${
                    signupErrors.confirmPassword ? "border-red-500" : ""
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
              {signupErrors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {signupErrors.confirmPassword.message}
                </p>
              )}
            </div>
             {/* <p className="text-xs text-gray-500 mt-1">{
                
              }</p> */}

            <Button
              type="submit"
              disabled={isSignupSubmitting}
              className="w-full bg-ayamku-primary hover:bg-red-600 text-white py-3 mt-6"
            >
              {isSignupSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;