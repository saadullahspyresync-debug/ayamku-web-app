import React from "react";
import { X, Plus, Minus } from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { placeOrder } from "../services/api";
import { useTranslation } from "react-i18next"; // ✅ import i18n
import i18n from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";

const Cart: React.FC = () => {
  const { t } = useTranslation(); // ✅ translation hook
  const {
    items,
    isOpen,
    removeItem,
    updateQuantity,
    getTotalPrice,
    toggleCart,
    setCartOpen,
    clearCart,
  } = useCartStore();

  const { isAuthenticated } = useAuth();

  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      setCartOpen(false);
      navigate("/auth/login");
      return;
    }

    try {
      navigate("/cart");
      setCartOpen(false);
    } catch (err) {
      console.error("Order failed", err);
      alert(t("cart.order_failed")); // ✅ translated
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={toggleCart}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">{t("cart.title")}</h2>
            <button
              onClick={toggleCart}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <X size={20} />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">{t("cart.empty")}</div>
                <div className="text-sm text-gray-500">
                  {t("cart.empty_subtext")}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg"
                  >
                    <img
                      src={
                        item.images[0]?.url ||
                        "/assets/images/placeholder.png"
                      }
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{item.name}</h3>
                      <div className="text-ayamku-primary font-semibold">
                        ${item.price}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="w-8 h-8 flex items-center justify-center border border-red-200 text-ayamku-primary rounded"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="w-8 h-8 flex items-center justify-center bg-ayamku-primary text-white rounded"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total and Checkout */}
          {items.length > 0 && (
            <div className="border-t p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">{t("cart.total")}</span>
                <span className="font-bold text-lg">
                  ${getTotalPrice().toFixed(2)}
                </span>
              </div>
              <Button
                onClick={handleCheckout}
                className="w-full bg-ayamku-primary hover:bg-red-600 text-white"
              >
                {isAuthenticated
                  ? t("cart.place_order")
                  : t("cart.login_to_order")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;
