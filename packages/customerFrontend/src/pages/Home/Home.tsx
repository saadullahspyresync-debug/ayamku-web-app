import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "@/store/cartStore";
import { useBranchStore } from "@/store/branchStore";
import { useDeliveryStore } from "@/store/deliveryStore";
import { fetchBranchItems, fetchSeasonalHighlights, fetchSliders } from "@/services/api";
import { useTranslation } from "react-i18next";

import DeliveryModal from "@/components/DeliveryModal";
import PromotionsSlider from "@/components/PromotionSlider";
import HeroSection from "./HeroSection";
import WhyChooseSection from "./WhyChooseSection";
import ExploreMenuSection from "./ExploreMenuSection";
import BestFoodSection from "./BestFoodSection";
import RewardsWidget from "@/components/RewardsWidget";
import HighlightsPopup from "./HighlightsPopup";
import ModernLoader from "@/components/Loader";


const Home: React.FC = () => {
  const { addItem } = useCartStore();
  const { selectedBranch, clearSelectedBranch } = useBranchStore();
  const { setDeliveryModalOpen, isDeliveryModalOpen } = useDeliveryStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [sliders, setSliders] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // reset branch on load
  // useEffect(() => {
  //   clearSelectedBranch();
  // }, [clearSelectedBranch]);

  // fetch data
  useEffect(() => {
    const loadBranchData = async () => {
      if (!selectedBranch?.branchId) {
        setDeliveryModalOpen(true);
        return;
      }
      setLoading(true);
      try {
        const { items, categories } = await fetchBranchItems(selectedBranch.branchId);
        setItems(items.sort((a, b) => b.loyaltyPoints - a.loyaltyPoints));
        setCategories(categories || []);
      } catch (error) {
        console.error("Failed to fetch branch items:", error);
        setItems([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    const loadSliders = async () => {
      try {
        const res = await fetchSliders();
        setSliders(res || []);
      } catch (error) {
        console.error("❌ Failed to load sliders:", error);
      } finally {
        setLoading(false);
      }
    }

    const loadHighlights = async () => {
      try {
        const res = await fetchSeasonalHighlights();
        setHighlights(res || []);
      } catch (error) {
        console.error("❌ Failed to load sliders:", error);
      } finally {
        setLoading(false);
      }
    }

    loadHighlights();
    loadSliders();
    loadBranchData();
  }, [selectedBranch, setDeliveryModalOpen]);

  const handleAddToCart = (item : any) => {
    addItem({
      itemId: item.itemId,
      id: item.itemId,
      name: item.name,
      price: item.price,
      images: item.images?.length ? [item.images[0]] : ["/assets/images/placeholder.png"],
      description: item.description,
      _id: item.itemId || Math.random().toString(),
      stock: 1,
      isCombo: false,
      comboItems: [],
      loyaltyPoints: item.loyaltyPoints || 0,
      stockStatus: "available",
      status: "active",
      categoryId: item.categoryId,
      availableBranches: [],
    });
  };

  // Show nothing (only modal) if no branch selected
  if (!selectedBranch) {
    return (
      <div className="min-h-screen">
        {isDeliveryModalOpen && <DeliveryModal />}
      </div>
    );
  }


  // Show loader only when branch is selected and data is loading
  if (selectedBranch && loading) {
    return <ModernLoader message="Loading delicious content..." />;
  }

  return (
    <div className="min-h-screen">
      {isDeliveryModalOpen && <DeliveryModal />}
      <HeroSection t={t} navigate={navigate} sliders={sliders} />
      <HighlightsPopup highlights={highlights} onOrderClick={() => navigate("/menu")}/>
      <WhyChooseSection t={t} />
      <ExploreMenuSection t={t} categories={categories} loading={loading} />
      <BestFoodSection t={t} items={items} loading={loading} onAddToCart={handleAddToCart} />
       {/* <RewardsWidget /> */}
      <PromotionsSlider />
    </div>
  );
};

export default Home;
