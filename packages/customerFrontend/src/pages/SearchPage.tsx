import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useBranchStore } from "@/store/branchStore";
import { useCartStore } from "@/store/cartStore";
import { fetchBranchItems } from "@/services/api";
import { useDebounce } from "@/hooks/useDebounce"; // The hook from my first reply
import { BestFoodSection } from "./Home"; // Reuse your existing UI component!
import { useTranslation } from "react-i18next";
import { CartItem } from "@/store/cartStore";
import { Search, X } from "lucide-react";

const SearchPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const { selectedBranch } = useBranchStore();
  const { addItem } = useCartStore();
  
  const [allItems, setAllItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [localInput, setLocalInput] = useState(query)

  // Sync local input if URL changes (e.g. user types in Header)
  useEffect(() => {
    setLocalInput(query);
  }, [query]);
  
  // Debounce the URL query so we don't re-filter on every micro-change
  const debouncedQuery = useDebounce(localInput, 300);

  // Update URL as user types in the SearchPage input
  useEffect(() => {
    setSearchParams(debouncedQuery ? { q: debouncedQuery } : {}, { replace: true });
  }, [debouncedQuery, setSearchParams]);

  // Fetch all items for the selected branch (once on mount or branch change)
  useEffect(() => {
    const loadData = async () => {
      if (!selectedBranch?.branchId) return;
      setLoading(true);
      try {
        const { items } = await fetchBranchItems(selectedBranch.branchId);
        setAllItems(items || []);
      } catch (error) {
        console.error("Search fetch failed", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedBranch]);

  // 3. Filter items dynamically based on the debounced query
  const filteredItems = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    return allItems.filter((item) =>
      item.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(debouncedQuery.toLowerCase())
    );
  }, [debouncedQuery, allItems]);

  const handleAddToCart = (item: CartItem) => {
    addItem({
      itemId: item.itemId,
      id: item.itemId,
      name: item.name,
      price: item.price,
      images: item.images?.length ? [item.images[0]] : ["/assets/images/placeholder.png"],
      description: item.description || "",
      _id: item.itemId,
      stock: 1,
      isCombo: item.isCombo || false,
      comboItems: item.comboItems || [],
      loyaltyPoints: item.loyaltyPoints || 0,
      stockStatus: item.stockStatus,
      status: item.status,
      categoryId: item.categoryId,
      availableBranches: item.availableBranches,
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 min-h-screen">
      {/* Local Search Input for the Search Page */}
      <div className="relative mt-10 mb-8 max-w-2xl mx-auto focus-within:border-transparent outline-none transition-all">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={localInput}
          onChange={(e) => setLocalInput(e.target.value)}
          placeholder="Search..."
          className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl"
        />
        {localInput && (
          <button 
            onClick={() => setLocalInput("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {filteredItems.length > 0 ? (
        <BestFoodSection 
          items={filteredItems} 
          loading={false} 
          onAddToCart={handleAddToCart} 
          t={t} 
        />
      ) : (
        debouncedQuery && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
              <Search size={48} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-medium text-gray-900">No results found</h3>
            <p className="text-gray-500 mt-4">
              We couldn't find "<strong>{debouncedQuery}</strong>". <br />
              Try searching for 'Fries', 'Burger' or 'Pizza'
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default SearchPage;