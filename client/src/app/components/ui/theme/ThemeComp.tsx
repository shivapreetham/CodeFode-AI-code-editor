import React, { useState, useEffect, useContext } from "react";
import { ThemeContext } from "@/context/ThemeContext"; // Context for editor theme state
import { FontSizeContext } from "@/context/FontSizeContext";
import { DaisyUIThemeContext } from "@/context/DaisyUIThemeContext";
import { Palette, Code, Type } from "lucide-react";

interface ThemeSwitcherProps {
  language?: string; // Optional prop for language selection
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ language = "javascript" }) => {
  const { theme, setTheme } = useContext(ThemeContext); // Monaco editor theme
  const { daisyTheme, setDaisyTheme } = useContext(DaisyUIThemeContext); // DaisyUI theme
  const { fontSize, setFontSize } = useContext(FontSizeContext);

  // Available DaisyUI themes grouped by category
  const themeCategories = {
    "Custom": ["vscode-dark", "vscode-light"],
    "Light": ["light", "cupcake", "bumblebee", "emerald", "corporate", "garden", "lofi", "pastel", "fantasy", "wireframe", "cmyk", "autumn", "acid", "lemonade", "winter"],
    "Dark": ["dark", "synthwave", "retro", "cyberpunk", "valentine", "halloween", "forest", "aqua", "luxury", "dracula", "business", "night", "coffee", "dim", "nord", "sunset", "black"]
  };

  return (
    <div className="space-y-6">
      {/* DaisyUI Theme Selection */}
      <div className="card bg-base-200 shadow">
        <div className="card-body">
          <h3 className="card-title text-lg flex items-center">
            <Palette className="w-5 h-5 mr-2" />
            UI Theme
          </h3>
          <p className="text-sm opacity-70 mb-4">Choose a theme for the entire interface</p>
          
          {Object.entries(themeCategories).map(([category, themes]) => (
            <div key={category} className="mb-4">
              <h4 className="font-semibold mb-2 text-sm opacity-80">{category}</h4>
              <div className="grid grid-cols-2 gap-2">
                {themes.map((themeName) => (
                  <button
                    key={themeName}
                    onClick={() => setDaisyTheme(themeName)}
                    className={`btn btn-sm justify-start ${
                      daisyTheme === themeName ? 'btn-primary' : 'btn-outline'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full mr-2 bg-gradient-to-r from-primary to-secondary"></div>
                      {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Theme Selection */}
      <div className="card bg-base-200 shadow">
        <div className="card-body">
          <h3 className="card-title text-lg flex items-center">
            <Code className="w-5 h-5 mr-2" />
            Editor Theme
          </h3>
          <p className="text-sm opacity-70 mb-4">Choose a theme for the code editor</p>
          
          <div className="form-control">
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="select select-bordered w-full"
            >
              <option value="vs">Light</option>
              <option value="vs-dark">Dark</option>
              <option value="hc-black">High Contrast</option>
            </select>
          </div>
        </div>
      </div>

      {/* Font Size Selection */}
      <div className="card bg-base-200 shadow">
        <div className="card-body">
          <h3 className="card-title text-lg flex items-center">
            <Type className="w-5 h-5 mr-2" />
            Font Size
          </h3>
          <p className="text-sm opacity-70 mb-4">Adjust the editor font size</p>
          
          <div className="form-control">
            <select
              value={fontSize}
              onChange={(e) => setFontSize(+e.target.value)}
              className="select select-bordered w-full"
            >
              <option value={12}>12px</option>
              <option value={14}>14px</option>
              <option value={16}>16px</option>
              <option value={18}>18px</option>
              <option value={20}>20px</option>
              <option value={22}>22px</option>
              <option value={24}>24px</option>
            </select>
          </div>
          
          <div className="mt-4 p-3 bg-base-300 rounded-lg">
            <p className="text-sm font-mono" style={{ fontSize: `${fontSize}px` }}>
              Sample code text at {fontSize}px
            </p>
          </div>
        </div>
      </div>

      {/* Current Theme Preview */}
      <div className="card bg-base-200 shadow">
        <div className="card-body">
          <h3 className="card-title text-lg">Theme Preview</h3>
          <div className="flex flex-wrap gap-2 mt-4">
            <div className="badge badge-primary">Primary</div>
            <div className="badge badge-secondary">Secondary</div>
            <div className="badge badge-accent">Accent</div>
            <div className="badge badge-info">Info</div>
            <div className="badge badge-success">Success</div>
            <div className="badge badge-warning">Warning</div>
            <div className="badge badge-error">Error</div>
          </div>
          <div className="mt-4">
            <button className="btn btn-primary mr-2">Primary Button</button>
            <button className="btn btn-secondary">Secondary Button</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSwitcher;
