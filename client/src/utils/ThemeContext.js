"use client";
import logger from "@/lib/logger";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

// Create the theme context
const ThemeContext = createContext();

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// Detect Chrome browser
const isChrome = () => {
  if (typeof window === "undefined") return false;
  return (
    /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
  );
};

// Theme provider component
export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);
  const [systemIsDark, setSystemIsDark] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isChromeBrowser, setIsChromeBrowser] = useState(false);

  // Function to apply theme to document
  const applyTheme = (isDark) => {
    logger.log("Applying theme:", isDark ? "dark" : "light");
    setDarkMode(isDark);

    // Explicitly add or remove the class
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Save the preference
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  // Initialize theme based on user preference or system preference
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Check if using Chrome
      const chromeDetected = isChrome();
      setIsChromeBrowser(chromeDetected);
      logger.log("Chrome browser detected:", chromeDetected);

      // Check system preference
      const prefersDarkQuery = window.matchMedia(
        "(prefers-color-scheme: dark)",
      );
      const prefersDark = prefersDarkQuery.matches;
      setSystemIsDark(prefersDark);
      logger.log("System prefers dark:", prefersDark);

      // Check if user has a theme preference stored
      const savedTheme = localStorage.getItem("theme");
      logger.log("Saved theme:", savedTheme);

      if (savedTheme) {
        // Apply saved preference
        const isDark = savedTheme === "dark";
        logger.log("Applying saved theme:", isDark ? "dark" : "light");
        applyTheme(isDark);
      } else {
        // Use system preference
        logger.log(
          "No saved preference, using system preference:",
          prefersDark ? "dark" : "light",
        );
        applyTheme(prefersDark);
      }

      // Add listener for system theme changes
      const handleChange = (e) => {
        logger.log("System theme changed to:", e.matches ? "dark" : "light");
        setSystemIsDark(e.matches);
      };

      prefersDarkQuery.addEventListener("change", handleChange);
      setIsInitialized(true);

      return () => prefersDarkQuery.removeEventListener("change", handleChange);
    } catch (error) {
      logger.error("Error initializing theme:", error);
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    try {
      setDarkMode((prev) => {
        const newDarkMode = !prev;
        logger.log("Toggling theme to:", newDarkMode ? "dark" : "light");

        document.documentElement.classList.toggle("dark", newDarkMode);
        localStorage.setItem("theme", newDarkMode ? "dark" : "light");

        // Chrome-specific double-check if needed
        if (isChromeBrowser && newDarkMode === false) {
          setTimeout(() => {
            if (document.documentElement.classList.contains("dark")) {
              logger.log("Chrome: forcing dark class removal");
              document.documentElement.classList.remove("dark");
            }
          }, 50);
        }

        return newDarkMode;
      });
    } catch (error) {
      logger.error("Error toggling theme:", error);
    }
  }, [isChromeBrowser]);

  // Add storage event listener to handle theme changes from other components
  // Sync theme across tabs/components
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e) => {
      if (e.key === "theme") {
        const newTheme = e.newValue;
        if (newTheme === "dark" || newTheme === "light") {
          const isDark = newTheme === "dark";
          setDarkMode(isDark);
          document.documentElement.classList.toggle("dark", isDark);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);
  const contextValue = useMemo(
    () => ({
      darkMode,
      toggleDarkMode,
      systemIsDark,
      isInitialized,
      isChromeBrowser,
    }),
    [darkMode, toggleDarkMode, systemIsDark, isInitialized, isChromeBrowser],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}
