import {
  HomeIcon,
  BuildingStorefrontIcon,
  Squares2X2Icon,
  MegaphoneIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";

import { Link } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
// The useNavigate import is no longer needed here if logout navigation is handled globally
// import { useNavigate } from "react-router-dom";

const navItems = [
  { id: "overview", label: "Overview", icon: HomeIcon },
  { id: "branches", label: "Branches", icon: BuildingStorefrontIcon },
  { id: "menu", label: "Menu", icon: Squares2X2Icon },
  { id: "promotions", label: "Promotions", icon: MegaphoneIcon },
  { id: "orders", label: "Orders", icon: ShoppingBagIcon },
  { id: "points", label: "Points", icon: ChartBarIcon },
  { id: "highlights", label: "Highlights", icon: SparklesIcon },
  { id: "contact", label: "Contact Requests", icon: UserGroupIcon },
];

export default function Sidebar({ activeTab, setActiveTab } : any) {
  const { logout } = useAuth(); // ✅ Get the logout function from the context
  // const navigate = useNavigate(); // No longer needed here

  // The handleLogout function now correctly uses the logout function from the context.
  // It could be simplified even further by calling logout directly in onClick.
  const handleLogout = async () => {
    try {
      await logout();
      // Navigation should be handled by a parent component that listens to the
      // isAuthenticated state, but if you need it here, you can add it back.
      // navigate('/login');
    } catch (error) {
      console.error("Failed to logout:", error);
      // Optionally, show an error toast to the user
    }
  };

  return (
    <aside className="w-64 bg-gray-900 text-gray-200 h-screen flex flex-col shadow-lg border-r border-gray-800">
      {/* ✅ Header */}
      <div className="p-6 border-b border-gray-800">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img
            src="https://ayamku-web.s3.us-east-1.amazonaws.com/ayamku-logo.svg"
            alt="Ayamku Logo"
          />
        </Link>
      </div>

      {/* ✅ Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center w-full px-4 py-3 rounded-xl transition-all duration-300 group
                ${
                  isActive
                    ? "bg-red-500 text-white shadow-md"
                    : "hover:bg-gray-800 hover:text-white text-gray-300"
                }`}
            >
              <Icon
                className={`w-5 h-5 mr-3 transition-colors duration-300
                ${
                  isActive
                    ? "text-white"
                    : "text-gray-400 group-hover:text-red-400"
                }`}
              />
              <span className="capitalize font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ✅ Logout Button */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout} // ✅ Use the updated logout handler
          className="flex items-center w-full px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-500 transition-all duration-300 shadow-md"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
