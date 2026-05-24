'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/utils/ThemeContext';

export default function ThemeDebug() {
  const { darkMode, toggleDarkMode, systemIsDark, isChromeBrowser } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [savedTheme, setSavedTheme] = useState(null);
  
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setSavedTheme(localStorage.getItem('theme') || 'none');
    }
  }, []);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSavedTheme(localStorage.getItem('theme') || 'none');
    }
  }, [darkMode]);
  
  const forceLight = () => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    window.location.reload();
  };
  
  const forceDark = () => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    window.location.reload();
  };
  
  const clearTheme = () => {
    localStorage.removeItem('theme');
    window.location.reload();
  };
  
  const chromeFix = () => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    setTimeout(() => {
      if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
      }
      setSavedTheme('light');
    }, 50);
  };
  
  if (!mounted) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-50 text-black dark:text-white border border-gray-300 dark:border-gray-600">
      <h3 className="font-bold mb-2">Theme Debug</h3>
      <div className="space-y-1 text-sm">
        <p>Dark Mode: <span className="font-mono">{darkMode ? 'true' : 'false'}</span></p>
        <p>System Dark: <span className="font-mono">{systemIsDark ? 'true' : 'false'}</span></p>
        <p>Chrome Browser: <span className="font-mono">{isChromeBrowser ? 'true' : 'false'}</span></p>
        <p>Saved Theme: <span className="font-mono">{savedTheme}</span></p>
        <p>HTML Class: <span className="font-mono">{document.documentElement.classList.contains('dark') ? 'dark' : 'no dark'}</span></p>
      </div>
      <div className="mt-3 space-x-2 flex flex-wrap gap-2">
        <button 
          onClick={toggleDarkMode}
          className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Toggle Theme
        </button>
        <button 
          onClick={forceLight}
          className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Force Light
        </button>
        <button 
          onClick={forceDark}
          className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-800"
        >
          Force Dark
        </button>
        <button 
          onClick={clearTheme}
          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear Theme
        </button>
        {isChromeBrowser && (
          <button 
            onClick={chromeFix}
            className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Chrome Fix
          </button>
        )}
      </div>
    </div>
  );
}