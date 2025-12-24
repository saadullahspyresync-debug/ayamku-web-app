import { X } from "lucide-react";

type FilterPanelProps = {
  showFilters: boolean;
  mealTypeFilter: string;
  setMealTypeFilter: (filter: string) => void;
  stockFilter: string;
  setStockFilter: (filter: string) => void;
  activeFiltersCount: number;
  resetFilters: () => void;
};

export const FilterPanel = ({
  showFilters,
  mealTypeFilter,
  setMealTypeFilter,
  stockFilter,
  setStockFilter,
  activeFiltersCount,
  resetFilters,
}: FilterPanelProps) => {
  return (
    <div
      className={`transition-all duration-300 overflow-hidden ${
        showFilters ? "max-h-[600px]" : "max-h-0"
      }`}
    >
      <div className="bg-gray-50 border border-t-0 rounded-b-2xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h4 className="font-semibold text-gray-800">Filter By</h4>
          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100 hover:bg-red-200 transition"
            >
              <X size={14} />
              Reset Filters
            </button>
          )}
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Meal Type</h4>
            <div className="flex flex-col gap-2">
              {[
                { label: "All Items", value: "all" },
                { label: "Individual Items", value: "individual" },
                { label: "Combo Meals", value: "combo" },
                { label: "Family Meals", value: "family" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-ayamku-primary transition"
                >
                  <input
                    type="radio"
                    name="mealType"
                    value={opt.value}
                    checked={mealTypeFilter === opt.value}
                    onChange={(e) => setMealTypeFilter(e.target.value)}
                    className="text-ayamku-primary focus:ring-ayamku-primary"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Availability</h4>
            <div className="flex flex-col gap-2">
              {[
                { label: "All Items", value: "all" },
                { label: "In Stock Only", value: "in-stock" },
                { label: "Out of Stock", value: "out-of-stock" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-ayamku-primary transition"
                >
                  <input
                    type="radio"
                    name="stockFilter"
                    value={opt.value}
                    checked={stockFilter === opt.value}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className="text-ayamku-primary focus:ring-ayamku-primary"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};