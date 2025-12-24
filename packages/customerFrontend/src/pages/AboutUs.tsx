import React from "react";
import { useTranslation } from "react-i18next"; // ✅ import translation hook

const AboutUs = () => {
  const { t } = useTranslation(); // ✅ initialize translation

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="relative h-full mx-[10px] sm:mx-[50px] my-[10px] sm:my-[50px] rounded-[12px] overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <img
          src="/assets/images/conatct-us-banner.png"
          alt="Contact Banner"
          className="w-full h-80 object-cover"
        />
      </div>

      <div className="container mx-auto sm:px-6 sm:py-6 px-4 py-4">
        <div className="flex flex-col gap-4 items-start">
          <h2 className="text-[#010F1C] font-bold text-[28px] sm:text-[44px] leading-[120%] sm:leading-[150%]">
            {t("about_us.title")}
          </h2>
          <p className="text-[#010F1C] text-[16px] leading-[150%]">
            {t("about_us.intro1")}
          </p>
          <p className="text-[#010F1C] text-[16px] leading-[150%]">
            {t("about_us.intro2")}
          </p>
        </div>
      </div>

      <div className="container mx-auto sm:px-6 sm:py-6 px-4 py-4">
        <div className="flex flex-col gap-4 items-start">
          <h2 className="text-[#010F1C] font-bold text-[28px] sm:text-[44px] leading-[120%] sm:leading-[150%]">
            {t("about_us.difference_title")}
          </h2>
          <p className="text-[#010F1C] text-[16px] leading-[150%]">
            <span className="font-semibold">{t("about_us.locally_inspired.title")}</span> –{" "}
            {t("about_us.locally_inspired.text")}
          </p>
          <p className="text-[#010F1C] text-[16px] leading-[150%]">
            <span className="font-semibold">{t("about_us.fresh_fast.title")}</span> –{" "}
            {t("about_us.fresh_fast.text")}
          </p>
          <p className="text-[#010F1C] text-[16px] leading-[150%]">
            <span className="font-semibold">{t("about_us.always_evolving.title")}</span> –{" "}
            {t("about_us.always_evolving.text")}
          </p>
        </div>
      </div>

      <div className="container mx-auto sm:px-6 sm:py-6 px-4 py-4">
        <div className="flex flex-col gap-4 items-start">
          <h2 className="text-[#010F1C] font-bold text-[28px] sm:text-[44px] leading-[120%] sm:leading-[150%]">
            {t("about_us.mission_title")}
          </h2>
          <p className="text-[#010F1C] text-[16px] leading-[150%]">
            {t("about_us.mission_text")}
          </p>
        </div>
      </div>

      <div className="container mx-auto sm:px-6 sm:py-6 px-4 py-4 mb-8">
        <div className="flex flex-col gap-4 items-start">
          <h2 className="text-[#010F1C] font-bold text-[28px] sm:text-[44px] leading-[120%] sm:leading-[150%]">
            {t("about_us.vision_title")}
          </h2>
          <p className="text-[#010F1C] text-[16px] leading-[150%]">
            {t("about_us.vision_text")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
