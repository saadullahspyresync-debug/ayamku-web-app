import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, MapPin, User, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext"; // ✅ replaced useAuthStore
import { useCartStore } from "../store/cartStore";
import { useBranchStore } from "../store/branchStore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import LanguageSelector from "./LanguageSelector";
import ProfileModal from "./ProfileModal";
import PointsBadge from "./PointsBadge";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  // ✅ replaced old auth store with new context
  const { isAuthenticated, user, logout } = useAuth();

  const { getTotalItems, toggleCart } = useCartStore();
  const { selectedBranch, setBranchModalOpen } = useBranchStore();

  const handleLogin = () => navigate("/auth/login");

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };
  const totalCartItems = getTotalItems();

  return (
    <>
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-16 sm:justify-between md:justify-normal justify-between">
            {/* Hamburger Menu */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 text-gray-600 hover:text-ayamku-primary transition-colors"
            >
              <Menu size={24} />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img
                src="https://ayamku-web.s3.us-east-1.amazonaws.com/ayamku-logo.svg"
                alt="Ayamku Logo"
              />
            </Link>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 items-center space-x-4 mx-5">
              <div className="relative w-full ml-4">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <img src="/assets/icons/search-icon.svg" />
                </div>
                <Input
                  type="text"
                  placeholder={t("find_food")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:border-ayamku-primary"
                />
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* Cart */}
              <button
                onClick={toggleCart}
                className="relative p-[7px] text-gray-600 hover:text-ayamku-primary border border-gray-200 rounded-lg"
              >
                <img src="/assets/icons/cart-basket-icon.svg" />
                {totalCartItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-ayamku-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalCartItems}
                  </span>
                )}
              </button>

              {/* Branch Selector */}
              <button
                onClick={() => setBranchModalOpen(true)}
                className="hidden lg:flex items-center space-x-1 text-sm text-gray-600 hover:text-ayamku-primary px-3 py-[9px] border border-gray-200 rounded-lg"
              >
                <MapPin size={16} />
                <span>
                  {selectedBranch ? selectedBranch.name : t("select_branch")}
                </span>
              </button>

              {/* Points Badge */}
               <PointsBadge />

              {/* Language Dropdown */}
              <LanguageSelector />

              {/* User / Login */}
              {isAuthenticated ? (
                <div className="hidden md:flex items-center space-x-2">
                  {/* <div className="flex items-center space-x-2 px-3 py-[9px] bg-ayamku-primary text-white rounded-lg border border-ayamku-primary"> */}
                  <Button
                    onClick={() => setIsProfileModalOpen(true)} // ✅ Open modal on click
                    className="flex items-center space-x-2 px-3 py-[9px] bg-ayamku-primary text-white rounded-lg border border-ayamku-primary hover:bg-red-600 transition-colors"
                  >
                    <User size={16} />
                    <span className="text-sm font-medium">
                      {user?.name || user?.username || t("user")}
                    </span>
                  </Button>
                </div>
              ) : (
                // </div>
                <Button
                  onClick={handleLogin}
                  className="bg-ayamku-primary hover:bg-red-600 text-white px-6"
                >
                  {t("login")}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        <div
          className={`fixed inset-0 z-50 transition-opacity duration-300 ${
            isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMenuOpen(false)}
          />

          <div
            className={`fixed left-0 top-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 ${
              isMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* User Info */}
            {isAuthenticated && (
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  {/* <Button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsProfileModalOpen(true); // ✅ Open profile modal from mobile menu
                  }}
                  className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                > */}
                  <div className="w-12 h-12 bg-ayamku-primary rounded-full flex items-center justify-center">
                    <User className="text-white" size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {user?.name || user?.username || t("user")}
                    </div>
                    <div className="text-sm text-gray-600">{user?.email}</div>
                  </div>
                  {/* </Button> */}
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-gray-600 hover:text-ayamku-primary"
                >
                  <X size={24} />
                </button>
              </div>
            )}

            <nav className="p-4">
              <Link
                to="/menu"
                className="flex items-center py-3 px-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("explore_menu.title")}
              </Link>

              <Link
                to="/contact"
                className="flex items-center py-3 px-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("restaurant_locator")}
              </Link>

              <Link
                to="/about"
                className="flex items-center py-3 px-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("about_us.title")}
              </Link>

              <Link
                to="/contact"
                className="flex items-center py-3 px-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("contact_us")}
              </Link>

              {/* Logout */}
              {isAuthenticated && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={handleLogout}
                    className="bg-ayamku-primary hover:bg-red-600 text-white w-full"
                  >
                    {t("logout")}
                  </Button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* ✅ Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
      />
    </>
  );
};

export default Header;
