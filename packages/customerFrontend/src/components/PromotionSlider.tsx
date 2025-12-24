import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { Button } from "@/components/ui/button";
import { fetchPromotions } from "@/services/api";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";


type Promotion = {
  promotionId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  type?: string;
  image?: { url: string };
};

const PromotionsSlider: React.FC = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const navigate = useNavigate();

  useEffect(() => {
    const getPromotions = async () => {
      try {
        const res = await fetchPromotions();
        setPromotions(res || []);
      } catch (error) {
        console.error("❌ Failed to load promotions:", error);
      } finally {
        setLoading(false);
      }
    };
    getPromotions();
  }, []);

  if (loading)
    return (
      <div className="text-center py-16 text-gray-400 animate-pulse">
        Loading promotions...
      </div>
    );

  if (!promotions.length)
    return (
      <div className="text-center py-16 text-gray-500">
        No active promotions available.
      </div>
    );

  const handleOrderNow = () => {
    navigate("/menu", {
      state: { category: "Promotion" },
    });
  };

  return (
    <section className="relative w-full overflow-hidden mb-24">
      <div className="max-w-7xl mx-auto px-4">
        {/* ✅ Heading */}
        <div className="mt-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">
            {t("promotions.title")}
          </h2>
        </div>

        <Swiper
          modules={[Pagination, Autoplay]}
          pagination={{
            clickable: true,
            el: ".swiper-pagination",
          }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop
          slidesPerView={1}
          className="w-full h-[400px] md:h-[500px] lg:h-[600px]"
        >
          {promotions.map((promo) => (
            <SwiperSlide key={promo.promotionId}>
              <div className="relative w-full h-full flex justify-center items-center bg-black">
                {/* ✅ Image - fully visible, consistent size */}
                <img
                  src={promo.image?.url || "/assets/images/placeholder.png"}
                  alt={promo.name}
                  className="object-contain w-full h-full"
                />

                {/* ✅ Bottom-left overlay box */}
                <div className="absolute bottom-8 left-8 bg-black/60 backdrop-blur-sm p-5 rounded-xl text-white max-w-xs">
                  <h3 className="text-2xl md:text-3xl font-semibold leading-tight mb-1">
                    {promo.name}
                  </h3>
                  <p className="text-sm text-gray-200 mb-3">
                    {promo.startDate} → {promo.endDate}
                  </p>
                  <Button
                    className="bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition w-fit"
                    onClick={handleOrderNow}
                  >
                    Order Now
                  </Button>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* ✅ Pagination centered below */}
        <div className="flex justify-center mt-6">
          <div className="swiper-pagination !static !w-auto"></div>
        </div>
      </div>

      {/* ✅ Custom pagination style */}
      <style jsx global>{`
        .swiper-pagination-bullet {
          background: #eab308 !important; /* yellow-500 */
          opacity: 0.5;
          width: 10px;
          height: 10px;
          margin: 0 6px !important;
          transition: all 0.3s ease;
        }
        .swiper-pagination-bullet-active {
          opacity: 1;
          width: 12px;
          height: 12px;
          background: #facc15 !important; /* yellow-400 */
        }
      `}</style>
    </section>
  );
};

export default PromotionsSlider;
