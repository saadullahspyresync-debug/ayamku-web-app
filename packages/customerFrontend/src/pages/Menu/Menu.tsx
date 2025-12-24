import React, { useEffect, useState } from "react";
import { useBranchStore } from "@/store/branchStore";
import { useTranslation } from "react-i18next";
import { fetchBranchItems } from "@/services/api";
import { useCartStore } from "@/store/cartStore";
import { Category, Item } from "./types";
import { HeroBanner } from "./HeroBanner";
import { Loader } from "./Loader";
import { FilterBar } from "./FilterBar";
import { FilterPanel } from "./FilterPanel";
import { MenuGrid } from "./MenuGrid";
import { CartSidebar } from "./CartsSidebar";
import { useLocation } from "react-router-dom";

const Menu = () => {
  const { t } = useTranslation();
  const { addItem } = useCartStore();
  const { selectedBranch } = useBranchStore();

  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [mealTypeFilter, setMealTypeFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [categories1, setCategories] = useState<string[]>([]);
  const [menuItems1, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoriesData, setCategoriesData] = useState([]);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.category) {
      setActiveCategory(location.state.category);
    }
  }, [location.state]);

//   useEffect(() => {
//     const store = useCartStore.getState();
//     store.clearCart();
//     // useCartStore.persist.clearStorage();
// }, []);

  useEffect(() => {
    const loadBranchItems = async () => {
      if (!selectedBranch?.branchId) return;
      setLoading(true);
      try {
        const { items, categories } = await fetchBranchItems(selectedBranch.branchId);
        setMenuItems(items || []);
        setCategoriesData(categories || []);
        setCategories(["All", ...categories.map((c: Category) => c.name)]);
      } catch (error) {
        console.error("❌ Failed to load branch items:", error);
      } finally {
        setLoading(false);
      }
    };
    loadBranchItems();
  }, [selectedBranch]);

  const getMealType = (item: Item) => {
    if (item.isCombo) {
      const isFamily = item.comboItems && item.comboItems.length >= 4;
      const hasFamilyInName = item.name.toLowerCase().includes("family");
      return isFamily || hasFamilyInName ? "family" : "combo";
    }
    return "individual";
  };

  const getFilteredAndSortedItems = () => {
    let filtered = menuItems1;

    if (activeCategory === "Deals") {
      filtered = filtered.filter((item) => item.isCombo);
    } else if (activeCategory !== "All") {
      const selectedCategory = categoriesData.find(
        (cat) => cat.name === activeCategory
      );
      if (selectedCategory) {
        filtered = filtered.filter(
          (item) => item.categoryId === selectedCategory._id
        );
      }
    }

    if (mealTypeFilter !== "all") {
      filtered = filtered.filter(
        (item) => getMealType(item) === mealTypeFilter
      );
    }

    if (stockFilter === "in-stock") {
      filtered = filtered.filter(
        (item) => item.stockStatus === "in-stock" && item.stock > 0
      );
    } else if (stockFilter === "out-of-stock") {
      filtered = filtered.filter(
        (item) => item.stockStatus === "out-of-stock" || item.stock === 0
      );
    }

    const sorted = [...filtered];
    switch (sortBy) {
      case "price-low":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }
    return sorted;
  };

  const handleAddToCart = (item: Item) => {
    addItem({
      itemId: item.itemId,
      _id: item.itemId,
      id: item.itemId,
      name: item.name,
      price: item.price,
      images: item.images?.length
        ? [item.images[0]]
        : ["/assets/images/placeholder.png"],
      description: item.description,
      stock: item.stock,
      isCombo: item.isCombo,
      comboItems: item.comboItems,
      loyaltyPoints: item.loyaltyPoints,
      stockStatus: item.stockStatus,
      status: item.status,
      categoryId: item.categoryId,
      availableBranches: item.availableBranches,
    });
  };

  const resetFilters = () => {
    setSortBy("default");
    setMealTypeFilter("all");
    setStockFilter("all");
  };

  const activeFiltersCount = [
    sortBy !== "default",
    mealTypeFilter !== "all",
    stockFilter !== "all",
  ].filter(Boolean).length;

  const itemsToShow = getFilteredAndSortedItems();

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroBanner />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <FilterBar
              categories={categories1}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              activeFiltersCount={activeFiltersCount}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />

            <FilterPanel
              showFilters={showFilters}
              mealTypeFilter={mealTypeFilter}
              setMealTypeFilter={setMealTypeFilter}
              stockFilter={stockFilter}
              setStockFilter={setStockFilter}
              activeFiltersCount={activeFiltersCount}
              resetFilters={resetFilters}
            />

            <div className="mt-4 text-sm text-gray-600">
              Showing {itemsToShow.length} item{itemsToShow.length !== 1 ? "s" : ""}
            </div>

            <MenuGrid
              items={itemsToShow}
              loading={loading}
              activeCategory={activeCategory}
              handleAddToCart={handleAddToCart}
            />
          </div>

          <CartSidebar />
        </div>
      </div>
    </div>
  );
};

export default Menu;