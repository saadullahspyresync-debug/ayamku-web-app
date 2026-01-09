import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { confirmSignIn } from "aws-amplify/auth";
import { toast } from "sonner";

import { fetchAuthSession } from "aws-amplify/auth";
import { useAuth } from "../contexts/AuthContext";

export default function SetNewPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const { checkAuthState } = useAuth();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const session = await fetchAuthSession();
      if (session.tokens) {
          navigate("/admin-dashboard", {replace: true});
      }
    };
    checkSession();
    }, []);

  if (!email) {
    navigate("/admin-login");
    return null;
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      await confirmSignIn({
      challengeResponse: password,
      });

      // FORCE TOKEN REFRESH
      await fetchAuthSession({ forceRefresh: true });

      // Small delay to allow Cognito → Amplify sync
      await new Promise((res) => setTimeout(res, 300));

      const user = await checkAuthState();

      if (!user) {
      throw new Error("User not found after password confirmation");
      }

      toast.success("Password set successfully!");
      navigate("/admin-dashboard", { replace: true });
    } 
    catch (err: any) {
      toast.error(err.message || "Failed to set password");
    } 
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-4">Set New Password</h2>

        <input
          type="password"
          placeholder="New password"
          className="w-full border p-3 mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded"
        >
          {loading ? "Saving..." : "Set Password"}
        </button>
      </form>
    </div>
  );
}
