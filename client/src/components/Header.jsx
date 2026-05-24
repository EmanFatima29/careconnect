import logger from "@/lib/logger";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { VscThreeBars } from "react-icons/vsc";
import { FiSun, FiMoon } from "react-icons/fi";
import SearchBar from "./SearchBar";
import { useTheme } from "@/utils/ThemeContext";

export default function Header() {
  const {
    darkMode,
    toggleDarkMode,
    systemIsDark,
    isInitialized,
    isChromeBrowser,
  } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only show UI after component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggleTheme = () => {
    logger.log("Toggle theme button clicked");
    logger.log(
      "Before toggle - Dark mode:",
      darkMode,
      "System is dark:",
      systemIsDark,
      "Chrome:",
      isChromeBrowser
    );

    // Chrome-specific direct handling for better reliability
    if (isChromeBrowser && systemIsDark) {
      logger.log("Using Chrome-specific theme toggle handling");
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      window.dispatchEvent(new Event("storage")); // Trigger storage event for other components to update
    } else {
      toggleDarkMode();
    }
  };

  return (
    <header className="bg-[#282828] dark:bg-[#121212] sticky top-2 z-50 rounded-lg bg-[#282828]/90 dark:bg-[#121212]/90 backdrop-blur supports-[backdrop-filter]:bg-[#282828]/70 dark:supports-[backdrop-filter]:bg-[#121212]/70 mx-3 sm:mx-4 mt-2 transition-colors duration-300">
      <nav className="flex w-full h-16 px-4 sm:px-6 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/">
            <span className="text-[#1A3636] dark:text-[#4ECDC4] sm:text-3xl text-[25px] sm:mr-[20px] mr-5px font-mono transition-colors duration-300">
              CareConnect
            </span>
          </Link>
        </div>
        {/* Search Bar */}
        <SearchBar />
        {/* Action Container */}
        <span className="flex items-center">
          {/* Theme Toggle Button */}
          {mounted && (
            <button
              onClick={handleToggleTheme}
              className="p-2 mr-4 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300 relative group"
              aria-label={
                systemIsDark
                  ? "Force light mode"
                  : darkMode
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              data-system-dark={systemIsDark ? "true" : "false"}
              data-current-mode={darkMode ? "dark" : "light"}
              data-chrome={isChromeBrowser ? "true" : "false"}
            >
              {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}

              {/* Tooltip */}
              <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
                {systemIsDark
                  ? "Force light mode"
                  : darkMode
                  ? "Switch to light mode"
                  : "Switch to dark mode"}
                {isChromeBrowser && systemIsDark && " (Chrome)"}
              </span>
            </button>
          )}

          <div className="items-center gap-6 justify-between hidden sm:flex">
            <div>
              <Link href="/about">
                <span className="text-white dark:text-gray-200 text-2xl hover:text-[#282828] dark:hover:text-[#4ECDC4] transition-colors duration-300">
                  Profile
                </span>
              </Link>
            </div>
          </div>
          {/* Three Bar Icon */}
          <span className="sm:hidden">
            <VscThreeBars
              size={30}
              className="text-white dark:text-gray-200 hover:text-[#282828] dark:hover:text-[#4ECDC4] hover:cursor-pointer transition-colors duration-300"
            />
          </span>
        </span>
      </nav>
    </header>
  );
}
