import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import BestFoodSlider from "@/components/BestFoodSlider";

const BestFoodSection = ({ t, items, loading, onAddToCart }: any) => (
  <section className="py-16 bg-gray-50">
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {t("best_food.title")}
          </h2>
          <p className="text-lg text-gray-600">{t("best_food.description")}</p>
        </div>
        <Button asChild variant="outline" className="hidden md:inline-flex">
          <Link to="/menu">
            {t("explore_menu.view_all")}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </Button>
      </div>

      <BestFoodSlider items={items} loading={loading} t={t} onAddToCart={onAddToCart} />
    </div>
  </section>
);

export default BestFoodSection;
