import { useCartStore } from "../../store/cartStore";
import { Button } from "../../components/ui/button";
import { Plus, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const CartSidebar = () => {
  const { t } = useTranslation();
  const { items: cartItems, updateQuantity, getTotalPrice } = useCartStore();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="lg:w-[36%]">
      <div className="sticky top-24">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-lg mb-4">{t("cart.title")}</h3>

          {cartItems.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">🛒</div>
              <p>{t("cart.empty_title")}</p>
              <p className="text-sm">{t("cart.empty_subtext_cart")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-h-96 overflow-y-auto space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <img
                      src={item.images?.[0]?.url || "/assets/images/placeholder.png"}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <div className="text-ayamku-primary font-semibold text-sm">
                        ${item.price}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center border border-red-200 text-ayamku-primary rounded text-sm"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center bg-ayamku-primary text-white rounded text-sm"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold">{t("cart.total")}</span>
                  <span className="font-bold text-lg text-ayamku-primary">
                    ${getTotalPrice().toFixed(2)}
                  </span>
                </div>
                <Button className="w-full bg-ayamku-primary hover:bg-red-600 text-white" onClick={() => {navigate("/cart")}}>
                   {isAuthenticated
                  ? t("cart.place_order")
                  : t("cart.login_to_order")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};