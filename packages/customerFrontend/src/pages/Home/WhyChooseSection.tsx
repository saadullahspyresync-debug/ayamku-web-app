import React from "react";
import easyToOrderImage from "/assets/images/easy-to-order.png";
import bestQuality from "/assets/images/best-quality.png";
import orderAndPay from "/assets/images/order-and-pay.png";

const WhyChooseSection = ({ t }: any) => {
  const services = [
    {
      icon: easyToOrderImage,
      title: t("why_choose.services.easy_to_order.title"),
      description: t("why_choose.services.easy_to_order.description"),
    },
    {
      icon: bestQuality,
      title: t("why_choose.services.fastest_delivery.title"),
      description: t("why_choose.services.fastest_delivery.description"),
    },
    {
      icon: orderAndPay,
      title: t("why_choose.services.best_quality.title"),
      description: t("why_choose.services.best_quality.description"),
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-left mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {t("why_choose.title")}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl">
            {t("why_choose.description")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div key={index} className="text-center flex flex-col items-center">
              <img src={service.icon} alt={service.title} className="mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {service.title}
              </h3>
              <p className="text-gray-600">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseSection;
