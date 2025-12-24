import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Star,
  TrendingUp,
} from "lucide-react";

type Category = {
  _id: string;
  name: string;
};

type Item = {
  itemId: string;
  _id: string;
  name: string;
  description?: string;
  price: number;
  loyaltyPoints: number;
  images?: { url: string }[];
  categoryId?: Category;
};

interface BestFoodSliderProps {
  items: Item[];
  loading: boolean;
  t: (key: string) => string;
  onAddToCart: (item: Item) => void;
}

const BestFoodSlider: React.FC<BestFoodSliderProps> = ({
  items,
  loading,
  t,
  onAddToCart,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [itemsPerView, setItemsPerView] = useState(3);
  const [addingItem, setAddingItem] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Responsive items per view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2);
      } else {
        setItemsPerView(3);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto play functionality
  useEffect(() => {
    if (!items || items.length <= itemsPerView) return;

    const autoPlay = () => {
      handleNext();
    };

    autoPlayRef.current = setInterval(autoPlay, 3000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [items, itemsPerView, currentIndex]);

  const maxIndex = Math.max(0, (items?.length || 0) - itemsPerView);

  const handlePrevious = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleAddToCart = (item: Item) => {
    setAddingItem(item.itemId);
    onAddToCart(item);
    setTimeout(() => setAddingItem(null), 600);
  };

  const handleMouseEnter = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (items && items.length > itemsPerView) {
      autoPlayRef.current = setInterval(() => {
        handleNext();
      }, 6000);
    }
  };

  const getImageUrl = (item: Item): string => {
  const { images } = item || {};

  if (Array.isArray(images) && images.length > 0) {
    const firstImage = images[0];

    if (typeof firstImage === "string") {
      return firstImage;
    }

    if (typeof firstImage === "object" && firstImage?.url) {
      return firstImage.url;
    }
  }

  return "/assets/images/placeholder.png";
};


  if (loading) {
    return (
      <div className="text-center text-gray-500 py-8">
        <div className="animate-pulse">Loading delicious items...</div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">No items available</div>
    );
  }

  const showNavigation = items.length > itemsPerView;

  return (
    <div
      className="relative px-8 md:px-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Navigation Buttons */}
      {showNavigation && (
        <>
          <button
            onClick={handlePrevious}
            disabled={isAnimating}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700 group-hover:text-red-600 transition-colors" />
          </button>

          <button
            onClick={handleNext}
            disabled={isAnimating}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6 text-gray-700 group-hover:text-red-600 transition-colors" />
          </button>
        </>
      )}

      {/* Slider Container */}
      <div className="overflow-hidden" ref={sliderRef}>
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
          }}
        >
          {items.map((item, index) => (
            <div
              key={item.itemId}
              className="flex-shrink-0 px-4"
              style={{ width: `${100 / itemsPerView}%` }}
            >
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group">
                {/* Image Container */}
                <div className="relative h-56 overflow-hidden bg-gray-100">
                  <img
                    src={getImageUrl(item)}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Top Badge - High Points */}
                  {item.loyaltyPoints >= 100 && (
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                      <TrendingUp className="w-3 h-3" />
                      Popular
                    </div>
                  )}

                  {/* Quick Add Button - Always Visible on Mobile */}
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={addingItem === item.itemId}
                    className={`absolute bottom-4 right-4 ${
                      addingItem === item.itemId
                        ? "bg-green-600 scale-110"
                        : "bg-red-600 hover:bg-red-700 md:opacity-0 md:group-hover:opacity-100"
                    } text-white p-3 rounded-full shadow-xl transition-all duration-300 transform hover:scale-110 disabled:cursor-not-allowed`}
                    aria-label="Add to cart"
                  >
                    {addingItem === item.itemId ? (
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-red-600 transition-colors">
                    {item.name}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 h-10">
                    {item.description || "Delicious food item"}
                  </p>

                  {/* Price and Points Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-gray-900">
                        {item.price ? "$" + item.price : "$0.00"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-full">
                      <Star className="w-4 h-4 text-red-600 fill-red-600" />
                      <span className="text-sm font-semibold text-red-600">
                        {item.loyaltyPoints}
                      </span>
                    </div>
                  </div>

                  {/* Category Badge */}
                  {item.categoryId && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500 font-medium">
                        {item.categoryId.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Dots */}
      {showNavigation && (
        <div className="flex justify-center items-center gap-2 mt-8">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (!isAnimating) {
                  setIsAnimating(true);
                  setCurrentIndex(index);
                  setTimeout(() => setIsAnimating(false), 500);
                }
              }}
              disabled={isAnimating}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? "w-8 h-2.5 bg-red-600"
                  : "w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400"
              } disabled:cursor-not-allowed`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BestFoodSlider;
