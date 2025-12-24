import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <img
              src="https://ayamku-web.s3.us-east-1.amazonaws.com/ayamku-logo.svg"
              alt="Ayamku Logo"
              className="mb-2"
            />
            <p className="text-gray-400 mb-4 max-w-md">
              {t("footer.description")}
            </p>
            <div className="text-sm text-gray-400">
              {t("footer.rights")}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">{t("footer.quick_links")}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/menu"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {t("footer.explore_menu")}
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {t("footer.restaurant_locator")}
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {t("footer.contact_us")}
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {t("footer.about_us")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4">{t("footer.contact")}</h3>
            <ul className="space-y-2 text-gray-400">
              <li>{t("footer.address_line1")}</li>
              <li>{t("footer.address_line2")}</li>
              <li>{t("footer.phone")}</li>
              <li>{t("footer.email")}</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
