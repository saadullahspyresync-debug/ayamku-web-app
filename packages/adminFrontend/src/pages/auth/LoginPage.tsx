import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

import { useEffect } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
  const checkExistingSession = async () => {
    try {
      const session = await fetchAuthSession();
      if (session.tokens) {
        navigate("/admin-dashboard");
      }
    } catch {
      // not logged in
    }
  };

  checkExistingSession();
}, []);

  const handleLogin = async (e: any) => {
  e.preventDefault();
  setError("");

  try {
    const result = await login(form.email, form.password, {
      allowAdminPanel: true,
    }); 

    if (result?.status === "NEW_PASSWORD_REQUIRED") {
      navigate("/set-new-password", {
        state: { email: form.email },
      });
      return;
    }

    if (result?.status === "SIGNED_IN") {
      navigate("/admin-dashboard");
      return;
    }

    throw new Error("Unhandled login state");
    
  } catch (err: any) {
    if (err.message === "ACCOUNT_DISABLED") {
      alert("Your account has been disabled. Please contact admin.");
      return;
    }
    setError("Invalid email or password");
  }
};

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-3xl font-bold text-center mb-6">Admin Login</h2>

        {error && (
          <div className="mb-4 text-red-600 bg-red-50 p-2 rounded text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border p-3 rounded-lg"
            required
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border p-3 rounded-lg"
            required
          />

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* <p className="text-center mt-6 text-sm">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p> */}
      </div>
    </div>
  );
}
