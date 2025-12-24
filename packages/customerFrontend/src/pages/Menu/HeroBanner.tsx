import { useTranslation } from "react-i18next";

export const HeroBanner = () => {
  const { t } = useTranslation();
  return (
    <div className="relative h-full mx-[10px] sm:mx-[50px] my-[10px] sm:my-[50px] rounded-[12px] overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      <img
        src="/assets/images/conatct-us-banner.png"
        alt={t("hero.title")}
        className="w-full h-80 object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {t("hero.title_menu")}
          </h1>
          <p className="text-lg md:text-xl">{t("hero.subtitle")}</p>
        </div>
      </div>
    </div>
  );
};