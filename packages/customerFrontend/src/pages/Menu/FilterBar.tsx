import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRef, useState, useEffect } from "react";

type FilterBarProps = {
  categories: string[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  activeFiltersCount: number;
  sortBy: string;
  setSortBy: (sort: string) => void;
};

export const FilterBar = ({
  categories,
  activeCategory,
  setActiveCategory,
  showFilters,
  setShowFilters,
  activeFiltersCount,
  sortBy,
  setSortBy,
}: FilterBarProps) => {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position
  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", updateScrollButtons);
      window.addEventListener("resize", updateScrollButtons);
      return () => {
        container.removeEventListener("scroll", updateScrollButtons);
        window.removeEventListener("resize", updateScrollButtons);
      };
    }
  }, [categories]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="space-y-4 mt-6">
      {/* Categories Section */}
      <div className="bg-white border rounded-2xl shadow-sm p-4">
        <div className="relative px-12">
          {/* Left Scroll Button */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute -left-1 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-50 border border-gray-300 rounded-full p-2.5 shadow-md transition-all duration-200 hover:shadow-lg"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} className="text-gray-700" />
            </button>
          )}

          {/* Categories Tabs with visible scrollbar */}
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto scroll-smooth pb-2 custom-scrollbar"
          >
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
              <TabsList className="bg-white shadow-sm border inline-flex w-max min-w-full">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <TabsTrigger
                      key={category}
                      value={category}
                      className="data-[state=active]:bg-ayamku-primary data-[state=active]:text-white whitespace-nowrap px-6 py-2.5 text-sm font-medium transition-all"
                    >
                      {category === "All" ? t("categories.all") : category}
                    </TabsTrigger>
                  ))
                ) : (
                  <span className="px-4 py-2 text-gray-500">{t("categories.no_categories")}</span>
                )}
              </TabsList>
            </Tabs>
          </div>

          {/* Right Scroll Button */}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute -right-1 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-50 border border-gray-300 rounded-full p-2.5 shadow-md transition-all duration-200 hover:shadow-lg"
              aria-label="Scroll right"
            >
              <ChevronRight size={20} className="text-gray-700" />
            </button>
          )}
        </div>
      </div>

      {/* Filters and Sort Section */}
      <div className="bg-white border rounded-2xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              showFilters
                ? "bg-ayamku-primary text-white border-ayamku-primary shadow-md"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
            }`}
          >
            <SlidersHorizontal size={16} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-white/20 text-white px-2 py-0.5 text-xs rounded-full font-semibold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 sm:flex-initial px-3 py-2 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-ayamku-primary focus:border-transparent transition"
            >
              <option value="default">Default</option>
              <option value="price-low">Price: Low → High</option>
              <option value="price-high">Price: High → Low</option>
              <option value="name-asc">Name: A → Z</option>
              <option value="name-desc">Name: Z → A</option>
            </select>
          </div>
        </div>
      </div>

      <style>{`
        /* Custom scrollbar styling */
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
          margin: 0 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 10px;
          transition: background 0.3s;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }

        /* Firefox scrollbar */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e0 #f1f1f1;
        }
      `}</style>
    </div>
  );
};