import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Category = {
    categoryId: string
  _id: string;
  name: string;
  totalItems?: number;
  image?: string;
};

interface CategorySliderProps {
  categories: Category[];
  loading: boolean;
  t: (key: string) => string;
  Link: any ;
}

const CategorySlider: React.FC<CategorySliderProps> = ({ categories, loading, t, Link }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [itemsPerView, setItemsPerView] = useState(4);
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Responsive items per view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(2);
      } else if (window.innerWidth < 768) {
        setItemsPerView(2);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(3);
      } else {
        setItemsPerView(4);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto play functionality
  useEffect(() => {
    if (categories.length <= itemsPerView) return;

    const autoPlay = () => {
      handleNext();
    };

    autoPlayRef.current = setInterval(autoPlay, 5000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [categories.length, itemsPerView, currentIndex]);

  const maxIndex = Math.max(0, categories.length - itemsPerView);

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

  const handleDotClick = (index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  // Pause auto play on hover
  const handleMouseEnter = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (categories.length > itemsPerView) {
      autoPlayRef.current = setInterval(() => {
        handleNext();
      }, 5000);
    }
  };

  if (loading) {
    return (
      <div className="col-span-full text-center text-gray-500 py-8">
        {t("best_food.no_items")}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="col-span-full text-center text-gray-500 py-8">
        {t("explore_menu.no_categories")}
      </div>
    );
  }

  const showNavigation = categories.length > itemsPerView;
  const totalDots = maxIndex + 1;

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {/* Navigation Buttons */}
      {showNavigation && (
        <>
          <button
            onClick={handlePrevious}
            disabled={isAnimating}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700 group-hover:text-ayamku-primary transition-colors" />
          </button>
          
          <button
            onClick={handleNext}
            disabled={isAnimating}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6 text-gray-700 group-hover:text-ayamku-primary transition-colors" />
          </button>
        </>
      )}

      {/* Slider Container */}
      <div className="overflow-hidden" ref={sliderRef}>
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`
          }}
        >
          {categories.map((category) => (
            <div
              key={category._id}
              className="flex-shrink-0 px-3"
              style={{ width: `${100 / itemsPerView}%` }}
            >
              <Link
                to={`/menu?category=${category?.name?.toLowerCase()}`}
                className="group cursor-pointer block"
              >
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="aspect-square overflow-hidden relative">
                    <img
                      src={category.image || "/assets/images/placeholder.png"}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-ayamku-primary transition-colors">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      {showNavigation && totalDots > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          {Array.from({ length: totalDots }).map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              disabled={isAnimating}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? 'w-8 h-2 bg-ayamku-primary'
                  : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
              } disabled:cursor-not-allowed`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategorySlider;