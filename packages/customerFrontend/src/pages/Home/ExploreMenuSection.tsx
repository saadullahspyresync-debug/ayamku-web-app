import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import CategorySlider from "@/components/CategorySlider";

const ExploreMenuSection = ({ t, categories, loading }: any) => (
  <section className="py-16">
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {t("explore_menu.title")}
          </h2>
          <p className="text-lg text-gray-600">{t("explore_menu.description")}</p>
        </div>
        <Button asChild variant="outline" className="hidden md:inline-flex">
          <Link to="/menu">
            {t("explore_menu.view_all")}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </Button>
      </div>

      <CategorySlider categories={categories} loading={loading} t={t} Link={Link} />
    </div>
  </section>
);

export default ExploreMenuSection;
