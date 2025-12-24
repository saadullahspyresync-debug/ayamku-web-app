import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleLogin = async (e : any) => {
    e.preventDefault();
    setError("");

    try {
      await login(form.email, form.password, { isAdminOnly: true });

      // ✅ Once user logs in successfully, navigate
      navigate("/admin-dashboard");
    } catch (err) {
      // ✅ 2. Catch the error and set the message
      console.error("Admin login failed:", error);

      // The toast notification is already handled by the AuthContext.
      // Here, we set a message to display inline within the form.
      if (error === "ADMIN_ACCESS_REQUIRED") {
        setError("You do not have permission to sign in.");
      } else if (error === "UserNotConfirmedException") {
        setError(
          "Your account has not been confirmed. Please check your email."
        );
      } else {
        // For other errors like "NotAuthorizedException"
        setError("Invalid email or password. Please try again.");
      }
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
