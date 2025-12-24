import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useBranchStore } from "../store/branchStore";
import { Button } from "./ui/button";
import { fetchBranches } from "../services/api";
import { useTranslation } from "react-i18next"; // ✅ import i18n
import { toast } from "sonner";

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
    selectedBranch?.id || ""
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
  // const currentDay = 5;

  if (currentDay !== 5) return null; // only show on Friday

  // Get branches with Friday closing info
  const branchesWithFridayHours = branches.filter(
    (b) => b.businessHours?.friday && !b.businessHours.friday.isClosed
  );

  if (branchesWithFridayHours.length === 0) return null;

  // Create a text summary, e.g.:
  // "We are not serving on Friday during 14:00–18:00"
  // If branches have different hours, show multiple lines
  const lines = branchesWithFridayHours.map((b) => {
    const f = b.businessHours.friday;
    return `${b.name}: ${f.open}–${f.close}`;
  });

  return (
    <div className="bg-red-500 text-white text-center py-3 text-sm">
      <p className="font-semibold">We are not serving on Friday during:</p>
      {lines.map((line, i) => (
        <p key={i} className="text-xs opacity-90">{line}</p>
      ))}
    </div>
  );
};


  const handleSelect = () => {
    const branch = branches.find((b) => b.id === tempSelected);
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

  // ✅ Helper: Determine if branch is open right now
  const isBranchOpenNow = (branch: any): boolean => {
    if (!branch?.businessHours) return false;

    const now = new Date();

    // 🧪 For testing
    // const currentDay = 5; // 0 = Sunday, 5 = Friday
    // const currentTime = "13:00"; // "HH:MM"

    const currentDay = now.getDay(); // 0 = Sunday, 5 = Friday
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

    const hours = branch.businessHours;

    // ⏱️ Helper to convert "HH:MM" → total minutes
    const toMinutes = (time: string) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

    const currentMinutes = toMinutes(currentTime);

    // 🕌 FRIDAY logic → closed during given hours
    if (currentDay === 5) {
      const friday = hours.friday;

      if (!friday) return false;

      // If marked fully closed → closed all day
      if (friday.isClosed) return false;

      // If current time is within Friday close period → branch is closed
      const fridayOpen = toMinutes(friday.open);
      const fridayClose = toMinutes(friday.close);

      if (currentMinutes >= fridayOpen && currentMinutes <= fridayClose) {
        return false; // ❌ Closed during Friday close hours
      }
    }

    // 📅 Normal open hours logic (outside Friday close window)
    if (!hours.open || !hours.close) return false;

    const openMinutes = toMinutes(hours.open);
    const closeMinutes = toMinutes(hours.close);

    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  };

  if (!isBranchModalOpen) return null;

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
        <div className="space-y-3 mb-6 px-3 min-h-40 max-h-90 overflow-y-auto">
          {branches.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              {t("branch_selector.no_branches")}
            </p>
          ) : (
            branches.map((branch) => {
              const isOpen = isBranchOpenNow(branch);
              return (
                <div
                  key={branch.id}
                 onClick={() => {
                    if (!isOpen) {
                      toast.error(`${branch.name} is currently closed`);
                      return; // ❌ prevent selection
                    }
                    setTempSelected(branch.id); // ✅ only select if open
                  }}
                  className={`flex justify-between items-center border p-3 rounded cursor-pointer transition-colors ${
                    tempSelected === branch.id
                      ? "bg-red-50 border-red-300"
                      : "bg-gray-50 hover:bg-gray-100"
                   } ${!isOpen ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{branch.name}</span>
                    <span className="text-xs text-gray-500">
                      {branch.address}
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-medium ${
                        isBranchOpenNow(branch)
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {isBranchOpenNow(branch)
                        ? t("branch_selector.open")
                        : t("branch_selector.closed")}
                    </span>

                    <div className="text-xs text-gray-500">
                      {branch.timing
                        ? branch.timing
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
