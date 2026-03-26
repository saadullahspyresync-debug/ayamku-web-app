import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useBranchStore } from "../store/branchStore";
import { Button } from "./ui/button";
import { fetchBranches } from "../services/api";
import { useTranslation } from "react-i18next"; // ✅ import i18n
import { toast } from "sonner";
import { DateTime } from "luxon";

const BranchSelector: React.FC = () => {
  const {
    branches,
    selectedBranch,
    isBranchModalOpen,
    setSelectedBranch,
    setBranchModalOpen,
    setBranches,
  } = useBranchStore();

  const [tempSelected, setTempSelected] = useState<string>(
    selectedBranch?.branchId || ""
  );
  const { t } = useTranslation(); // ✅ use translation hook

  // ✅ Fetch branches on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchBranches();
        setBranches(data);
      } catch (err) {
        console.error("Failed to fetch branches", err);
      }
    })();
  }, [setBranches]);


  const getFridayNotice = () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 5 = Friday

    if (currentDay !== 5) return null; // Only show on Friday

    // ✅ FIX: Filter for branches that have Friday hours AND are CURRENTLY CLOSED
    const closedFridayBranches = branches.filter(
      (b) => b.businessHours?.friday && !b.businessHours.friday.isClosed && !isBranchOpenNow(b)
    );

    // If all branches are currently open, don't show the red banner at all
    if (closedFridayBranches.length === 0) return null;

    return (
      <div className="bg-red-500 text-white text-center py-3 text-sm">
        <p className="font-semibold">Our business hours for Friday:</p>
        {closedFridayBranches.map((b, i) => {
          const f = b.businessHours.friday;
          return (
            <p key={i} className="text-xs opacity-90">
              {b.name}: {f.open} – {f.close}
            </p>
          );
        })}
      </div>
    );
  };

  const handleSelect = () => {
    const branch = branches.find((b) => b.branchId === tempSelected);
    if (branch) setSelectedBranch(branch);
    setBranchModalOpen(false);
  };

  // ✅ Auto-refresh every minute (optional)
  useEffect(() => {
    const interval = setInterval(() => {
      setBranches([...branches]);
    }, 60000);
    return () => clearInterval(interval);
  }, [branches, setBranches]);

  const isBranchOpenNow = (branch: any): boolean => {
    if (!branch?.businessHours || !branch?.timezone) return false;

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


  if (!isBranchModalOpen) return null;

  const isOpen = isBranchOpenNow(branches);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={() => setBranchModalOpen(false)}
      />

      <div className="relative bg-white rounded-[20px] overflow-hidden w-full max-w-md mx-4">
        {/* Close button */}
        <button
          onClick={() => setBranchModalOpen(false)}
          className="absolute right-2 top-1 p-2"
        >
          <X size={20} color="gray" />
        </button>

        {/* Header notice */}
        <div>
         <div>{getFridayNotice()}</div>


          <div className="flex justify-between items-center p-3 border-b">
            <span className="font-semibold">
              {t("branch_selector.branch_name")}
            </span>
            <span className="font-semibold">{t("branch_selector.status")}</span>
          </div>
        </div>

        {/* Branch List */}
        <div className="space-y-3 mb-6 px-3 max-h-[450px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {branches.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              {t("branch_selector.no_branches")}
            </p>
          ) : (
            branches.map((branch) => {
              const isOpen = isBranchOpenNow(branch);
              return (
                <div
                  key={branch.branchId}
                 onClick={() => {
                    // if (!isOpen) {
                    //   toast.error(`${branch.name} is currently closed`);
                    //   return; // ❌ prevent selection
                    // }
                    setTempSelected(branch.branchId); // ✅ only select if open
                  }}
                  className={`flex justify-between items-center border p-3 rounded cursor-pointer transition-colors ${
                    tempSelected === branch.branchId
                      ? "bg-red-50 border-red-300"
                      : "bg-gray-50 hover:bg-gray-100"
                    }`} //} ${!isOpen ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{branch.name}</span>
                    <span className="text-xs text-gray-500">
                      {branch.address}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className={`text-sm font-medium ${isOpen ? "text-green-600" : "text-red-600"}`}>
                      {isOpen ? t("branch_selector.open") : t("branch_selector.closed")}
                    </span>

                    <div className="text-xs text-gray-500">
                      {branch.timing
                        ? getDisplayTiming(branch)
                        : t("branch_selector.no_timing_available")}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Confirm button */}
        <div className="px-4 mb-4 flex items-center justify-center">
          <Button
            onClick={handleSelect}
            className="bg-ayamku-primary hover:bg-red-600 text-white w-full"
            disabled={!tempSelected}
          >
            {t("branch_selector.select")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BranchSelector;
