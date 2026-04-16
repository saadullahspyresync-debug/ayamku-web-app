import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeProvider";

export const HeroBanner = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <div className="mx-[10px] sm:mx-[50px] my-[10px] sm:my-[50px] rounded-[12px] overflow-hidden">
      
      {/* This wrapper is the single source of truth for height */}
      <div className="relative w-full h-40 sm:h-60 md:h-[400px] lg:h-[600px]">
        
        {/* Image fills the wrapper completely */}
        <img
          src={theme?.bannerImg ?? "/assets/images/contact-us-banner.png"}
          alt={t("hero.title")}
          className="absolute inset-0 w-full h-full object-center"
        />

        {/* Dimming overlay */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Text content */}
        <div className="absolute inset-0 flex items-center justify-center text-center text-white px-4">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {t("hero.title_menu")}
            </h1>
            <p className="text-lg md:text-xl">{t("hero.subtitle")}</p>
          </div>
        </div>

      </div>
    </div>
  );
};