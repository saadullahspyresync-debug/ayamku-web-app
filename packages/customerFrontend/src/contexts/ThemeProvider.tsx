import React, { createContext, useContext, useEffect, useState } from "react";
import { getActiveTheme } from "@/services/api";

const ThemeContext = createContext<any>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeTheme, setActiveTheme] = useState<any>(null);

  useEffect(() => {
    // 1. Immediate Apply from Storage (Prevention of "Flash")
    const savedTheme = localStorage.getItem("ayamku_active_theme");
    if (savedTheme) {
      const parsed = JSON.parse(savedTheme);
      applyThemeToCSS(parsed.primaryColor);
      setActiveTheme(parsed);
    }

    // 2. Background Sync with AWS Lambda
    const syncTheme = async () => {
      try {
        const response = await getActiveTheme();
        const liveTheme = response.data.data;

        if (liveTheme) {
          // Update CSS and LocalStorage if changed
          applyThemeToCSS(liveTheme.primaryColor);
          localStorage.setItem("ayamku_active_theme", JSON.stringify(liveTheme));
          setActiveTheme(liveTheme);
        }
      } catch (error) {
        console.error("Theme sync failed:", error);
      }
    };

    syncTheme();
  }, []);

  const applyThemeToCSS = (color: string) => {
    if (color) {
      document.documentElement.style.setProperty("--ayamku-primary", color);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme: activeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);