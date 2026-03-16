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

const verifySchema = z.object({
  code: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
});

type VerifyFormData = z.infer<typeof verifySchema>;

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { signup, confirmSignup, resendConfirmationCode, isAuthenticated } = useAuth();
  
  // --- States ---
  const [step, setStep] = useState<"signup" | "verify">("signup");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form Values State
  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    code: ""
  });

  // Error State
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (isAuthenticated) return <Navigate to="/" replace />;

  // --- Manual Validation Function ---
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (step === "signup") {
      if (formData.fullName.length < 2) newErrors.fullName = "Full name is too short";
      if (formData.mobileNumber.length < 7) newErrors.mobileNumber = "Invalid mobile number";
      if (formData.mobileNumber.length > 7) newErrors.mobileNumber = "Enter valid mobile number without country code";
      if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email address";
      
      // Password Complexity
      const pass = formData.password;
      if (pass.length < 8) newErrors.password = "Min 8 characters required";
      else if (!/[A-Z]/.test(pass)) newErrors.password = "Needs an uppercase letter";
      else if (!/[0-9]/.test(pass)) newErrors.password = "Needs a number";
      else if (!/[^A-Za-z0-9]/.test(pass)) newErrors.password = "Needs a special character";

      if (pass !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    } else {
      if (formData.code.length !== 6) newErrors.code = "Enter the 6-digit code";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    // Clear error when user types
    if (errors[e.target.id]) {
      setErrors({ ...errors, [e.target.id]: "" });
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await signup(formData.email, formData.password, formData.fullName, formData.mobileNumber);
      if (result.nextStep?.signUpStep === "CONFIRM_SIGN_UP") {
        setStep("verify");
      } else if (result.isSignUpComplete) {
        navigate("/auth/login");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
 
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await confirmSignup(formData.email, formData.code);
      navigate("/auth/login");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  const handleResendCode = async () => {
    try {
      await resendConfirmationCode(formData.email);
    } catch (err) {
      // Error toasts are already handled in AuthContext
    }
  };
  
  return (
    <div className="min-h-screen flex">
      {/* Left Side (Cover Image) */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div
          className="absolute inset-0 bg-cover bg-center m-12 rounded-[30px]"
          style={{ backgroundImage: 'url("/assets/images/auth-cover.png")' }}
        />
      </div>

      {/* Right Side (Forms) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center flex items-center justify-center flex-col mb-6">
            <img src="/assets/icons/ayamku-logo.svg" alt="logo" className="mb-4" />
            <h1 className="text-2xl font-normal text-[32px] text-[#010F1C] mb-2">
              {step === "signup" ? "Create an Account" : "Verify Your Email"}
            </h1>
            {step === "verify" && (
              <p className="text-gray-600 text-sm">
                Code sent to <strong>{formData.email}</strong>
              </p>
            )}
          </div>

          {step === "signup" && (
            <div className="flex justify-center space-x-2 mb-6 border p-2 rounded-[10px]">
              <Link to="/auth/login">
                <Button variant="ghost" className="text-gray-600 min-w-40">Sign In</Button>
              </Link>
              <Button className="bg-ayamku-primary text-white rounded-[6px] min-w-40">Sign Up</Button>
            </div>
          )}

          <form onSubmit={step === "signup" ? handleSignupSubmit : handleVerifySubmit} className="space-y-4">
            {step === "signup" ? (
              <>
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                  <Input id="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter your Full name" className={errors.fullName ? "border-red-500" : ""} />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>

                {/* Mobile */}
                <div>
                  <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-1">Mobile number</label>
                  <Input id="mobileNumber" type="tel" value={formData.mobileNumber} onChange={handleChange} placeholder="1234567" className={errors.mobileNumber ? "border-red-500" : ""} />
                  {errors.mobileNumber && <p className="text-red-500 text-sm mt-1">{errors.mobileNumber}</p>}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" className={errors.email ? "border-red-500" : ""} />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} placeholder="Enter your Password" className={errors.password ? "border-red-500" : ""} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter your Password" className={errors.confirmPassword ? "border-red-500" : ""} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              </>
            ) : (
              /* Verification View */
              <>
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                  <Input id="code" type="text" maxLength={6} value={formData.code} onChange={handleChange} placeholder="Enter 6-digit code" className={errors.code ? "border-red-500" : ""} />
                  {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
                </div>
                <div className="text-center space-y-4">
                  <button type="button" onClick={handleResendCode} className="text-sm text-ayamku-primary hover:underline block w-full">Resend verification code</button>
                  <button type="button" onClick={() => setStep("signup")} className="text-sm text-gray-600 hover:underline">Back to signup</button>
                </div>
              </>
            )}

            <Button type="submit" disabled={isLoading} className="w-full bg-ayamku-primary hover:bg-red-600 text-white py-3 mt-6">
              {isLoading ? "Processing..." : step === "signup" ? "Create account" : "Verify Email"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;