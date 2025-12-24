import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, confirmSignup, resendConfirmationCode, isLoading } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState("signup"); // "signup" | "verify"
  const [code, setCode] = useState("");

  // ✅ Handle Signup
  const handleSignup = async (e : any) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    try {
      const result = await signup(form.email, form.password, form.fullName, "Admin");   1  // for admin signup  
      if (result?.nextStep?.signUpStep === "CONFIRM_SIGN_UP") {
        setStep("verify");
        setMessage("Verification code sent! Check your email.");
      } else {
        setMessage("Signup complete! You can now log in.");
        navigate("/login");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Signup failed. Please try again.");
    }
  };

  // ✅ Handle Verification
  const handleVerify = async (e : any) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await confirmSignup(form.email, code);
      setMessage("Email verified successfully! You can now log in.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      console.error("Verification error:", err);
      setError("Invalid or expired code. Please try again.");
    }
  };

  // ✅ Resend Verification Code
  const handleResend = async () => {
    try {
      await resendConfirmationCode(form.email);
      setMessage("Verification code resent successfully!");
    } catch (err) {
      console.error("Resend code error:", err);
      setError("Failed to resend code.");
    }
  };

  // ---------------------------
  // STEP 1: SIGNUP FORM
  // ---------------------------
  if (step === "signup") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-6">
            Create an Account
          </h2>

          {error && (
            <div className="mb-4 text-red-600 bg-red-50 p-2 rounded text-center">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 text-green-600 bg-green-50 p-2 rounded text-center">
              {message}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full border p-3 rounded-lg"
              required
            />

            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border p-3 rounded-lg"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border p-3 rounded-lg"
              required
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-60"
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-green-600 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------
  // STEP 2: VERIFY FORM
  // ---------------------------
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg text-center">
        <h2 className="text-3xl font-bold mb-4">Verify Your Email</h2>
        <p className="text-gray-600 mb-6">
          We’ve sent a 6-digit code to <strong>{form.email}</strong>
        </p>

        {error && (
          <div className="mb-3 text-red-600 bg-red-50 p-2 rounded">{error}</div>
        )}
        {message && (
          <div className="mb-3 text-green-600 bg-green-50 p-2 rounded">
            {message}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full border p-3 rounded-lg text-center tracking-widest"
            maxLength={6}
            required
          />

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
          >
            Verify
          </button>
        </form>

        <button
          onClick={handleResend}
          className="mt-4 text-sm text-green-600 hover:underline"
        >
          Resend Code
        </button>

        <p className="text-sm mt-4 text-gray-600">
          Back to{" "}
          <button
            onClick={() => setStep("signup")}
            className="text-green-600 hover:underline"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}
