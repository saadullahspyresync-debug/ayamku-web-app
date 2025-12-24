import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import OverviewTab from "./tabs/OverviewTab";
import BranchesTab from "./tabs/BranchesTab";
import MenuTab from "./tabs/MenuTab";
import PromotionsTab from "./tabs/PromotionsTab";
import HighlightsTab from "./tabs/HighlightsTab";

// ✅ New imports
import ProfileBadge from "../components/ProfileBadge";
import ProfilePage from "./ProfilePage";
import PointsTab from "./tabs/PointsTab";
import OrdersTab from "./tabs/OrdersTab";
import { ContactMessages } from "./tabs/ContactMessages";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // ✅ Renders the correct tab
  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab />;
      case "branches":
        return <BranchesTab />;
      case "menu":
        return <MenuTab />;
      case "promotions":
        return <PromotionsTab />;
      case "highlights":
        return <HighlightsTab />;
      // case "analytics":
      //   return <AnalyticsTab />;
      case "profile":
        return <ProfilePage />; // ✅ Added Profile Tab
      case "orders":
        return <OrdersTab />;
      case "points":
        return <PointsTab />;
        case "contact":
        return <ContactMessages />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* ✅ Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* ✅ Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* ✅ Top Header */}
        <header className="flex items-center justify-between px-8 py-4 bg-white shadow-sm border-b border-gray-200">
          <h1 className="text-2xl font-bold capitalize text-gray-800 tracking-wide">
            {activeTab}
          </h1>

          {/* ✅ Profile Badge for quick access */}
          {/* <ProfileBadge setActiveTab={setActiveTab} /> */}
        </header>

        {/* ✅ Main Tabs Content */}
        <section className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50">
          {renderTab()}
        </section>
      </main>
    </div>
  );
}
