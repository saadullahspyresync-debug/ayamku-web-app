import { useTranslation } from "react-i18next";
import { Item } from "./types";

type MenuItemProps = {
  item: Item;
  activeCategory: string;
  onAddToCart: (item: Item) => void;
};

export const MenuItem = ({
  item,
  activeCategory,
  onAddToCart,
}: MenuItemProps) => {
  const { t } = useTranslation();
  const isOutOfStock = item.stockStatus === "out-of-stock" || item.stock === 0;
  const canAddToCart =
    item.stockStatus === "in-stock" ||
    (item.comboItems?.length > 0 && item.isCombo);

  return (
    <div
      className={`relative ${
        item.isCombo && activeCategory === "Deals"
          ? "border-2 border-ayamku-primary bg-red-50"
          : "border"
      } flex hover:bg-white cursor-pointer hover:shadow-md transition-all duration-300 ease-in p-2 rounded-xl ${
        isOutOfStock ? "opacity-60" : ""
      }`}
    >
      {item.isCombo && (
        <span className="absolute -top-3 -right-3 z-50 bg-ayamku-primary text-white px-3 py-1 rounded-bl-md rounded-tr-md text-[10px] font-semibold uppercase tracking-wide shadow-lg">
          {t("items.deal_badge")}
        </span>
      )}

      {isOutOfStock && (
        <span className="absolute top-2 left-2 z-50 bg-gray-800 text-white px-2 py-1 rounded text-[10px] font-semibold uppercase">
          Out of Stock
        </span>
      )}

      <div className="flex-1 p-2 flex flex-col justify-between">
        <div>
          <h3 className="text-[16px] font-bold text-gray-900 leading-5">
            {item.name}
          </h3>
          <p className="text-gray-500 text-[12px] mb-1 mt-1 leading-3">
            {item.description}
          </p>

          {item.isCombo && item.comboItems?.length > 0 && (
            <ul className="mt-2 text-[12px] text-gray-700 space-y-0.5">
              {item.comboItems.map((combo, idx) => (
                <li key={idx} className="flex items-center gap-1">
                  <span className="text-ayamku-primary font-semibold">
                    {combo.quantity}×
                  </span>
                  <span>{combo.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-4 mt-2">
          <span className="text-[18px] font-bold text-black">
            ${item.price}
          </span>
          {/* <span className="text-red-500 font-medium text-[12px]">
            {item.loyaltyPoints || 0} Points
          </span> */}
        </div>
      </div>

      <div className="relative flex-1 rounded-lg overflow-hidden">
        <img
          src={item.images?.[0]?.url || "/assets/images/placeholder.png"}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        {canAddToCart && (
          <div className="group bg-white/60 rounded-full w-36 h-36 absolute -right-20 -bottom-20">
            <button
              onClick={() => onAddToCart(item)}
              className="group-hover:bg-ayamku-primary absolute top-7 left-7 bg-black text-white w-7 h-7 rounded-full flex items-center justify-center transition"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
