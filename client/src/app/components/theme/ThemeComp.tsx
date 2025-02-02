import React, { useState, useEffect, useContext } from "react";
import Editor from "@monaco-editor/react";
import { ThemeContext } from "@/context/ThemeContext"; // Context for theme state


interface ThemeSwitcherProps {
  language?: string; // Optional prop for language selection
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ language = "javascript" }) => {
  const { theme, setTheme } = useContext(ThemeContext); // Using context for global theme state
  const [editorTheme, setEditorTheme] = useState(theme || "vs-dark");

  useEffect(() => {
    setEditorTheme(theme); // Sync with context
  }, [theme]);

  return (
    <div className="flex flex-col items-center p-4 w-full">
      {/* Theme Selector Dropdown */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-white">Theme:</span>
        <select
          value={editorTheme}
          onChange={(e) => setTheme(e.target.value)}
          className="p-2 bg-gray-800 text-white rounded"
        >
          <option value="vs">Light</option>
          <option value="vs-dark">Dark</option>
          <option value="hc-black">High Contrast</option>
        </select>
      </div>
    </div>
  );
};

export default ThemeSwitcher;
