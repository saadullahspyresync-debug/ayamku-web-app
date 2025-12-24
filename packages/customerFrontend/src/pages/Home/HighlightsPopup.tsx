import React, { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const themeColor = "rgb(229 62 62 / var(--tw-bg-opacity, 1))";

const HighlightsPopup = ({ highlights = [], onOrderClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (highlights.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % highlights.length);
  };

  const prevSlide = () => {
    if (highlights.length === 0) return;
    setCurrentSlide(
      (prev) => (prev - 1 + highlights.length) % highlights.length
    );
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    if (!isOpen || highlights.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % highlights.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, highlights.length]);

  // Don't render if no highlights
  if (!highlights || highlights.length === 0) {
    return null;
  }

  return (
    <>
      {/* Compact Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-0 top-1/2 -translate-y-1/2 
             text-white font-sans font-semibold  /* 👈 Ensures it uses your app’s main font */
             px-3 py-6 rounded-r-2xl shadow-xl hover:shadow-red-500/60 
             transition-all duration-500 z-40 group hover:px-4 
             backdrop-blur-md overflow-hidden select-none"
        style={{
          background: `linear-gradient(135deg, ${themeColor} 0%, rgb(220 38 38) 50%, rgb(185 28 28) 100%)`,
        }}
        aria-label="Open highlights"
      >
        {/* Animated background shimmer */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* Glowing border effect */}
        <div className="absolute inset-0 rounded-r-2xl border-r-2 border-t border-b border-red-300/50 group-hover:border-red-200/80 transition-colors duration-500"></div>

        {/* Inner content */}
        <div className="flex flex-col items-center gap-2 relative z-10">
          <Sparkles className="w-5 h-5 animate-pulse drop-shadow-lg" />
          <div
            className="writing-mode-vertical text-xs font-bold tracking-[0.25em] uppercase drop-shadow-lg"
            style={{
              fontFamily: "inherit", // 👈 uses the same font-family as your global app theme
              letterSpacing: "0.25em",
            }}
          >
            Highlights
          </div>
        </div>
      </button>

      {/* Enhanced Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-md z-50 transition-all duration-500"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Modern Popup Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl h-[92vh] overflow-hidden animate-slide-in-up">
            {/* Premium Glassmorphic Header */}
            <div
              className="text-white p-8 flex items-center justify-between relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${themeColor} 0%, rgb(220 38 38) 50%, rgb(185 28 28) 100%)`,
              }}
            >
              {/* Animated background patterns */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
                <div
                  className="absolute bottom-0 right-0 w-80 h-80 bg-white rounded-full blur-3xl animate-pulse"
                  style={{ animationDelay: "1s" }}
                ></div>
              </div>

              {/* Diagonal stripes pattern */}
              <div
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, transparent, transparent 10px, white 10px, white 20px)",
                }}
              ></div>

              {/* Glass overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent backdrop-blur-sm"></div>

              <div className="flex items-center gap-5 relative z-10">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/30 rounded-2xl blur-xl animate-pulse"></div>
                  <div className="relative p-3 bg-white/20 rounded-2xl backdrop-blur-md border-2 border-white/30 shadow-2xl">
                    <Sparkles className="w-8 h-8" />
                  </div>
                </div>
                <div>
                  <h2 className="text-4xl font-black tracking-tight drop-shadow-lg">
                    Featured Highlights
                  </h2>
                  <p className="text-white/90 text-sm font-medium mt-1 tracking-wide">
                    Discover our special selections
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setIsOpen(false)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white hover:text-white border-2 border-white/50 hover:border-white/70 p-3 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-110 hover:rotate-90 relative z-10"
                aria-label="Close"
              >
                <X className="w-7 h-7" />
              </Button>
            </div>

            {/* Modern Slider Content */}
            <div className="relative h-[calc(92vh-88px)] bg-gradient-to-br from-gray-50 to-gray-100">
              {highlights.map((highlight, index) => (
                <div
                  key={highlight.id}
                  className={`absolute inset-0 transition-all duration-700 ${
                    index === currentSlide
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  <div className="h-full flex flex-col lg:flex-row gap-0">
                    {/* Image Section - Modern with Overlay */}
                    <div className="relative w-full lg:w-3/5 h-[45vh] lg:h-full overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
                      <img
                        src={highlight.image.url}
                        alt={highlight.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {/* Modern Badge */}
                      <div className="absolute top-6 left-6 z-20">
                        <span
                          className="text-xs font-black px-5 py-2 rounded-full shadow-2xl text-white backdrop-blur-md border-2 border-white/30 uppercase tracking-wider"
                          style={{ backgroundColor: `${themeColor}dd` }}
                        >
                          {highlight.badge || `Special ${index + 1}`}
                        </span>
                      </div>
                    </div>

                    {/* Content Section - Modern Typography */}
                    <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center bg-white">
                      <div className="max-w-xl mx-auto w-full">
                        {/* Decorative Element */}
                        <div
                          className="w-16 h-1.5 rounded-full mb-6"
                          style={{ backgroundColor: themeColor }}
                        ></div>

                        <h3 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 leading-tight">
                          {highlight.title}
                        </h3>

                        <p className="text-gray-600 text-lg lg:text-xl leading-relaxed mb-10 font-light">
                          {highlight.description}
                        </p>

                        {/* Modern CTA Button */}
                        <Button
                          onClick={() => onOrderClick?.()}
                          className="w-full text-white py-6 rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-1 relative overflow-hidden group border-2 border-red-400"
                          style={{ backgroundColor: themeColor }}
                        >
                          <span className="relative z-10">Order Now</span>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Modern Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm text-gray-800 p-4 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-110 hover:-translate-x-1 border-2 border-gray-100"
                aria-label="Previous highlight"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>

              <button
                onClick={nextSlide}
                className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm text-gray-800 p-4 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-110 hover:translate-x-1 border-2 border-gray-100"
                aria-label="Next highlight"
              >
                <ChevronRight className="w-7 h-7" />
              </button>

              {/* Modern Dots Navigation */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-3 bg-black/30 backdrop-blur-md px-6 py-3 rounded-full">
                {highlights.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      index === currentSlide
                        ? "w-12 shadow-lg shadow-red-500/50"
                        : "w-2.5 hover:w-6 bg-white/60 hover:bg-white/80"
                    }`}
                    style={
                      index === currentSlide
                        ? { backgroundColor: themeColor }
                        : {}
                    }
                    aria-label={`Go to highlight ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced CSS */}
      <style>{`
        .writing-mode-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
        
        @keyframes slide-in-up {
          from {
            opacity: 0;
            transform: translateY(100px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-slide-in-up {
          animation: slide-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
};

export default HighlightsPopup;
