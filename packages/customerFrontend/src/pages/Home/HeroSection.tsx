import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const HeroSlider = ({ t, navigate, sliders }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliders.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + sliders.length) % sliders.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    if (sliders.length <= 1) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [sliders.length]);

  return (
    <section className="relative w-full overflow-hidden
      h-[280px] sm:h-[380px] md:h-[480px] lg:h-[600px] xl:h-[700px]">

      {/* Slides Container */}
      <div className="relative w-full h-full">
        {sliders.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Background Image — <img> for better mobile rendering */}
            <img
              src={slide.imageUrl.url}
              alt={slide.title ?? ""}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />

            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-[#03081F]/60" />

            {/* Content */}
            <div className="relative container mx-auto px-4 sm:px-6 h-full flex items-center">
              <div className="text-white w-full max-w-3xl">

                {/* Title */}
                <h1 className="font-bold leading-tight mb-2 sm:mb-4
                  text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
                  {slide.title}
                </h1>

                {/* Subtitle */}
                <p className="text-gray-200 mb-4 sm:mb-8
                  text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl
                  line-clamp-2 sm:line-clamp-none">
                  {slide.subtitle}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-row gap-2 sm:gap-4">
                  <button
                    onClick={() => navigate?.("/menu")}
                    className="bg-ayamku-primary hover:opacity-90 text-white rounded-md transition-colors duration-300 font-medium
                      px-4 py-2 text-sm
                      sm:px-6 sm:py-2.5 sm:text-base
                      md:px-8 md:py-3 md:text-lg"
                  >
                    Order Now
                  </button>
                  <button
                    onClick={() => navigate?.("/menu")}
                    className="border-2 border-white text-white hover:bg-white hover:text-gray-900 rounded-md transition-all duration-300 font-medium
                      px-4 py-2 text-sm
                      sm:px-6 sm:py-2.5 sm:text-base
                      md:px-8 md:py-3 md:text-lg"
                  >
                    View Menu
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows — smaller on mobile */}
      {sliders.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2
              bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full
              transition-all duration-300 z-10
              p-1.5 sm:p-2 md:p-3"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2
              bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full
              transition-all duration-300 z-10
              p-1.5 sm:p-2 md:p-3"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>
        </>
      )}

      {/* Dots Navigation — tighter on mobile */}
      <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 z-10">
        {sliders.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 sm:h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "bg-white w-5 sm:w-8"
                : "bg-white/50 hover:bg-white/75 w-2 sm:w-3"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;