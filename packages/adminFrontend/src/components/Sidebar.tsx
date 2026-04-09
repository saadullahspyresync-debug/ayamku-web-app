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
  UsersIcon,
  SwatchIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

export default function Sidebar({ activeTab, setActiveTab } : any) {
  const { user, logout } = useAuth(); 

  const navItems = [
  { id: "overview", label: "Overview", icon: HomeIcon, roles: ["Admin"] },
  { id: "branches", label: user?.role === "Admin" ? "Branches" : "My Branch" , icon: BuildingStorefrontIcon, roles: ["Admin", "Branch_Manager"] },
  { id: "branch manager", label: "Branch Manager", icon: UsersIcon, roles: ["Admin"]  },
  { id: "menu", label: "Menu", icon: Squares2X2Icon, roles: ["Admin"]  },
  { id: "promotions", label: "Promotions", icon: MegaphoneIcon, roles: ["Admin"]  },
  { id: "orders", label: "Orders", icon: ShoppingBagIcon, roles: ["Admin", "Branch_Manager"] },
  { id: "points", label: "Points", icon: ChartBarIcon, roles: ["Admin", "Branch_Manager"] },
  { id: "highlights", label: "Highlights", icon: SparklesIcon, roles: ["Admin"]  },
  { id: "contact", label: "Contact Requests", icon: UserGroupIcon, roles: ["Admin", "Branch_Manager"]  },
  { id: "theme", label: "Theme", icon: SwatchIcon, roles: ["Admin"]  },
  { id: "why", label: "Why Us", icon: SparklesIcon, roles: ["Admin"]  },
  { id: "footer", label: "Footer Settings", icon: UserGroupIcon, roles: ["Admin"]  },
];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to logout:", error);
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
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {navItems
        .filter((item) => item.roles.includes(user?.role ?? ""))
        .map((item) => {
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
