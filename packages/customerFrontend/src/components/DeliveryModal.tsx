import React, { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { useDeliveryStore } from "../store/deliveryStore";
import { useBranchStore } from "../store/branchStore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { fetchBranches } from "../services/api";
import { useTranslation } from "react-i18next";
import { DateTime } from "luxon";

const DeliveryModal: React.FC = () => {
  const { t } = useTranslation();

  const {
    deliveryType,
    selectedCity,
    selectedBranch,
    isDeliveryModalOpen,
    setDeliveryType,
    setSelectedCity,
    setSelectedBranch,
    setDeliveryModalOpen,
  } = useDeliveryStore();

  const {
    branches,
    setBranches,
    setSelectedBranch: setStoreBranch,
  } = useBranchStore();
  const [activeTab, setActiveTab] = useState<"delivery" | "online">("online");
  const [tempSelected, setTempSelected] = useState<string>(
    selectedBranch || ""
  );

  const isBranchOpenNow = (branch: any): boolean => {
    if (!branch?.businessHours || !branch?.timezone ) return false;

    // 1. Get current time SPECIFIC to the branch timezone
    // This ignores the customer's phone time and gets the real time at the branch
    const branchNow = DateTime.now().setZone(branch.timezone);
    
    const currentDay = branchNow.weekday; // Luxon: 1=Mon, 5=Fri, 7=Sun
    const currentMinutes = branchNow.hour * 60 + branchNow.minute;

    const toMinutes = (time: string) => {
      if (!time) return 0;
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

    let openTimeStr: string;
    let closeTimeStr: string;

    // Luxon uses 5 for Friday. Match your logic:
    if (currentDay === 5) {
      if (branch.businessHours.friday?.isClosed) return false;
      openTimeStr = branch.businessHours.friday.open;
      closeTimeStr = branch.businessHours.friday.close;
    } else {
      openTimeStr = branch.businessHours.open;
      closeTimeStr = branch.businessHours.close;
    }

    if (!openTimeStr || !closeTimeStr) return false;

    const openMin = toMinutes(openTimeStr);
    const closeMin = toMinutes(closeTimeStr);

    // 2. Overnight logic (same as yours, but using branch local minutes)
    if (closeMin < openMin) {
      return currentMinutes >= openMin || currentMinutes <= closeMin;
    }
    return currentMinutes >= openMin && currentMinutes <= closeMin;
  };

  const getDisplayTiming = (branch: any): string => {
    const now = new Date();
    const isFriday = now.getDay() === 5; // 5 is Friday
    
    const hours = branch.businessHours;

    if (isFriday && hours?.friday) {
      if (hours.friday.isClosed) return "";
      return `${hours.friday.open} - ${hours.friday.close} `;
    }

    // Default for Monday - Thursday (and weekends based on your current setup)
    if (hours?.open && hours?.close) {
      return `${hours.open} - ${hours.close} `;
    }

    return branch.timing || "No timing available";
  };

  // ✅ Load branches list on mount
  useEffect(() => {
    const loadBranches = async () => {
      if (branches.length === 0) {
        try {
          const data = await fetchBranches();
          setBranches(data);
        } catch (err) {
          console.error("Failed to load branches", err);
        }
      }
    };
    loadBranches();
  }, [branches.length, setBranches]);

 const handleDeliveryClick = () => {
  setDeliveryType("delivery");
  // window.location.href = "https://www.gomamam.com/";
  setDeliveryModalOpen(false);
};


  const handlePickupSubmit = async () => {
    if (selectedCity && tempSelected) {
      // ✅ Find the selected branch object
      const branch = branches.find((b) => b.branchId === tempSelected);

      if (branch) {
        // ✅ Update the branch store (this will trigger API calls in BranchSelector logic)
        setStoreBranch(branch);

        // ✅ Update delivery store
        setSelectedBranch(tempSelected);
        setDeliveryType("online");

        setDeliveryModalOpen(false);
      }
    }
  };

  const handleCurrentLocation = () => {
    setSelectedCity(t("deliveryModal.current"));
  };

  const isSubmitDisabled =
    activeTab === "online" && (!selectedCity || !tempSelected);

  if (!isDeliveryModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" />
      <div className="relative bg-white rounded-lg w-full max-w-md mx-4 overflow-hidden">
        {/* Tabs */}
        <div className="flex">
          <button
            onClick={() => setActiveTab("delivery")}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab === "delivery"
                ? "bg-ayamku-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t("deliveryModal.delivery")}
          </button>
          <button
            onClick={() => setActiveTab("online")}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab === "online"
                ? "bg-ayamku-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t("deliveryModal.online")}
          </button>
        </div>

        <div className="p-6">
          {activeTab === "delivery" ? (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-ayamku-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {t("deliveryModal.delivery_service")}
                </h3>
                <p className="text-gray-600">
                  {t("deliveryModal.delivery_desc")}
                </p>
              </div>
              <Button
                onClick={handleDeliveryClick}
                className="w-full bg-ayamku-primary hover:bg-ayamku-primary/80 text-white"
                disabled={true}
              >
                {t("deliveryModal.continue_delivery")}
              </Button>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {t("deliveryModal.pickup_location")}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("deliveryModal.city_region")}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder={t("deliveryModal.enter_city")}
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleCurrentLocation}
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      <MapPin size={16} className="mr-1" />
                      {t("deliveryModal.current")}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("deliveryModal.select_branch")}
                  </label>
                  {branches.length === 0 ? (
                    <div className="w-full p-3 border border-gray-300 rounded-md text-center text-gray-500">
                      {t("deliveryModal.no_branches")}
                    </div>
                  ) : (
                    <select
                      value={tempSelected}
                      onChange={(e) => setTempSelected(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-ayamku-primary focus:border-transparent"
                    >
                      <option value="">
                        {t("deliveryModal.choose_branch")}
                      </option>

                      {branches.map((branch) => {
                        const open = isBranchOpenNow(branch);
                        return (
                          <option
                            key={branch.branchId}
                            value={branch.branchId}
                            // disabled={!open} // 🚫 Disable closed branches
                          >
                            {branch.name} – {getDisplayTiming(branch)}
                            {open ? "- Open" : "- Closed"}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                <Button
                  onClick={handlePickupSubmit}
                  disabled={isSubmitDisabled}
                  className="w-full bg-ayamku-primary hover:bg-ayamku-primary/80 text-white disabled:bg-gray-300"
                >
                  {t("deliveryModal.select")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryModal;
