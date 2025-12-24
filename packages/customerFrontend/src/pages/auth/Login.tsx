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
import { registerUser, syncUser } from "@/services/api";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated, refreshUser, user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  if (isAuthenticated) return <Navigate to="/" replace />;

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);


      await refreshUser();

      // ✅ Get the latest user data
    const currentUser = await getCurrentUser();
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.payload;

    

    // ✅ Call your backend sync API
    await syncUser(idToken);

      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });

      navigate("/");
      // if (result.role === "Admin") {
      // window.location.href = "http://localhost:5173/admin-dashboard";
      // } else {
      // window.location.href = "http://localhost:5173/";
      // }
    } catch (err: any) {
      console.error("Login error:", err);

      // Handle the specific case where user needs to verify email
      if (err.message === "CONFIRM_SIGN_UP_REQUIRED") {
        // Redirect to verification page with email
        navigate("/auth/verify", {
          state: { email: data.email },
        });
      }
      // Other errors are already handled by toasts in AuthContext
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Food Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div
          className="absolute inset-0 bg-cover bg-center m-12 rounded-[30px]"
          style={{
            backgroundImage: 'url("/assets/images/auth-cover.png")',
          }}
        />
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-4 flex items-center justify-center flex-col">
            <img src="/assets/icons/ayamku-logo.svg" alt="logo" />
            <h1 className="text-2xl font-normal text-[#010F1C] mb-2 text-[36px] my-4">
              Welcome to <span className="font-medium"> Ayamku Food </span>
            </h1>

            <div className="flex justify-center space-x-2 mb-3 border p-2 rounded-[10px] mt-2">
              <Button className="bg-ayamku-primary text-white rounded-[6px] min-w-fit sm:min-w-40">
                Sign In
              </Button>
              <Link to="/auth/signup">
                <Button
                  variant="ghost"
                  className="text-[#010F1C] min-w-fit sm:min-w-40"
                >
                  Sign Up
                </Button>
              </Link>
            </div>

            <p className="text-[#010F1C]">
              Ayamku Food delivers bold flavors and local favorites to satisfy
              every craving.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your Password"
                  {...register("password")}
                  className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register("rememberMe")}
                  className="rounded border-gray-300 text-ayamku-primary focus:ring-ayamku-primary"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <Link
                to="/auth/forgot-password"
                className="text-sm text-ayamku-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-ayamku-primary hover:bg-red-600 text-white py-3"
            >
              {isSubmitting ? "Signing in..." : "Login"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
