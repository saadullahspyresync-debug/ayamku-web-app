
// import React from "react";
// import { Link } from "react-router-dom";
// import { Button } from "@/components/ui/button";

// const HeroSection = ({ t, navigate }: any) => (
//   <section className="relative h-[600px] lg:h-[700px] overflow-hidden">
//     <div
//       className="absolute inset-0 bg-cover bg-center"
//       style={{
//         backgroundImage: 'url("/assets/images/home-hero-section.png")',
//         backgroundPosition: "center",
//         backgroundSize: "cover",
//       }}
//     />
//     <div className="absolute inset-0 bg-[#03081FE5]/90" />
//     <div className="relative container mx-auto px-4 h-full flex items-center">
//       <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
//         <div className="text-white">
//           <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
//             {t("hero.slogan")}
//           </h1>
//           <div className="flex flex-col sm:flex-row gap-4">
//             <Button asChild className="bg-ayamku-primary hover:bg-red-600 text-white px-8 py-3 text-lg">
//               <Link to="/menu">{t("hero.button_order")}</Link>
//             </Button>
//             <Button
//               onClick={() => navigate("/menu")}
//               variant="outline"
//               className="border-white text-gray-900 px-8 py-3 text-lg hover:bg-gray-300"
//             >
//               {t("hero.button_view_menu")}
//             </Button>
//           </div>
//         </div>
//         <div className="hidden lg:block">
//           <img
//             src="/assets/images/home-hero-section.png"
//             alt={t("hero.title")}
//             className="w-full h-auto rounded-lg shadow-2xl"
//           />
//         </div>
//       </div>
//     </div>
//   </section>
// );

// export default HeroSection;

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const HeroSlider = ({ t, navigate, sliders }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Sample slides - replace with your actual images and content
  const slides = [
    {
      image: "/assets/images/home-hero-section.png",
      title: "The most flavorful chicken in Brunei",
      subtitle: "Taste the tradition",
    },
    {
      image: "/assets/images/slide-2.jpg",
      title: "Crispy & Delicious",
      subtitle: "Made fresh daily",
    },
    {
      image: "/assets/images/slide-3.jpg",
      title: "Family Meals & More",
      subtitle: "Share the joy",
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Auto-advance slider
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-[600px] lg:h-[700px] overflow-hidden">
      {/* Slides Container */}
      <div className="relative w-full h-full">
        {sliders.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${slide.imageUrl.url})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
              }}
            />
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-[#03081F]/60" />

            {/* Content */}
            <div className="relative container mx-auto px-4 h-full flex items-center">
              <div className="text-white max-w-3xl">
                <h1 className="text-4xl lg:text-6xl font-bold mb-4 leading-tight animate-fade-in">
                  {slide.title}
                </h1>
                <p className="text-xl lg:text-2xl mb-8 text-gray-200">
                  {slide.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => navigate?.("/menu")}
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg rounded-md transition-colors duration-300"
                  >
                    Order Now
                  </button>
                  <button
                    onClick={() => navigate?.("/menu")}
                    className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-3 text-lg rounded-md transition-all duration-300"
                  >
                    View Menu
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300 z-10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300 z-10"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "bg-white w-8"
                : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;