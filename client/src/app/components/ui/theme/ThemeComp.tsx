import React, { useState, useEffect, useContext } from "react";
import { ThemeContext } from "@/context/ThemeContext"; // Context for editor theme state
import { FontSizeContext } from "@/context/FontSizeContext";
import { Code, Type } from "lucide-react";

interface ThemeSwitcherProps {
  language?: string; // Optional prop for language selection
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ language = "javascript" }) => {
  const { theme, setTheme } = useContext(ThemeContext); // Monaco editor theme
  const { fontSize, setFontSize } = useContext(FontSizeContext);

  return (
    <div className="space-y-6">
      {/* Editor Theme Selection */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold flex items-center mb-4">
          <Code className="w-5 h-5 mr-2" />
          Editor Theme
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Choose a theme for the code editor</p>
        
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="vs">Light</option>
          <option value="vs-dark">Dark</option>
          <option value="hc-black">High Contrast</option>
        </select>
      </div>

      {/* Font Size Selection */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold flex items-center mb-4">
          <Type className="w-5 h-5 mr-2" />
          Font Size
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Adjust the editor font size</p>
        
        <select
          value={fontSize}
          onChange={(e) => setFontSize(+e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value={12}>12px</option>
          <option value={14}>14px</option>
          <option value={16}>16px</option>
          <option value={18}>18px</option>
          <option value={20}>20px</option>
          <option value={22}>22px</option>
          <option value={24}>24px</option>
        </select>
        
        <div className="mt-4 p-3 bg-gray-200 dark:bg-gray-700 rounded-lg">
          <p className="text-sm font-mono" style={{ fontSize: `${fontSize}px` }}>
            Sample code text at {fontSize}px
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThemeSwitcher;
