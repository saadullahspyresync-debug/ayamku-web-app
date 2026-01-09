import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">
          Access Denied
        </h1>

        <p className="text-gray-700 mb-6">
          You do not have permission to access this page.
        </p>

        {user && (
          <p className="text-sm text-gray-500 mb-6">
            Signed in as <span className="font-semibold">{user.email}</span>{" "}
            (<span className="capitalize">{user.role}</span>)
          </p>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoBack}
            className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
          >
            Go Back
          </button>

          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
