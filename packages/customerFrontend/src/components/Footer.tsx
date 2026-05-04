import React, {useEffect, useState} from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchFooterData, FooterSettings } from "@/services/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faFacebookF, 
  faInstagram, 
  faYoutube, 
  faTiktok 
} from "@fortawesome/free-brands-svg-icons";

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const [footerData, setFooterData] = useState<FooterSettings | null>(null);

  useEffect(() => {
    const getFooter = async () => {
      try {
        const data = await fetchFooterData();
        setFooterData(data);
      } catch (error) {
        console.error("Failed to load footer data:", error);
      }
    };

    getFooter();
  }, []);

 const socialLinks = [
    { id: "fb", icon: faFacebookF, href: "https://www.facebook.com/ayamkugroup", label: "Facebook" },
    { id: "ig", icon: faInstagram, href: "https://www.instagram.com/ayamku_brunei", label: "Instagram" },
    { id: "yt", icon: faYoutube, href: "https://youtube.com/@ayamkubrunei2001", label: "YouTube" },
    { id: "tk", icon: faTiktok, href: "https://www.tiktok.com/@ayamkubrunei569", label: "TikTok" },
  ];


  return (
    <footer className="bg-gray-900 text-white py-12 md:mt-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <img
              src="https://ayamku-web.s3.us-east-1.amazonaws.com/ayamku-logo.svg"
              alt="Ayamku Logo"
              className="mb-4"
            />
            <p className="text-gray-400 mb-6 max-w-md">
              {t("footer.description")}
            </p>

            {/* 📱 Font Awesome Social Icons */}
            <div className="flex space-x-4 mb-6">
              {socialLinks.map((social) => (
                <a
                  key={social.id}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:bg-white hover:text-gray-900 transition-all duration-300"
                >
                  <FontAwesomeIcon icon={social.icon} className="text-lg" />
                </a>
              ))}
            </div>

            <div className="text-sm text-gray-500">
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
                  {footerData ? footerData.quickLinks?.exploreMenu : t("explore_menu")}
                </Link>
              </li>
              <li>
                <Link
                  to="/restaurant-locator"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {footerData ? footerData.quickLinks?.restaurantLocator : t("restaurant_locator")}
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {footerData ? footerData.quickLinks?.contactUs : t("contact_us")}
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {footerData ? footerData.quickLinks?.aboutUs : t("about_us")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4">{t("footer.contact")}</h3>
            <ul className="space-y-2 text-gray-400">
              <li>{footerData ? footerData.contactInfo?.address1 : t("footer.address1")}</li>
              <li>{footerData ? footerData.contactInfo?.address2 : t("footer.address2")}</li>
              <li>{footerData ? `+ ${footerData.contactInfo?.phone}` : t("footer.phone")}</li>
              <li>{footerData ? footerData.contactInfo?.email : t("footer.email")}</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
