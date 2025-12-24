import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MenuItem } from "./MenuItem";
import { Item } from "./types";

type MenuGridProps = {
  items: Item[];
  loading: boolean;
  activeCategory: string;
  handleAddToCart: (item: Item) => void;
};

export const MenuGrid = ({ items, loading, activeCategory, handleAddToCart }: MenuGridProps) => {
  const { t } = useTranslation();

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 mt-4 relative">
      {loading ? (
        <div className="absolute left-1/2 top-[100px] -translate-x-1/2 flex items-center justify-center gap-2 w-[70%] rounded-md px-1 py-1 bg-gray-200 text-gray-700">
          {t("items.loading")}
        </div>
      ) : items.length > 0 ? (
        items.map((food) => (
          <MenuItem
            key={food.itemId}
            item={food}
            activeCategory={activeCategory}
            onAddToCart={handleAddToCart}
          />
        ))
      ) : (
        <div className="absolute left-1/2 top-[100px] -translate-x-1/2 flex items-center justify-center gap-2 w-[70%] rounded-md px-1 py-1 bg-ayamku-primary text-white">
          <Info width={20} />
          <span>{t("items.no_items", { category: activeCategory })}</span>
        </div>
      )}
    </div>
  );
};