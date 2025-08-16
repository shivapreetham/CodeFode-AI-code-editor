"use client";
import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const VSCodeThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'vscode-dark' | 'vscode-light'>('vscode-dark');

  useEffect(() => {
    // Check localStorage or system preference on mount
    const savedTheme = localStorage.getItem('vscode-theme') as 'vscode-dark' | 'vscode-light';
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'vscode-dark' : 'vscode-light');
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vscode-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'vscode-dark' ? 'vscode-light' : 'vscode-dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="activity-button"
      title={`Switch to ${theme === 'vscode-dark' ? 'light' : 'dark'} theme`}
      aria-label={`Switch to ${theme === 'vscode-dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'vscode-dark' ? (
        <Sun className="w-6 h-6" />
      ) : (
        <Moon className="w-6 h-6" />
      )}
    </button>
  );
};

export default VSCodeThemeToggle;