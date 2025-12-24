import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext"; // ✅ Import useAuth
import {
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

export default function ProfileBadge({ setActiveTab } : { setActiveTab: (tab: string) => void }) {
  const { user, isAuthenticated, logout } = useAuth(); // ✅ Get user and logout from context
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e : any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Render the component only if the user is authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-all focus:outline-none"
      >
        {/* <img
          // ✅ You can add a user avatar URL to your Cognito user attributes if you have one
          src={
            "../../public/images/close-up-portrait-curly-handsome-european-male.jpg"
          }
          alt="avatar"
          className="w-9 h-9 rounded-full border border-gray-300"
        /> */}
        <span className="hidden md:inline text-sm font-medium text-gray-800">
          {user?.name || "User"} {/* ✅ Use real user name */}
        </span>
        <ChevronDownIcon
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 animate-fadeIn">
          {/* Profile Info */}
          <div className="px-4 py-3 bg-gray-50 border-b">
            <p className="text-sm font-semibold text-gray-800">
              {user?.name || "User"} {/* ✅ Use real user name */}
            </p>
            <p className="text-xs text-gray-500">
              {user?.email || "user@example.com"} {/* ✅ Use real user email */}
            </p>
          </div>

          {/* View Profile */}
          <button
            onClick={() => {
              setActiveTab("profile");
              setOpen(false);
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
          >
            <UserCircleIcon className="w-5 h-5 mr-2 text-gray-500" />
            View Profile
          </button>

          {/* Logout */}
          <button
            onClick={logout} // ✅ Use logout from context
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2 text-red-500" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
