import React, { useState, useEffect } from "react";
import { getAllCategories } from "../../api/category";
import { getAllItems } from "../../api/item";
import { getAllDeals } from "../../api/deals";
import { getAllBranches } from "../../api/branch";
import { TabButtons } from "../../components/menu/TabButtons";
import { ItemsSection } from "../../components/menu/ItemsSection";
import { CategoriesSection } from "../../components/menu/CategoriesSection";
import { DealsSection } from "../../components/menu/DealsSection";
import { Loader } from "../../components/Loader";

export default function MenuTab() {
  const [tab, setTab] = useState("items");
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [deals, setDeals] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await getAllItems();
      setMenuItems(data.data);
    } catch (err) {
      console.error("Fetch items error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await getAllCategories();
      setCategories(data.data);
    } catch (err) {
      console.error("Fetch categories error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const { data } = await getAllDeals();
      setDeals(data.data);
    } catch (err) {
      console.error("Fetch deals error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const { data } = await getAllBranches();
      setBranches(data.data);
    } catch (err) {
      console.error("Fetch branches error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "items") {
      fetchItems();
      fetchBranches();
      fetchCategories();
    }
    if (tab === "categories") fetchCategories();
    if (tab === "deals") {
      fetchDeals();
      fetchItems();
    }
  }, [tab]);

  return (
    <div className="space-y-6 relative min-h-[400px]">
      {/* ✅ Always visible */}
      <TabButtons activeTab={tab} onTabChange={setTab} />

      {/* ✅ Loader overlays content area only */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px] animate-fade-in">
          <Loader tab={tab} />
        </div>
      ) : (
        <>
          {tab === "items" && (
            <ItemsSection
              menuItems={menuItems}
              categories={categories}
              branches={branches}
              onRefresh={fetchItems}
            />
          )}

          {tab === "categories" && (
            <CategoriesSection
              categories={categories}
              onRefresh={fetchCategories}
            />
          )}

          {tab === "deals" && (
            <DealsSection
              deals={deals}
              menuItems={menuItems}
              categories={categories}
              branches={branches}
              onRefresh={fetchDeals}
            />
          )}
        </>
      )}
    </div>
  );
}
