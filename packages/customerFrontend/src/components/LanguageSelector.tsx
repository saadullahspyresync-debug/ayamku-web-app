import React from "react";
import { useTranslation } from "react-i18next";

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng : string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <select
      onChange={(e) => changeLanguage(e.target.value)}
      value={i18n.language}
      className="border border-gray-300 p-2 rounded-lg text-sm bg-white shadow-sm focus:outline-none"
    >
      <option value="en">🇬🇧 English</option>
      <option value="ms">🇲🇾 Malay</option>
    </select>
  );
}

export default LanguageSelector;
